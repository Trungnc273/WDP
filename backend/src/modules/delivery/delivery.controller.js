const deliveryService = require('./delivery.service');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

/**
 * Create delivery record for an order
 * POST /api/delivery/create
 */
async function createDelivery(req, res) {
  try {
    const { orderId } = req.body;
    const deliveryData = req.body;
    
    if (!orderId) {
      return sendError(res, 'ID đơn hàng là bắt buộc', 400);
    }
    
    const delivery = await deliveryService.createDelivery(orderId, deliveryData);
    
    sendSuccess(res, delivery, 'Tạo thông tin vận chuyển thành công');
  } catch (error) {
    sendError(res, error.message, 400);
  }
}

/**
 * Get delivery information by order ID
 * GET /api/delivery/:orderId
 */
async function getDelivery(req, res) {
  try {
    const { orderId } = req.params;
    
    const delivery = await deliveryService.getDeliveryByOrderId(orderId);
    
    sendSuccess(res, delivery, 'Lấy thông tin vận chuyển thành công');
  } catch (error) {
    sendError(res, error.message, 404);
  }
}

/**
 * Update delivery status
 * PUT /api/delivery/:orderId/status
 */
async function updateDeliveryStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status, location, description } = req.body;
    
    if (!status) {
      return sendError(res, 'Trạng thái vận chuyển là bắt buộc', 400);
    }
    
    const delivery = await deliveryService.updateDeliveryStatus(orderId, status, location, description);
    
    sendSuccess(res, delivery, 'Cập nhật trạng thái vận chuyển thành công');
  } catch (error) {
    sendError(res, error.message, 400);
  }
}

/**
 * Get delivery tracking history
 * GET /api/delivery/:orderId/tracking
 */
async function getTrackingHistory(req, res) {
  try {
    const { orderId } = req.params;
    
    const tracking = await deliveryService.getTrackingHistory(orderId);
    
    sendSuccess(res, tracking, 'Lấy lịch sử vận chuyển thành công');
  } catch (error) {
    sendError(res, error.message, 404);
  }
}

/**
 * Update delivery information
 * PUT /api/delivery/:orderId
 */
async function updateDelivery(req, res) {
  try {
    const { orderId } = req.params;
    const updateData = req.body;
    
    const delivery = await deliveryService.updateDelivery(orderId, updateData);
    
    sendSuccess(res, delivery, 'Cập nhật thông tin vận chuyển thành công');
  } catch (error) {
    sendError(res, error.message, 400);
  }
}

/**
 * Get all deliveries (admin/management)
 * GET /api/delivery/all
 */
async function getAllDeliveries(req, res) {
  try {
    const { status, provider, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (provider) filters.provider = provider;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    
    const result = await deliveryService.getAllDeliveries(filters, parseInt(page), parseInt(limit));
    
    sendSuccess(res, result, 'Lấy danh sách vận chuyển thành công');
  } catch (error) {
    sendError(res, error.message, 400);
  }
}

module.exports = {
  createDelivery,
  getDelivery,
  updateDeliveryStatus,
  getTrackingHistory,
  updateDelivery,
  getAllDeliveries
};