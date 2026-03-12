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
    const { amount, bankAccount, bankName, accountHolder } = req.body;
    const normalizedAmount = Number(amount);
    
    // Validate required fields
    if (!amount || !bankAccount || !bankName || !accountHolder) {
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
      bankAccount,
      bankName,
      accountHolder
    });
    
    return sendSuccess(res, 201, withdrawal, 'Yêu cầu rút tiền đã được tạo thành công');
  } catch (error) {
    if (error.message.includes('không đủ')) {
      return sendError(res, 400, error.message);
    }
    next(error);
  }
}

module.exports = {
  getBalance,
  getTransactions,
  createWithdrawal
};