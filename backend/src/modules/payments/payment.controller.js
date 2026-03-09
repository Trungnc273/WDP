const paymentService = require('./payment.service');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

/**
 * Create VNPay payment
 * POST /api/payments/vnpay/create
 * Body: amount, orderInfo
 */
async function createVNPayPayment(req, res, next) {
  try {
    const userId = req.user.userId;
    const { amount, orderInfo } = req.body;
    const ipAddr = req.ip || req.connection.remoteAddress || '127.0.0.1';
    
    // Validate input
    if (!amount || amount <= 0) {
      return sendError(res, 400, 'Số tiền phải lớn hơn 0');
    }
    
    if (amount < 10000) {
      return sendError(res, 400, 'Số tiền nạp tối thiểu là 10,000 VNĐ');
    }
    
    if (amount > 500000000) {
      return sendError(res, 400, 'Số tiền nạp tối đa là 500,000,000 VNĐ');
    }
    
    const result = await paymentService.createVNPayPayment(
      userId, 
      amount, 
      ipAddr, 
      orderInfo || 'Nạp tiền vào ví'
    );
    
    return sendSuccess(res, 200, result, 'URL thanh toán đã được tạo thành công');
  } catch (error) {
    next(error);
  }
}

/**
 * Handle VNPay IPN callback
 * GET /api/payments/vnpay/callback
 */
async function handleVNPayCallback(req, res, next) {
  try {
    const vnpParams = req.query;
    
    const result = await paymentService.handleVNPayCallback(vnpParams);
    
    if (result.success) {
      return res.status(200).send('OK');
    } else {
      return res.status(400).send('FAIL');
    }
  } catch (error) {
    console.error('VNPay callback error:', error);
    return res.status(500).send('ERROR');
  }
}

/**
 * Handle VNPay return URL (user redirect)
 * GET /api/payments/vnpay/return
 */
async function handleVNPayReturn(req, res, next) {
  try {
    const vnpParams = req.query;
    
    const result = await paymentService.handleVNPayReturn(vnpParams);
    
    // Redirect to frontend with result
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/wallet/topup-result?success=${result.success}&message=${encodeURIComponent(result.message)}`;
    
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('VNPay return error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/wallet/topup-result?success=false&message=${encodeURIComponent('Có lỗi xảy ra trong quá trình xử lý')}`;
    
    return res.redirect(redirectUrl);
  }
}

module.exports = {
  createVNPayPayment,
  handleVNPayCallback,
  handleVNPayReturn
};