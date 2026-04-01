const orderService = require('./order.service');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

/**
 * Order Controller
 * Handles purchase requests and order management endpoints
 */

/**
 * Create purchase request
 * POST /api/orders/purchase-request
 */
async function createPurchaseRequest(req, res) {
  try {
    const { listingId, message, agreedPrice } = req.body;
    const buyerId = req.user.userId;
    
    // Validate required fields
    if (!listingId || !message || !agreedPrice) {
      return sendError(res, 400, 'Thiếu thông tin bắt buộc');
    }
    
    const purchaseRequest = await orderService.createPurchaseRequest(
      buyerId, 
      listingId, 
      message, 
      agreedPrice
    );
    
    return sendSuccess(res, 201, purchaseRequest, 'Gửi yêu cầu mua hàng thành công');
  } catch (error) {
    console.error('Create purchase request error:', error);
    return sendError(res, 400, error.message);
  }
}

/**
 * Seller creates offer from chat conversation
 * POST /api/orders/seller-offer
 */
async function createSellerOfferFromChat(req, res) {
  try {
    const sellerId = req.user.userId;
    const { conversationId, message, agreedPrice } = req.body;

    if (!conversationId || !agreedPrice) {
      return sendError(res, 400, 'Thiếu thông tin bắt buộc');
    }

    const result = await orderService.createSellerOfferFromConversation(
      sellerId,
      conversationId,
      message,
      agreedPrice
    );

    return sendSuccess(res, 201, result, 'Gửi đề nghị từ người bán thành công');
  } catch (error) {
    console.error('Create seller offer from chat error:', error);
    return sendError(res, 400, error.message);
  }
}

/**
 * Buyer creates offer from chat conversation
 * POST /api/orders/buyer-offer
 */
async function createBuyerOfferFromChat(req, res) {
  try {
    const buyerId = req.user.userId;
    const { conversationId, message, agreedPrice } = req.body;

    if (!conversationId || !agreedPrice) {
      return sendError(res, 400, 'Thiếu thông tin bắt buộc');
    }

    const result = await orderService.createBuyerOfferFromConversation(
      buyerId,
      conversationId,
      message,
      agreedPrice
    );

    return sendSuccess(res, 201, result, 'Gửi đề nghị từ người mua thành công');
  } catch (error) {
    console.error('Create buyer offer from chat error:', error);
    return sendError(res, 400, error.message);
  }
}

/**
 * Get sent purchase requests (buyer)
 * GET /api/orders/purchase-requests/sent
 */
async function getSentPurchaseRequests(req, res) {
  try {
    const buyerId = req.user.userId;
    const { status, page, limit } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    
    const pagination = { page, limit };
    
    const result = await orderService.getSentPurchaseRequests(buyerId, filters, pagination);
    
    return sendSuccess(res, 200, result, 'Lấy danh sách yêu cầu đã gửi thành công');
  } catch (error) {
    console.error('Get sent purchase requests error:', error);
    return sendError(res, 400, error.message);
  }
}

/**
 * Get received purchase requests (seller)
 * GET /api/orders/purchase-requests/received
 */
async function getReceivedPurchaseRequests(req, res) {
  try {
    const sellerId = req.user.userId;
    const { status, page, limit } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    
    const pagination = { page, limit };
    
    const result = await orderService.getReceivedPurchaseRequests(sellerId, filters, pagination);
    
    return sendSuccess(res, 200, result, 'Lấy danh sách yêu cầu nhận được thành công');
  } catch (error) {
    console.error('Get received purchase requests error:', error);
    return sendError(res, 400, error.message);
  }
}

/**
 * Accept purchase request
 * POST /api/orders/:requestId/accept
 */
async function acceptPurchaseRequest(req, res) {
  try {
    const { requestId } = req.params;
    const sellerId = req.user.userId;
    
    if (!requestId) {
      return sendError(res, 400, 'ID yêu cầu không hợp lệ');
    }
    
    const order = await orderService.acceptPurchaseRequest(requestId, sellerId);
    
    return sendSuccess(res, 200, order, 'Chấp nhận yêu cầu mua hàng thành công');
  } catch (error) {
    console.error('Accept purchase request error:', error);
    return sendError(res, 400, error.message);
  }
}

/**
 * Reject purchase request
 * POST /api/orders/:requestId/reject
 */
async function rejectPurchaseRequest(req, res) {
  try {
    const { requestId } = req.params;
    const sellerId = req.user.userId;
    const { reason } = req.body;
    
    if (!requestId) {
      return sendError(res, 400, 'ID yêu cầu không hợp lệ');
    }
    
    const request = await orderService.rejectPurchaseRequest(requestId, sellerId, reason);
    
    return sendSuccess(res, 200, request, 'Từ chối yêu cầu mua hàng thành công');
  } catch (error) {
    console.error('Reject purchase request error:', error);
    return sendError(res, 400, error.message);
  }
}

/**
 * Get orders as buyer
 * GET /api/orders/buying
 */
async function getOrdersAsBuyer(req, res) {
  try {
    const buyerId = req.user.userId;
    const { status, page, limit } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    
    const pagination = { page, limit };
    
    const result = await orderService.getOrdersAsBuyer(buyerId, filters, pagination);
    
    return sendSuccess(res, 200, result, 'Lấy danh sách đơn hàng mua thành công');
  } catch (error) {
    console.error('Get orders as buyer error:', error);
    return sendError(res, 400, error.message);
  }
}

/**
 * Get orders as seller
 * GET /api/orders/selling
 */
async function getOrdersAsSeller(req, res) {
  try {
    const sellerId = req.user.userId;
    const { status, page, limit } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    
    const pagination = { page, limit };
    
    const result = await orderService.getOrdersAsSeller(sellerId, filters, pagination);
    
    return sendSuccess(res, 200, result, 'Lấy danh sách đơn hàng bán thành công');
  } catch (error) {
    console.error('Get orders as seller error:', error);
    return sendError(res, 400, error.message);
  }
}

/**
 * Get order by ID
 * GET /api/orders/:id
 */
async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    if (!id) {
      return sendError(res, 400, 'ID đơn hàng không hợp lệ');
    }
    
    const order = await orderService.getOrderById(id, userId);
    
    return sendSuccess(res, 200, order, 'Lấy thông tin đơn hàng thành công');
  } catch (error) {
    console.error('Get order by ID error:', error);
    if (error.message.includes('không tồn tại') || error.message.includes('không có quyền')) {
      return sendError(res, 403, error.message);
    }
    return sendError(res, 400, error.message);
  }
}

/**
 * Pay for an order
 * POST /api/orders/:orderId/pay
 */
async function payOrder(req, res) {
  try {
    const { orderId } = req.params;
    const buyerId = req.user.userId;
    
    if (!orderId) {
      return sendError(res, 400, 'ID đơn hàng không hợp lệ');
    }
    
    const order = await orderService.payOrder(orderId, buyerId);
    
    return sendSuccess(res, 200, order, 'Thanh toán đơn hàng thành công');
  } catch (error) {
    console.error('Pay order error:', error);
    if (error.message.includes('không đủ')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('không tồn tại') || error.message.includes('không có quyền')) {
      return sendError(res, 403, error.message);
    }
    return sendError(res, 400, error.message);
  }
}

/**
 * Confirm shipment
 * POST /api/orders/:orderId/ship
 */
async function confirmShipment(req, res) {
  try {
    const { orderId } = req.params;
    const sellerId = req.user.userId;
    const shipmentData = req.body;
    
    if (!orderId) {
      return sendError(res, 400, 'ID đơn hàng không hợp lệ');
    }
    
    const order = await orderService.confirmShipment(orderId, sellerId, shipmentData);
    
    return sendSuccess(res, 200, order, 'Xác nhận giao hàng thành công');
  } catch (error) {
    console.error('Confirm shipment error:', error);
    if (error.message.includes('không tồn tại') || error.message.includes('không có quyền')) {
      return sendError(res, 403, error.message);
    }
    return sendError(res, 400, error.message);
  }
}

/**
 * Confirm receipt
 * POST /api/orders/:orderId/confirm-receipt
 */
async function confirmReceipt(req, res) {
  try {
    const { orderId } = req.params;
    const buyerId = req.user.userId;
    
    if (!orderId) {
      return sendError(res, 400, 'ID đơn hàng không hợp lệ');
    }
    
    const order = await orderService.confirmReceipt(orderId, buyerId);
    
    return sendSuccess(res, 200, order, 'Xác nhận nhận hàng thành công');
  } catch (error) {
    console.error('Confirm receipt error:', error);
    if (error.message.includes('không tồn tại') || error.message.includes('không có quyền')) {
      return sendError(res, 403, error.message);
    }
    return sendError(res, 400, error.message);
  }
}

/**
 * Seller xác nhận đã giao hàng đến nơi
 * POST /api/orders/:orderId/deliver
 */
async function confirmDelivery(req, res) {
  try {
    const { orderId } = req.params;
    const sellerId = req.user.userId;

    if (!orderId) {
      return sendError(res, 400, 'ID đơn hàng không hợp lệ');
    }

    const order = await orderService.confirmDelivery(orderId, sellerId);
    return sendSuccess(res, 200, order, 'Xác nhận giao hàng đến nơi thành công');
  } catch (error) {
    console.error('Confirm delivery error:', error);
    if (error.message.includes('không tồn tại') || error.message.includes('không có quyền')) {
      return sendError(res, 403, error.message);
    }
    return sendError(res, 400, error.message);
  }
}
/**
 * Lấy danh sách toàn bộ đơn hàng (Dành cho Moderator/Admin)
 * GET /api/orders/moderator/all
 */
async function getAllOrdersForMod(req, res) {
  try {
    const { status, page, limit } = req.query;
    const filters = status ? { status } : {};
    const pagination = { page, limit };
    
    // Gọi service để lấy toàn bộ đơn hàng
    const result = await orderService.getAllOrders(filters, pagination);
    
    return sendSuccess(res, 200, result, 'Lấy danh sách toàn bộ đơn hàng thành công');
  } catch (error) {
    console.error('Get all orders for mod error:', error);
    return sendError(res, 400, error.message);
  }
}

/**
 * Ép hủy đơn hàng (Dành cho Moderator/Admin khi phát hiện lừa đảo)
 * POST /api/orders/moderator/:id/force-cancel
 */
async function forceCancelOrder(req, res) {
  try {
    const orderId = req.params.id;
    const moderatorId = req.user.userId;
    const { reason } = req.body; // Lý do hủy đơn (bắt buộc)

    if (!reason) {
      return sendError(res, 400, 'Bắt buộc phải cung cấp lý do hủy đơn');
    }

    // Gọi service thực hiện hủy đơn và hoàn tiền (nếu có)
    const order = await orderService.forceCancelOrder(orderId, moderatorId, reason);
    
    return sendSuccess(res, 200, order, 'Đã ép hủy đơn hàng thành công');
  } catch (error) {
    console.error('Force cancel order error:', error);
    return sendError(res, 400, error.message);
  }
}

/**
 * Confirm order by seller
 * PATCH /api/orders/:id/confirm
 */
async function confirmOrderBySeller(req, res) {
  try {
    const orderId = req.params.id;
    const sellerId = req.user.userId;

    const order = await orderService.confirmOrderBySeller(orderId, sellerId);
    
    return sendSuccess(res, 200, order, 'Đã xác nhận đơn hàng thành công');
  } catch (error) {
    console.error('Confirm order by seller error:', error);
    return sendError(res, 400, error.message);
  }
}

module.exports = {
  createPurchaseRequest,
  createSellerOfferFromChat,
  createBuyerOfferFromChat,
  getSentPurchaseRequests,
  getReceivedPurchaseRequests,
  acceptPurchaseRequest,
  rejectPurchaseRequest,
  payOrder,
  confirmShipment,
  confirmDelivery,
  confirmReceipt,
  getOrdersAsBuyer,
  getOrdersAsSeller,
  getOrderById,
  getAllOrdersForMod, 
  confirmOrderBySeller,
  forceCancelOrder    
};