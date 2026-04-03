const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');
const { requireRole } = require('../../common/middlewares/role.middleware');
/**
 * Order Routes
 * All routes require authentication
 */

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * Purchase Request Routes
 */

// Create purchase request
// POST /api/orders/purchase-request
router.post('/purchase-request', orderController.createPurchaseRequest);

// Seller creates an offer from chat
// POST /api/orders/seller-offer
router.post('/seller-offer', orderController.createSellerOfferFromChat);

// Buyer creates an offer from chat
// POST /api/orders/buyer-offer
router.post('/buyer-offer', orderController.createBuyerOfferFromChat);

// Get sent purchase requests (buyer)
// GET /api/orders/purchase-requests/sent
router.get('/purchase-requests/sent', orderController.getSentPurchaseRequests);

// Get received purchase requests (seller)
// GET /api/orders/purchase-requests/received
router.get('/purchase-requests/received', orderController.getReceivedPurchaseRequests);

// Accept purchase request
// POST /api/orders/:requestId/accept
router.post('/:requestId/accept', orderController.acceptPurchaseRequest);

// Reject purchase request
// POST /api/orders/:requestId/reject
router.post('/:requestId/reject', orderController.rejectPurchaseRequest);

/**
 * Order Management Routes
 */

// Get orders as buyer
// GET /api/orders/buying
router.get('/buying', orderController.getOrdersAsBuyer);

// Get orders as seller
// GET /api/orders/selling
router.get('/selling', orderController.getOrdersAsSeller);

// Get order by ID
// GET /api/orders/:id
router.get('/:id', orderController.getOrderById);

/**
 * Order Payment and Fulfillment Routes
 */

// Pay for order
// POST /api/orders/:orderId/pay
router.post('/:orderId/pay', orderController.payOrder);

// Seller confirm order (change status from awaiting_seller_confirmation to awaiting_payment)
// PATCH /api/orders/:id/confirm
router.patch('/:id/confirm', orderController.confirmOrderBySeller);

// Confirm shipment (seller)
// POST /api/orders/:orderId/ship
router.post('/:orderId/ship', orderController.confirmShipment);

// Confirm delivery (seller) — hàng đã giao đến tay người mua
// POST /api/orders/:orderId/deliver
router.post('/:orderId/deliver', orderController.confirmDelivery);

// Confirm receipt (buyer)
// POST /api/orders/:orderId/confirm-receipt
router.post('/:orderId/confirm-receipt', orderController.confirmReceipt);
/**
 * ==========================================
 * MODERATOR / ADMIN ROUTES
 * ==========================================
 */

// Lấy danh sách toàn bộ đơn hàng trên hệ thống
// GET /api/orders/moderator/all
router.get('/moderator/all', requireRole('admin', 'moderator'), orderController.getAllOrdersForMod);

// Ép hủy một đơn hàng (Ví dụ: khi phát hiện lừa đảo qua báo cáo)
// POST /api/orders/moderator/:id/force-cancel
router.post('/moderator/:id/force-cancel', requireRole('admin', 'moderator'), orderController.forceCancelOrder);

// Buyer cancels order
// POST /api/orders/:id/cancel
router.post('/:id/cancel', orderController.cancelOrderAsBuyer);

module.exports = router;