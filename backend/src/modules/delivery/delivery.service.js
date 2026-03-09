const Delivery = require('./delivery.model');
const Order = require('../orders/order.model');

/**
 * Delivery Service
 * Handles shipping and delivery operations
 */

/**
 * Create delivery record for an order
 */
async function createDelivery(orderId, deliveryData) {
  const { provider, trackingNumber, estimatedDelivery, shippingAddress, notes } = deliveryData;
  
  // Validate required fields
  if (!provider) {
    throw new Error('Vui lòng chọn đơn vị vận chuyển');
  }
  
  // Check if order exists
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error('Đơn hàng không tồn tại');
  }
  
  // Check if delivery already exists for this order
  const existingDelivery = await Delivery.findOne({ orderId });
  if (existingDelivery) {
    throw new Error('Thông tin vận chuyển đã tồn tại cho đơn hàng này');
  }
  
  // Create delivery record
  const delivery = new Delivery({
    orderId,
    provider,
    trackingNumber: trackingNumber || '',
    estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
    shippingAddress,
    notes: notes || '',
    status: 'pending'
  });
  
  await delivery.save();
  
  // Update order status to shipped if not already
  if (order.status !== 'shipped') {
    order.status = 'shipped';
    order.shippedAt = new Date();
    await order.save();
  }
  
  return delivery;
}

/**
 * Get delivery information by order ID
 */
async function getDeliveryByOrderId(orderId) {
  const delivery = await Delivery.findOne({ orderId })
    .populate('orderId', 'orderNumber status buyer seller product');
  
  if (!delivery) {
    throw new Error('Không tìm thấy thông tin vận chuyển');
  }
  
  return delivery;
}

/**
 * Update delivery status
 */
async function updateDeliveryStatus(orderId, status, location, description) {
  const delivery = await Delivery.findOne({ orderId });
  
  if (!delivery) {
    throw new Error('Không tìm thấy thông tin vận chuyển');
  }
  
  // Add tracking update
  await delivery.addTrackingUpdate(status, location, description);
  
  // If delivered, update order status
  if (status === 'delivered') {
    const order = await Order.findById(orderId);
    if (order && order.status === 'shipped') {
      order.status = 'delivered';
      order.deliveredAt = new Date();
      await order.save();
    }
  }
  
  return delivery;
}

/**
 * Get delivery tracking history
 */
async function getTrackingHistory(orderId) {
  const delivery = await Delivery.findOne({ orderId }).select('trackingHistory status provider trackingNumber');
  
  if (!delivery) {
    throw new Error('Không tìm thấy thông tin vận chuyển');
  }
  
  return {
    provider: delivery.provider,
    trackingNumber: delivery.trackingNumber,
    currentStatus: delivery.status,
    history: delivery.trackingHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  };
}

/**
 * Update delivery information
 */
async function updateDelivery(orderId, updateData) {
  const allowedFields = ['provider', 'trackingNumber', 'estimatedDelivery', 'shippingAddress', 'notes'];
  const filteredData = {};
  
  // Only allow specific fields to be updated
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  });
  
  if (Object.keys(filteredData).length === 0) {
    throw new Error('Không có dữ liệu để cập nhật');
  }
  
  const delivery = await Delivery.findOneAndUpdate(
    { orderId },
    filteredData,
    { new: true, runValidators: true }
  );
  
  if (!delivery) {
    throw new Error('Không tìm thấy thông tin vận chuyển');
  }
  
  return delivery;
}

/**
 * Get all deliveries (for admin/management)
 */
async function getAllDeliveries(filters = {}, page = 1, limit = 20) {
  const query = {};
  
  // Apply filters
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.provider) {
    query.provider = filters.provider;
  }
  
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) {
      query.createdAt.$gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      query.createdAt.$lte = new Date(filters.dateTo);
    }
  }
  
  const skip = (page - 1) * limit;
  
  const [deliveries, total] = await Promise.all([
    Delivery.find(query)
      .populate('orderId', 'orderNumber status buyer seller product totalAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Delivery.countDocuments(query)
  ]);
  
  return {
    deliveries,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

module.exports = {
  createDelivery,
  getDeliveryByOrderId,
  updateDeliveryStatus,
  getTrackingHistory,
  updateDelivery,
  getAllDeliveries
};