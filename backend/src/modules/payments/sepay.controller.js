const sepayService = require('./sepay.service');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

/**
 * SePay Controller
 * Endpoints for SePay Payment Gateway integration
 */

/**
 * POST /api/payments/sepay/create
 * Tạo thông tin để hiển thị form thanh toán SePay
 */
async function createSePayPayment(req, res, next) {
  try {
    const userId = req.user.userId;
    const { amount, orderInfo } = req.body;
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

    const result = await sepayService.createSePayPayment(
      userId,
      normalizedAmount,
      orderInfo || `Nạp ${normalizedAmount.toLocaleString('vi-VN')} VNĐ vào ví`
    );

    return sendSuccess(res, 200, result, 'Thông tin thanh toán đã sẵn sàng');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/payments/sepay/ipn
 * Webhook nhận thông báo từ SePay khi có thanh toán thành công
 * Header: X-Secret-Key: <secret_key>
 * PHẢI trả về HTTP 200 để SePay không retry
 */
async function handleSePayIPN(req, res) {
  try {
    // SEPay might send X-Secret-Key or X-SePay-Secret-Key
    const receivedSecretKey = req.headers['x-secret-key'] || req.headers['x-sepay-secret-key'] || req.query.secret_key;
    
    console.log('[SEPay IPN] Incoming request from:', req.ip);
    console.log('[SEPay IPN] Headers received:', JSON.stringify(req.headers));

    const result = await sepayService.handleSePayIPN(req.body, receivedSecretKey);

    if (!result.success) {
      console.warn('[SEPay IPN] Logic failed:', result.message);
    } else {
      console.log('[SEPay IPN] Success:', result.message);
    }

    // Always return 200 to acknowledge SePay
    return res.status(200).json({ success: result.success, message: result.message });
  } catch (error) {
    console.error('[SEPay IPN Controller] Critical Error:', error.message);
    // Return 200 to stop retries even on internal errors
    return res.status(200).json({ success: false, message: 'Internal error' });
  }
}

/**
 * GET /api/payments/sepay/return?transactionId=xxx
 * Success URL callback — frontend gọi để lấy trạng thái giao dịch nạp tiền
 */
async function handleSePayReturn(req, res, next) {
  try {
    const { transactionId } = req.query;
    const result = await sepayService.handleSePayReturn(transactionId);
    return sendSuccess(res, 200, result, result.message);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/payments/sepay/order/:orderId/create
 * Tạo thông tin thanh toán SePay cho Đơn hàng
 */
async function createSePayOrderPayment(req, res, next) {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;
    const { amount, orderInfo } = req.body;
    
    // We expect the frontend to pass the exact amount needed for the order
    const result = await sepayService.createSePayOrderPayment(userId, orderId, amount, orderInfo);
    return sendSuccess(res, 200, result, 'Thông tin thanh toán đơn hàng đã sẵn sàng');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/payments/sepay/order/return?transactionId=xxx
 * Success URL callback — frontend gọi để lấy trạng thái giao dịch thanh toán đơn hàng
 */
async function handleSePayOrderReturn(req, res, next) {
  try {
    const { transactionId } = req.query;
    const result = await sepayService.handleSePayOrderReturn(transactionId);
    return sendSuccess(res, 200, result, result.message);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createSePayPayment,
  createSePayOrderPayment,
  handleSePayIPN,
  handleSePayReturn,
  handleSePayOrderReturn,
};
