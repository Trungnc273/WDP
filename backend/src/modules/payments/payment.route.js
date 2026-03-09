const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');

/**
 * Payment Routes
 * VNPay integration endpoints
 */

// POST /api/payments/vnpay/create - Create VNPay payment (protected)
router.post('/vnpay/create', authenticate, paymentController.createVNPayPayment);

// GET /api/payments/vnpay/callback - VNPay IPN callback (public)
router.get('/vnpay/callback', paymentController.handleVNPayCallback);

// GET /api/payments/vnpay/return - VNPay return URL (public)
router.get('/vnpay/return', paymentController.handleVNPayReturn);

module.exports = router;