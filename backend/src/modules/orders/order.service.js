const Order = require('./order.model');
const PurchaseRequest = require('./purchase-request.model');
const Product = require('../products/product.model');
const User = require('../users/user.model');
const mongoose = require('mongoose');

/**
 * Order Service
 * Handles purchase requests and order management
 */

/**
 * Create a purchase request
 */
async function createPurchaseRequest(buyerId, listingId, message, agreedPrice) {
  // Validate inputs
  if (!message || message.trim().length === 0) {
    throw new Error('Tin nhắn không được để trống');
  }
  
  if (!agreedPrice || agreedPrice <= 0) {
    throw new Error('Giá đề nghị phải lớn hơn 0');
  }
  
  // Get product details
  const product = await Product.findById(listingId);
  
  if (!product) {
    throw new Error('Sản phẩm không tồn tại');
  }
  
  if (product.status !== 'active') {
    throw new Error('Sản phẩm không còn khả dụng');
  }
  
  // Check if buyer is trying to buy their own product
  if (product.seller.toString() === buyerId.toString()) {
    throw new Error('Bạn không thể mua sản phẩm của chính mình');
  }
  
  // Check if there's already a pending request
  const existingRequest = await PurchaseRequest.findOne({
    listingId: listingId,
    buyerId: buyerId,
    status: 'pending'
  });
  
  if (existingRequest) {
    throw new Error('Bạn đã gửi yêu cầu mua sản phẩm này rồi');
  }
  
  // Create purchase request
  const purchaseRequest = await PurchaseRequest.create({
    listingId: listingId,
    buyerId: buyerId,
    sellerId: product.seller,
    message: message.trim(),
    agreedPrice: agreedPrice
  });
  
  // Populate details
  await purchaseRequest.populate([
    { path: 'listingId', select: 'title price images' },
    { path: 'buyerId', select: 'fullName email avatar' },
    { path: 'sellerId', select: 'fullName email' }
  ]);
  
  return purchaseRequest;
}

/**
 * Get purchase requests (sent by buyer)
 */
async function getSentPurchaseRequests(buyerId, filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;
  
  const query = { buyerId };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  const requests = await PurchaseRequest.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('listingId', 'title price images status')
    .populate('sellerId', 'fullName avatar rating');
  
  const total = await PurchaseRequest.countDocuments(query);
  
  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get purchase requests (received by seller)
 */
async function getReceivedPurchaseRequests(sellerId, filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;
  
  const query = { sellerId };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  const requests = await PurchaseRequest.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('listingId', 'title price images status')
    .populate('buyerId', 'fullName avatar rating');
  
  const total = await PurchaseRequest.countDocuments(query);
  
  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Calculate platform fee (5%)
 */
function calculatePlatformFee(amount) {
  return Math.round(amount * 0.05);
}

/**
 * Accept purchase request and create order
 */
async function acceptPurchaseRequest(requestId, sellerId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get purchase request
    const request = await PurchaseRequest.findById(requestId).session(session);
    
    if (!request) {
      throw new Error('Yêu cầu mua hàng không tồn tại');
    }
    
    // Verify seller
    if (request.sellerId.toString() !== sellerId.toString()) {
      throw new Error('Bạn không có quyền chấp nhận yêu cầu này');
    }
    
    // Check if request is still pending
    if (request.status !== 'pending') {
      throw new Error('Yêu cầu này đã được xử lý rồi');
    }
    
    // Get product
    const product = await Product.findById(request.listingId).session(session);
    
    if (!product) {
      throw new Error('Sản phẩm không tồn tại');
    }
    
    if (product.status !== 'active') {
      throw new Error('Sản phẩm không còn khả dụng');
    }
    
    // Calculate fees
    const agreedAmount = request.agreedPrice;
    const platformFee = calculatePlatformFee(agreedAmount);
    const totalToPay = agreedAmount + platformFee;
    
    // Create order
    const order = await Order.create([{
      requestId: request._id,
      buyerId: request.buyerId,
      sellerId: request.sellerId,
      productId: request.listingId,
      agreedAmount: agreedAmount,
      platformFee: platformFee,
      totalToPay: totalToPay,
      status: 'awaiting_payment',
      paymentStatus: 'unpaid'
    }], { session });
    
    // Update purchase request status
    request.status = 'accepted';
    request.acceptedAt = new Date();
    await request.save({ session });
    
    // Update product status to pending (reserved)
    product.status = 'pending';
    await product.save({ session });
    
    await session.commitTransaction();
    
    // Populate order details
    await order[0].populate([
      { path: 'buyerId', select: 'fullName email avatar' },
      { path: 'sellerId', select: 'fullName email avatar' },
      { path: 'productId', select: 'title price images' }
    ]);
    
    return order[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Reject purchase request
 */
async function rejectPurchaseRequest(requestId, sellerId, reason = '') {
  // Get purchase request
  const request = await PurchaseRequest.findById(requestId);
  
  if (!request) {
    throw new Error('Yêu cầu mua hàng không tồn tại');
  }
  
  // Verify seller
  if (request.sellerId.toString() !== sellerId.toString()) {
    throw new Error('Bạn không có quyền từ chối yêu cầu này');
  }
  
  // Check if request is still pending
  if (request.status !== 'pending') {
    throw new Error('Yêu cầu này đã được xử lý rồi');
  }
  
  // Update request status
  request.status = 'rejected';
  request.rejectedAt = new Date();
  request.sellerResponse = reason;
  await request.save();
  
  return request;
}

/**
 * Get order by ID
 */
async function getOrderById(orderId, userId) {
  const order = await Order.findById(orderId)
    .populate('buyerId', 'fullName email phone avatar rating')
    .populate('sellerId', 'fullName email phone avatar rating')
    .populate('productId', 'title description price images condition location category')
    .lean();
  
  if (!order) {
    throw new Error('Đơn hàng không tồn tại');
  }
  
  // Check authorization (buyer or seller only)
  if (order.buyerId._id.toString() !== userId.toString() && 
      order.sellerId._id.toString() !== userId.toString()) {
    throw new Error('Bạn không có quyền xem đơn hàng này');
  }
  
  // Transform the data to match frontend expectations
  const transformedOrder = {
    ...order,
    buyer: order.buyerId,
    seller: order.sellerId,
    listing: order.productId,
    agreedPrice: order.agreedAmount,
    totalAmount: order.totalToPay,
    platformFee: order.platformFee,
    status: order.status === 'awaiting_payment' ? 'pending' : order.status,
    // Add shipping info if exists
    shipping: order.trackingNumber ? {
      provider: order.shippingProvider,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery
    } : null
  };
  
  return transformedOrder;
}

/**
 * Get orders as buyer
 */
async function getOrdersAsBuyer(buyerId, filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;
  
  const query = { buyerId };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sellerId', 'fullName avatar rating')
    .populate('productId', 'title price images condition location category')
    .lean();
  
  // Transform the data to match frontend expectations
  const transformedOrders = orders.map(order => ({
    ...order,
    seller: order.sellerId,
    listing: order.productId,
    agreedPrice: order.agreedAmount,
    totalAmount: order.totalToPay,
    status: order.status === 'awaiting_payment' ? 'pending' : order.status
  }));
  
  const total = await Order.countDocuments(query);
  
  return {
    orders: transformedOrders,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalOrders: total
  };
}

/**
 * Get orders as seller
 */
async function getOrdersAsSeller(sellerId, filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;
  
  const query = { sellerId };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('buyerId', 'fullName avatar rating')
    .populate('productId', 'title price images condition location category')
    .lean();
  
  // Transform the data to match frontend expectations
  const transformedOrders = orders.map(order => ({
    ...order,
    buyer: order.buyerId,
    listing: order.productId,
    agreedPrice: order.agreedAmount,
    totalAmount: order.totalToPay,
    status: order.status === 'awaiting_payment' ? 'pending' : order.status
  }));
  
  const total = await Order.countDocuments(query);
  
  return {
    orders: transformedOrders,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalOrders: total
  };
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, newStatus, userId) {
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new Error('Đơn hàng không tồn tại');
  }
  
  // Check authorization
  if (order.buyerId.toString() !== userId.toString() && 
      order.sellerId.toString() !== userId.toString()) {
    throw new Error('Bạn không có quyền cập nhật đơn hàng này');
  }
  
  order.status = newStatus;
  await order.save();
  
  return order;
}
/**
 * Lấy danh sách toàn bộ đơn hàng (Dành cho Moderator/Admin)
 */
async function getAllOrders(filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;

  // Lấy danh sách kèm theo thông tin người mua, người bán và sản phẩm
  const orders = await Order.find(filters)
    .sort({ createdAt: -1 }) // Đơn mới nhất lên đầu
    .skip(skip)
    .limit(limit)
    .populate('buyerId', 'fullName email avatar')
    .populate('sellerId', 'fullName email avatar')
    .populate('productId', 'title price images');

  const total = await Order.countDocuments(filters);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Ép hủy đơn hàng (Dành cho Moderator/Admin)
 * Chú ý: Có sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu tiền bạc
 */
async function forceCancelOrder(orderId, moderatorId, reason) {
  // Bắt đầu một session để đảm bảo nếu lỗi thì rollback lại toàn bộ
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);

    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }

    // Không thể hủy đơn đã hoàn thành hoặc đã hủy
    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new Error(`Không thể hủy đơn hàng đang ở trạng thái: ${order.status}`);
    }

    // QUAN TRỌNG: Nếu đơn hàng ĐÃ THANH TOÁN (Tiền đang nằm trong Escrow)
    // Thì phải hoàn tiền lại cho người mua (Buyer)
    if (order.paymentStatus === 'paid') {
      const escrowService = require('../payments/escrow.service');
      // Gọi hàm hoàn tiền của Escrow (Giả định bạn đã có hàm refundToBuyer trong escrow.service)
      await escrowService.refundToBuyer(
        orderId, 
        `Hủy bởi Moderator. Lý do: ${reason}`
      );
    }

    // Cập nhật trạng thái đơn thành "Đã hủy"
    order.status = 'cancelled';
    
    // Nếu Model Order của bạn có trường ghi chú hủy đơn thì lưu lại
    if (order.schema.paths.cancelReason !== undefined) {
      order.cancelReason = reason;
    }

    await order.save({ session });
    
    // Lưu thành công toàn bộ thay đổi
    await session.commitTransaction();

    return order;
  } catch (error) {
    // Nếu có lỗi xảy ra ở bất kỳ đâu (đặc biệt là lúc hoàn tiền), Hủy bỏ toàn bộ thao tác
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
module.exports = {
  createPurchaseRequest,
  getSentPurchaseRequests,
  getReceivedPurchaseRequests,
  acceptPurchaseRequest,
  rejectPurchaseRequest,
  calculatePlatformFee,
  getOrderById,
  getOrdersAsBuyer,
  getOrdersAsSeller,
  updateOrderStatus,
  payOrder,
  confirmShipment,
  confirmReceipt,
  getAllOrders,     
  forceCancelOrder  
};
/**
 * Pay for an order (simplified version without wallet integration)
 */
async function payOrder(orderId, buyerId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get order details
    const order = await Order.findById(orderId).session(session);
    
    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }
    
    // Verify buyer
    if (order.buyerId.toString() !== buyerId.toString()) {
      throw new Error('Bạn không có quyền thanh toán đơn hàng này');
    }
    
    // Check order status
    if (order.status !== 'awaiting_payment') {
      throw new Error('Đơn hàng không ở trạng thái chờ thanh toán');
    }
    
    if (order.paymentStatus !== 'unpaid') {
      throw new Error('Đơn hàng đã được thanh toán rồi');
    }
    
    // Import escrow service
    const escrowService = require('../payments/escrow.service');
    
    // For now, simulate successful payment without wallet check
    // TODO: Integrate with wallet service when wallet routes are fixed
    
    // Create escrow hold
    const escrowHold = await escrowService.createEscrowHold(
      buyerId,
      order.sellerId,
      order._id,
      order.agreedAmount
    );
    
    // Update order status
    order.status = 'paid';
    order.paymentStatus = 'paid';
    order.paidAt = new Date();
    order.escrowHoldId = escrowHold._id;
    await order.save({ session });
    
    await session.commitTransaction();
    
    // Populate order details
    await order.populate([
      { path: 'buyerId', select: 'fullName email avatar' },
      { path: 'sellerId', select: 'fullName email avatar' },
      { path: 'productId', select: 'title price images' }
    ]);
    
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
/**
 * Confirm shipment (seller action)
 */
async function confirmShipment(orderId, sellerId, shipmentData = {}) {
  try {
    // Get order
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }
    
    // Verify seller
    if (order.sellerId.toString() !== sellerId.toString()) {
      throw new Error('Bạn không có quyền xác nhận giao hàng cho đơn hàng này');
    }
    
    // Check order status
    if (order.status !== 'paid') {
      throw new Error('Đơn hàng chưa được thanh toán');
    }
    
    // Update order status
    order.status = 'shipped';
    order.shippedAt = new Date();
    
    // Add shipment information if provided
    if (shipmentData.trackingNumber) {
      order.trackingNumber = shipmentData.trackingNumber;
    }
    if (shipmentData.shippingProvider) {
      order.shippingProvider = shipmentData.shippingProvider;
    }
    if (shipmentData.estimatedDelivery) {
      order.estimatedDelivery = new Date(shipmentData.estimatedDelivery);
    }
    
    await order.save();
    
    // Populate order details
    await order.populate([
      { path: 'buyerId', select: 'fullName email avatar' },
      { path: 'sellerId', select: 'fullName email avatar' },
      { path: 'productId', select: 'title price images' }
    ]);
    
    return order;
  } catch (error) {
    throw error;
  }
}

/**
 * Confirm receipt (buyer action) - releases funds to seller
 */
async function confirmReceipt(orderId, buyerId) {
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
      throw new Error('Bạn không có quyền xác nhận nhận hàng cho đơn hàng này');
    }
    
    // Check order status
    if (order.status !== 'shipped') {
      throw new Error('Đơn hàng chưa được giao');
    }
    
    // Import escrow service
    const escrowService = require('../payments/escrow.service');
    
    // Release funds from escrow to seller
    await escrowService.releaseFunds(orderId, 'Buyer confirmed receipt');
    
    // Update order status
    order.status = 'completed';
    order.completedAt = new Date();
    await order.save({ session });
    
    await session.commitTransaction();
    
    // Populate order details
    await order.populate([
      { path: 'buyerId', select: 'fullName email avatar' },
      { path: 'sellerId', select: 'fullName email avatar' },
      { path: 'productId', select: 'title price images' }
    ]);
    
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}