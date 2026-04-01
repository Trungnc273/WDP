const express = require('express');
const router = express.Router();
const vnpayController = require('./vnpay.controller');
const sepayController = require('./sepay.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');

/**
 * Payment Routes
 * VNPay + SePay integration endpoints
 */

// ─── VNPay (giữ lại để không break) ───────────────────────────────────────
// POST /api/payments/vnpay/create
router.post('/vnpay/create', authenticate, vnpayController.createVNPayPayment);
// GET /api/payments/vnpay/callback
router.get('/vnpay/callback', vnpayController.handleVNPayCallback);
// GET /api/payments/vnpay/return
router.get('/vnpay/return', vnpayController.handleVNPayReturn);

// ─── SePay ────────────────────────────────────────────────────────────────
// POST /api/payments/sepay/create - Tạo thông tin thanh toán (yêu cầu đăng nhập)
router.post('/sepay/create', authenticate, sepayController.createSePayPayment);

// POST /api/payments/sepay/ipn - Webhook từ SePay (public, không cần auth)
router.post('/sepay/ipn', sepayController.handleSePayIPN);

// GET /api/payments/sepay/return - Frontend gọi để lấy trạng thái sau khi redirect về (cho nạp tiền)
router.get('/sepay/return', sepayController.handleSePayReturn);

// POST /api/payments/sepay/order/:orderId/create - Tạo thanh toán SePay cho đơn hàng
router.post('/sepay/order/:orderId/create', authenticate, sepayController.createSePayOrderPayment);

// GET /api/payments/sepay/order/return - Trạng thái sau khi thanh toán đơn hàng xong
router.get('/sepay/order/return', sepayController.handleSePayOrderReturn);

module.exports = router;