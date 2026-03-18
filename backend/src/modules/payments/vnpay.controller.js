const vnpayService = require('./vnpay.service');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

/**
 * VNPay Controller
 * Dedicated controller for VNPay flow.
 */

async function createVNPayPayment(req, res, next) {
  try {
    const userId = req.user.userId;
    const { amount, orderInfo } = req.body;
    const rawIp = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || '127.0.0.1';
    const firstIp = String(rawIp).split(',')[0].trim();
    const ipAddr = firstIp === '::1' ? '127.0.0.1' : firstIp.replace('::ffff:', '') || '127.0.0.1';
    const normalizedAmount = Number(amount);

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return sendError(res, 400, 'Số tiền không hợp lệ');
    }

    if (!Number.isInteger(normalizedAmount)) {
      return sendError(res, 400, 'Số tiền nạp phải là số nguyên VND');
    }

    if (normalizedAmount < 10000) {
      return sendError(res, 400, 'Số tiền nạp tối thiểu là 10,000 VNĐ');
    }

    if (normalizedAmount > 500000000) {
      return sendError(res, 400, 'Số tiền nạp tối đa là 500,000,000 VNĐ');
    }

    const result = await vnpayService.createVNPayPayment(
      userId,
      normalizedAmount,
      ipAddr,
      orderInfo || 'Nạp tiền vào ví'
    );

    return sendSuccess(res, 200, result, 'URL thanh toán đã được tạo thành công');
  } catch (error) {
    next(error);
  }
}

async function handleVNPayCallback(req, res) {
  try {
    const result = await vnpayService.handleVNPayCallback(req.query);

    return res.status(200).json({
      RspCode: result.RspCode || (result.success ? '00' : '99'),
      Message: result.success ? 'Confirm Success' : (result.message || 'Confirm Failed')
    });
  } catch (error) {
    console.error('VNPay callback error:', error);
    return res.status(200).json({
      RspCode: '99',
      Message: 'Unknown error'
    });
  }
}

async function handleVNPayReturn(req, res) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  try {
    const result = await vnpayService.handleVNPayReturn(req.query);

    if (result.success) {
      const successRedirect = `${frontendUrl}/wallet/topup-success?message=${encodeURIComponent(result.message)}&amount=${encodeURIComponent(result.amount || '')}&transactionId=${encodeURIComponent(result.transactionId || '')}&orderInfo=${encodeURIComponent(result.orderInfo || '')}`;
      return res.redirect(successRedirect);
    }

    const failedRedirect = `${frontendUrl}/wallet/topup-result?success=false&message=${encodeURIComponent(result.message)}&orderInfo=${encodeURIComponent(result.orderInfo || '')}`;
    return res.redirect(failedRedirect);
  } catch (error) {
    console.error('VNPay return error:', error);
    const failedRedirect = `${frontendUrl}/wallet/topup-result?success=false&message=${encodeURIComponent('Có lỗi xảy ra trong quá trình xử lý')}`;
    return res.redirect(failedRedirect);
  }
}

module.exports = {
  createVNPayPayment,
  handleVNPayCallback,
  handleVNPayReturn
};
