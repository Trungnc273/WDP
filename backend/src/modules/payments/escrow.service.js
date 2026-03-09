const EscrowHold = require('./escrow-hold.model');
const Order = require('../orders/order.model');
const walletService = require('./wallet.service');
const mongoose = require('mongoose');

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
    
    // Deduct from buyer's wallet
    await walletService.decrementBalance(
      buyerId,
      amount,
      'payment',
      `Thanh toán đơn hàng #${orderId}`,
      { orderId: orderId }
    );
    
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
async function releaseFunds(orderId, reason = 'Buyer confirmed receipt', isAuto = false) {
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
    
    // For now, simulate releasing funds without wallet integration
    // TODO: Integrate with wallet service when wallet routes are fixed
    // await walletService.incrementBalance(
    //   escrowHold.sellerId,
    //   escrowHold.amount,
    //   'earning',
    //   `Thu nhập từ đơn hàng #${orderId}`,
    //   { orderId: orderId }
    // );
    
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
async function refundFunds(orderId, reason = 'Dispute resolved in favor of buyer') {
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
    await escrowHold.refund(reason);
    
    // Update order status
    order.status = 'cancelled';
    order.paymentStatus = 'refunded';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;
    await order.save({ session });
    
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