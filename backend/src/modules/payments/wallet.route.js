const express = require('express');
const router = express.Router();
const walletController = require('./wallet.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');

/**
 * Wallet Routes
 * All routes require authentication
 */

// GET /api/wallets/balance - Get wallet balance
router.get('/balance', authenticate, walletController.getBalance);

// GET /api/wallets/transactions - Get transaction history
router.get('/transactions', authenticate, walletController.getTransactions);

// POST /api/wallets/withdraw - Create withdrawal request
router.post('/withdraw', authenticate, walletController.createWithdrawal);

module.exports = router;