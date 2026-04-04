const express = require('express');
const router = express.Router();
const sepayController = require('./sepay.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');

/**
 * SePay Payment Routes
 */

// POST /api/payments/sepay/create - Tạo thanh toán nạp tiền
router.post('/create', authenticate, sepayController.createSePayPayment);

// POST /api/payments/sepay/ipn - Webhook từ SePay (Public)
router.post('/ipn', sepayController.handleSePayIPN);

// GET /api/payments/sepay/return - Kết quả nạp tiền
router.get('/return', sepayController.handleSePayReturn);

// POST /api/payments/sepay/order/:orderId/create - Tạo thanh toán cho đơn hàng
router.post('/order/:orderId/create', authenticate, sepayController.createSePayOrderPayment);

// GET /api/payments/sepay/order/return - Kết quả thanh toán đơn hàng
router.get('/order/return', sepayController.handleSePayOrderReturn);

module.exports = router;
