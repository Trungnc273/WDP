const EscrowHold = require('./escrow-hold.model');
const Order = require('../orders/order.model');
const Product = require('../products/product.model');
const walletService = require('./wallet.service');
const mongoose = require('mongoose');
const notificationService = require('../notifications/notification.service');

/**
 * Escrow Service
 * Handles holding and releasing funds during transactions
 */

/**
 * Hold funds in escrow (deduct from buyer, create escrow hold)
 */
async function holdFunds(orderId, buyerId, amount) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get order
    const order = await Order.findById(orderId).session(session);
    
    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }
    
    // Verify buyer
    if (order.buyerId.toString() !== buyerId.toString()) {
      throw new Error('Bạn không phải người mua của đơn hàng này');
    }
    
    // Check order status
    if (order.status !== 'awaiting_payment') {
      throw new Error('Đơn hàng không ở trạng thái chờ thanh toán');
    }
    
    // Check if escrow hold already exists
    const existingHold = await EscrowHold.findOne({ orderId }).session(session);
    if (existingHold) {
      throw new Error('Đơn hàng này đã được thanh toán rồi');
    }
    
    const totalToPay = Number(amount || order.totalToPay);
    if (!Number.isFinite(totalToPay) || totalToPay <= 0) {
      throw new Error('Số tiền thanh toán không hợp lệ');
    }

    // Deduct total payment (product amount + platform fee) from buyer wallet
    await walletService.decrementBalance(
      buyerId,
      totalToPay,
      'payment',
      `Thanh toán đơn hàng #${orderId}`,
      { orderId: orderId }
    );

    // Chưa thu phí nền tảng ở bước thanh toán.
    // Phí 5% chỉ ghi nhận khi đơn hoàn thành (khi releaseFunds thành công).
    
    // Create escrow hold
    const escrowHold = await EscrowHold.create([{
      orderId: orderId,
      amount: order.agreedAmount, // Hold only product price, not platform fee
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      status: 'held'
    }], { session });
    
    // Update order status
    order.status = 'paid';
    order.paymentStatus = 'paid';
    order.paidAt = new Date();
    await order.save({ session });
    
    await session.commitTransaction();

    try {
      await Promise.all([
        notificationService.createNotification(order.buyerId, {
          type: 'payment_success',
          orderId: order._id,
          senderId: order.sellerId,
          title: 'Chuyển tiền thành công',
          message: `Bạn đã thanh toán thành công ${totalToPay.toLocaleString('vi-VN')}đ cho đơn hàng này.`
        }),
        notificationService.createNotification(order.sellerId, {
          type: 'payment_success',
          orderId: order._id,
          senderId: order.buyerId,
          title: 'Đơn hàng đã được thanh toán',
          message: 'Người mua đã chuyển tiền thành công. Bạn có thể chuẩn bị giao hàng.'
        })
      ]);
    } catch (notificationError) {
      console.error('Error sending escrow payment notifications:', notificationError);
    }
    
    return escrowHold[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Release funds from escrow to seller (without updating order status)
 */
async function releaseFunds(orderId, reason = 'Người mua đã xác nhận nhận hàng', isAuto = false) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get escrow hold
    const escrowHold = await EscrowHold.findOne({ orderId }).session(session);
    
    if (!escrowHold) {
      throw new Error('Không tìm thấy tiền ký quỹ cho đơn hàng này');
    }
    
    // Check if funds are still held
    if (escrowHold.status !== 'held') {
      throw new Error('Tiền ký quỹ đã được xử lý rồi');
    }
    
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }

    // Chuyển tiền hàng cho người bán khi đơn hoàn thành.
    await walletService.incrementBalance(
      escrowHold.sellerId,
      escrowHold.amount,
      'earning',
      `Thu nhập từ đơn hàng #${orderId}`,
      { orderId: orderId }
    );

    // Thu phí nền tảng 5% tại thời điểm hoàn thành đơn.
    const platformFee = Number(order.platformFee || 0);
    const revenueUserId = process.env.PLATFORM_REVENUE_USER_ID;
    if (
      platformFee > 0 &&
      revenueUserId &&
      mongoose.Types.ObjectId.isValid(revenueUserId) &&
      revenueUserId !== String(escrowHold.sellerId)
    ) {
      await walletService.incrementBalance(
        revenueUserId,
        platformFee,
        'fee',
        `Phí nền tảng từ đơn hàng #${orderId}`,
        { orderId: orderId }
      );
    }
    
    // Update escrow hold status
    escrowHold.status = 'released';
    escrowHold.releasedAt = new Date();
    escrowHold.releaseReason = reason;
    escrowHold.isAutoReleased = isAuto;
    await escrowHold.save({ session });
    
    await session.commitTransaction();
    
    return escrowHold;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Refund funds from escrow to buyer
 */
async function refundFunds(orderId, reason = 'Tranh chấp đã xử lý: Hoàn tiền cho người mua') {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get escrow hold
    const escrowHold = await EscrowHold.findOne({ orderId }).session(session);
    
    if (!escrowHold) {
      throw new Error('Không tìm thấy tiền ký quỹ cho đơn hàng này');
    }
    
    // Check if funds are still held
    if (escrowHold.status !== 'held') {
      throw new Error('Tiền ký quỹ đã được xử lý rồi');
    }
    
    // Get order
    const order = await Order.findById(orderId).session(session);
    
    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }
    
    // Refund to buyer's wallet (including platform fee)
    await walletService.incrementBalance(
      escrowHold.buyerId,
      order.totalToPay, // Refund full amount including platform fee
      'refund',
      `Hoàn tiền đơn hàng #${orderId}`,
      { orderId: orderId }
    );
    
    // Update escrow hold status
    escrowHold.status = 'refunded';
    escrowHold.refundedAt = new Date();
    escrowHold.refundReason = reason;
    await escrowHold.save({ session });
    
    // Update order status
    order.status = 'cancelled';
    order.paymentStatus = 'refunded';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;
    await order.save({ session });

    if (order.productId) {
      const product = await Product.findById(order.productId).session(session);
      if (product && ['pending', 'sold'].includes(product.status)) {
        product.status = 'active';
        await product.save({ session });
      }
    }
    
    await session.commitTransaction();
    
    return escrowHold;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Get escrow holds
 */
async function getEscrowHolds(filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;
  
  const query = {};
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.buyerId) {
    query.buyerId = filters.buyerId;
  }
  
  if (filters.sellerId) {
    query.sellerId = filters.sellerId;
  }
  
  const holds = await EscrowHold.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('orderId', 'agreedAmount status')
    .populate('buyerId', 'fullName email')
    .populate('sellerId', 'fullName email');
  
  const total = await EscrowHold.countDocuments(query);
  
  return {
    holds,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get orders eligible for auto-release
 * Orders that have been shipped for more than 5 days without dispute
 */
async function getOrdersEligibleForAutoRelease() {
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  
  const orders = await Order.find({
    status: 'shipped',
    shippedAt: { $lte: fiveDaysAgo }
  }).populate('productId', 'title');
  
  // Filter out orders with disputes
  const Dispute = require('../reports/dispute.model');
  const ordersWithoutDisputes = [];
  
  for (const order of orders) {
    const dispute = await Dispute.findOne({ orderId: order._id });
    if (!dispute) {
      ordersWithoutDisputes.push(order);
    }
  }
  
  return ordersWithoutDisputes;
}

module.exports = {
  holdFunds,
  releaseFunds,
  refundFunds,
  getEscrowHolds,
  getOrdersEligibleForAutoRelease,
  createEscrowHold
};
/**
 * Create escrow hold without deducting from wallet (funds already deducted)
 */
async function createEscrowHold(buyerId, sellerId, orderId, agreedAmount) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Check if escrow hold already exists
    const existingHold = await EscrowHold.findOne({ orderId }).session(session);
    if (existingHold) {
      throw new Error('Escrow hold đã tồn tại cho đơn hàng này');
    }
    
    // Create escrow hold (only hold the agreed amount, platform fee goes directly to platform)
    const escrowHold = await EscrowHold.create([{
      orderId: orderId,
      amount: agreedAmount, // Hold only product price, not platform fee
      buyerId: buyerId,
      sellerId: sellerId,
      status: 'held'
    }], { session });
    
    await session.commitTransaction();
    
    return escrowHold[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}