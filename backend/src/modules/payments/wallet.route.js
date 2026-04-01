const express = require('express');
const router = express.Router();
const walletController = require('./wallet.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');
const { requireRole } = require('../../common/middlewares/role.middleware');

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

// ─── Admin withdrawal management ──────────────────────────────────────────
// GET /api/wallets/admin/withdrawals - Danh sách lệnh rút đang chờ
router.get('/admin/withdrawals', authenticate, requireRole('admin'), walletController.getPendingWithdrawals);

// POST /api/wallets/admin/withdrawals/:id/approve - Duyệt lệnh rút
router.post('/admin/withdrawals/:id/approve', authenticate, requireRole('admin'), walletController.approveWithdrawal);

// POST /api/wallets/admin/withdrawals/:id/reject - Từ chối lệnh rút
router.post('/admin/withdrawals/:id/reject', authenticate, requireRole('admin'), walletController.rejectWithdrawal);

module.exports = router;