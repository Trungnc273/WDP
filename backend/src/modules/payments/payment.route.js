const express = require('express');
const router = express.Router();
const vnpayController = require('./vnpay.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');

/**
 * Payment Routes
 * VNPay integration endpoints
 */

// POST /api/payments/vnpay/create - Create VNPay payment (protected)
router.post('/vnpay/create', authenticate, vnpayController.createVNPayPayment);

// GET /api/payments/vnpay/callback - VNPay IPN callback (public)
router.get('/vnpay/callback', vnpayController.handleVNPayCallback);

// GET /api/payments/vnpay/return - VNPay return URL (public)
router.get('/vnpay/return', vnpayController.handleVNPayReturn);

module.exports = router;