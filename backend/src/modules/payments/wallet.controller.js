const walletService = require('./wallet.service');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

/**
 * Get wallet balance
 * GET /api/wallets/balance
 */
async function getBalance(req, res, next) {
  try {
    const userId = req.user.userId;
    
    const balance = await walletService.getBalance(userId);
    
    return sendSuccess(res, 200, balance, 'Thông tin ví được tải thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Get transaction history
 * GET /api/wallets/transactions
 * Query params: page, limit, type, startDate, endDate
 */
async function getTransactions(req, res, next) {
  try {
    const userId = req.user.userId;
    const allowedTypes = new Set(['deposit', 'withdrawal', 'payment', 'refund', 'earning', 'fee']);
    
    // Parse filters
    const filters = {};
    if (req.query.type) {
      if (!allowedTypes.has(req.query.type)) {
        return sendError(res, 400, 'Loại giao dịch không hợp lệ');
      }
      filters.type = req.query.type;
    }

    if (req.query.startDate) {
      const start = new Date(req.query.startDate);
      if (Number.isNaN(start.getTime())) {
        return sendError(res, 400, 'startDate không hợp lệ');
      }
      filters.startDate = start;
    }

    if (req.query.endDate) {
      const end = new Date(req.query.endDate);
      if (Number.isNaN(end.getTime())) {
        return sendError(res, 400, 'endDate không hợp lệ');
      }
      filters.endDate = end;
    }

    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      return sendError(res, 400, 'Khoảng thời gian lọc không hợp lệ');
    }
    
    // Parse pagination
    const pagination = {
      page: req.query.page,
      limit: req.query.limit
    };
    
    const result = await walletService.getTransactions(userId, filters, pagination);
    
    return sendSuccess(res, 200, result, 'Lịch sử giao dịch được tải thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Create withdrawal request
 * POST /api/wallets/withdraw
 */
async function createWithdrawal(req, res, next) {
  try {
    const userId = req.user.userId;
    const { amount, bankAccount, bankName, accountHolder, accountName } = req.body;
    const normalizedAmount = Number(amount);
    const normalizedBankAccount = typeof bankAccount === 'object' && bankAccount !== null
      ? bankAccount.accountNumber
      : bankAccount;
    const normalizedBankName = typeof bankAccount === 'object' && bankAccount !== null
      ? bankAccount.bankName
      : bankName;
    const normalizedAccountHolder = typeof bankAccount === 'object' && bankAccount !== null
      ? (bankAccount.accountName || bankAccount.accountHolder)
      : (accountHolder || accountName);
    
    // Validate required fields
    if (!amount || !normalizedBankAccount || !normalizedBankName || !normalizedAccountHolder) {
      return sendError(res, 400, 'Thiếu thông tin bắt buộc');
    }
    
    // Validate amount
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return sendError(res, 400, 'Số tiền rút không hợp lệ');
    }

    if (!Number.isInteger(normalizedAmount)) {
      return sendError(res, 400, 'Số tiền rút phải là số nguyên VND');
    }

    if (normalizedAmount < 50000) {
      return sendError(res, 400, 'Số tiền rút tối thiểu là 50,000 VND');
    }
    
    const withdrawal = await walletService.createWithdrawal(userId, {
      amount: normalizedAmount,
      bankAccount: normalizedBankAccount,
      bankName: normalizedBankName,
      accountHolder: normalizedAccountHolder
    });
    
    return sendSuccess(res, 201, withdrawal, 'Yêu cầu rút tiền đã được tạo thành công');
  } catch (error) {
    if (error.message.includes('không đủ')) {
      return sendError(res, 400, error.message);
    }
    next(error);
  }
}

/**
 * [ADMIN] Lấy danh sách lệnh rút tiền đang chờ
 * GET /api/wallets/admin/withdrawals
 */
async function getPendingWithdrawals(req, res, next) {
  try {
    const Transaction = require('./transaction.model');
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [withdrawals, total] = await Promise.all([
      Transaction.find({ type: 'withdrawal', status })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'fullName email phone'),
      Transaction.countDocuments({ type: 'withdrawal', status })
    ]);

    return sendSuccess(res, 200, {
      withdrawals,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
    }, 'Lấy danh sách yêu cầu rút tiền thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * [ADMIN] Duyệt lệnh rút tiền
 * POST /api/wallets/admin/withdrawals/:id/approve
 */
async function approveWithdrawal(req, res, next) {
  try {
    const { id } = req.params;
    const Transaction = require('./transaction.model');
    const Wallet = require('./wallet.model');
    const mongoose = require('mongoose');

    const tx = await Transaction.findById(id);
    if (!tx || tx.type !== 'withdrawal') {
      return sendError(res, 404, 'Không tìm thấy lệnh rút tiền');
    }
    if (tx.status !== 'pending') {
      return sendError(res, 400, 'Lệnh rút đã được xử lý');
    }

    // Trừ tiền khỏi ví người dùng (atomic)
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const wallet = await Wallet.findOne({ userId: tx.userId }).session(session);
      if (!wallet || wallet.balance < tx.amount) {
        await session.abortTransaction();
        return sendError(res, 400, 'Số dư không đủ');
      }
      const balanceBefore = wallet.balance;
      wallet.balance -= tx.amount;
      wallet.totalWithdrawn += tx.amount;
      await wallet.save({ session });

      tx.status = 'completed';
      tx.completedAt = new Date();
      tx.balanceBefore = balanceBefore;
      tx.balanceAfter = wallet.balance;
      tx.metadata = { ...(tx.metadata || {}), approvedBy: req.user.userId, approvedAt: new Date() };
      await tx.save({ session });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    return sendSuccess(res, 200, tx, 'Duyệt lệnh rút tiền thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * [ADMIN] Từ chối lệnh rút tiền
 * POST /api/wallets/admin/withdrawals/:id/reject
 */
async function rejectWithdrawal(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const Transaction = require('./transaction.model');

    const tx = await Transaction.findById(id);
    if (!tx || tx.type !== 'withdrawal') {
      return sendError(res, 404, 'Không tìm thấy lệnh rút tiền');
    }
    if (tx.status !== 'pending') {
      return sendError(res, 400, 'Lệnh rút đã được xử lý');
    }

    tx.status = 'cancelled';
    tx.cancelledAt = new Date();
    tx.failureReason = reason || 'Admin từ chối';
    tx.metadata = { ...(tx.metadata || {}), rejectedBy: req.user.userId, rejectedAt: new Date(), reason };
    await tx.save();

    return sendSuccess(res, 200, tx, 'Từ chối lệnh rút tiền thành công');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getBalance,
  getTransactions,
  createWithdrawal,
  getPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
};