const crypto = require('crypto');
const walletService = require('./wallet.service');
const Transaction = require('./transaction.model');
const { getVNPayConfig } = require('../../config/vnpay');

const MIN_TOPUP_AMOUNT = 10000;
const MAX_TOPUP_AMOUNT = 500000000;

/**
 * VNPay Service
 * Isolated service for VNPay payment flow to improve maintainability.
 */

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();

  keys.forEach((key) => {
    sorted[key] = obj[key];
  });

  return sorted;
}

function toVNPayQuery(params) {
  const sorted = sortObject(params);
  return Object.keys(sorted)
    .map((key) => {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(String(sorted[key])).replace(/%20/g, '+');
      return `${encodedKey}=${encodedValue}`;
    })
    .join('&');
}

async function createVNPayPayment(userId, amount, ipAddr, orderInfo = 'Nạp tiền vào ví') {
  const normalizedAmount = Number(amount);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error('Số tiền không hợp lệ');
  }

  if (!Number.isInteger(normalizedAmount)) {
    throw new Error('Số tiền nạp phải là số nguyên VND');
  }

  if (normalizedAmount < MIN_TOPUP_AMOUNT) {
    throw new Error('Số tiền nạp tối thiểu là 10,000 VND');
  }

  if (normalizedAmount > MAX_TOPUP_AMOUNT) {
    throw new Error('Số tiền nạp tối đa là 500,000,000 VND');
  }

  const config = getVNPayConfig();

  const transaction = await walletService.createTransaction(userId, {
    type: 'deposit',
    amount: normalizedAmount,
    status: 'pending',
    description: orderInfo,
    paymentMethod: 'vnpay'
  });

  const date = new Date();
  const createDate = formatDate(date);
  const orderId = transaction._id.toString();

  let vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: config.tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: normalizedAmount * 100,
    vnp_ReturnUrl: config.returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate
  };

  const signData = toVNPayQuery(vnpParams);
  const hmac = crypto.createHmac('sha512', config.hashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  vnpParams.vnp_SecureHash = signed;

  const paymentUrl = `${config.url}?${toVNPayQuery(vnpParams)}`;

  return {
    paymentUrl,
    transactionId: transaction._id,
    orderId
  };
}

function verifyVNPaySignature(vnpParams) {
  const config = getVNPayConfig();

  const paramsToVerify = { ...vnpParams };
  const secureHash = paramsToVerify.vnp_SecureHash;
  delete paramsToVerify.vnp_SecureHash;
  delete paramsToVerify.vnp_SecureHashType;

  const signData = toVNPayQuery(paramsToVerify);
  const hmac = crypto.createHmac('sha512', config.hashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return secureHash === signed;
}

async function handleVNPayCallback(vnpParams) {
  const isValidSignature = verifyVNPaySignature(vnpParams);

  if (!isValidSignature) {
    return { success: false, message: 'Invalid signature', RspCode: '97' };
  }

  const orderId = vnpParams.vnp_TxnRef;
  const responseCode = vnpParams.vnp_ResponseCode;
  const amount = parseInt(vnpParams.vnp_Amount, 10) / 100;
  const transactionNo = vnpParams.vnp_TransactionNo;
  const bankCode = vnpParams.vnp_BankCode;

  const transaction = await Transaction.findById(orderId);

  if (!transaction) {
    return { success: false, message: 'Transaction not found', RspCode: '01' };
  }

  if (Number(transaction.amount) !== Number(amount)) {
    transaction.status = 'failed';
    transaction.failedAt = new Date();
    transaction.failureReason = 'Số tiền callback không khớp giao dịch';
    await transaction.save();

    return { success: false, message: 'Invalid amount', RspCode: '04' };
  }

  if (transaction.status === 'completed') {
    return { success: true, message: 'Transaction already processed', RspCode: '00' };
  }

  if (responseCode === '00') {
    try {
      // ĐÃ XÓA: Bỏ đoạn tự set status và tự gọi transaction.save() ở đây
      
      // CHỈ GỌI MỘT MÌNH incrementBalance LÀ ĐỦ
      await walletService.incrementBalance(
        transaction.userId,
        amount,
        'deposit',
        `Nạp tiền qua VNPay - ${transactionNo}`,
        {
          transactionId: transaction._id,
          vnpayTransactionNo: transactionNo,
          vnpayTransactionId: transactionNo, // Thêm vào metadata để lưu trữ
          bankCode: bankCode,
          vnpParams: vnpParams
        }
      );

      return { success: true, message: 'Payment successful', RspCode: '00' };
    } catch (error) {
      // Nếu có lỗi khi cộng tiền, lúc này mới tự cập nhật Transaction thành failed
      transaction.status = 'failed';
      transaction.failedAt = new Date();
      transaction.failureReason = error.message;
      await transaction.save();

      return { success: false, message: 'Error processing payment', RspCode: '99' };
    }
  }

  transaction.status = 'failed';
  transaction.failedAt = new Date();
  transaction.failureReason = getVNPayResponseMessage(responseCode);
  transaction.vnpayTransactionNo = transactionNo;
  await transaction.save();

  return {
    success: false,
    message: getVNPayResponseMessage(responseCode),
    RspCode: responseCode
  };
}

async function handleVNPayReturn(vnpParams) {
  const isValidSignature = verifyVNPaySignature(vnpParams);

  if (!isValidSignature) {
    return { success: false, message: 'Chữ ký không hợp lệ' };
  }

  const orderId = vnpParams.vnp_TxnRef;
  const responseCode = vnpParams.vnp_ResponseCode;
  const amount = parseInt(vnpParams.vnp_Amount, 10) / 100;

  let transaction = await Transaction.findById(orderId);

  if (!transaction) {
    return { success: false, message: 'Không tìm thấy giao dịch' };
  }

  if (responseCode === '00' && transaction.status === 'pending') {
    await handleVNPayCallback({ ...vnpParams });
    transaction = await Transaction.findById(orderId);
  }

  const orderInfo = transaction?.description || vnpParams.vnp_OrderInfo || '';

  if (responseCode === '00') {
    return {
      success: true,
      message: 'Nạp tiền thành công',
      amount,
      transactionId: transaction._id,
      orderInfo
    };
  }

  return {
    success: false,
    message: getVNPayResponseMessage(responseCode),
    responseCode,
    orderInfo
  };
}

function getVNPayResponseMessage(responseCode) {
  const messages = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
    '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
    '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
    '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
    '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
    '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
    '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
    '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
    '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
    '75': 'Ngân hàng thanh toán đang bảo trì.',
    '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
    '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
  };

  return messages[responseCode] || 'Lỗi không xác định';
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

module.exports = {
  createVNPayPayment,
  verifyVNPaySignature,
  handleVNPayCallback,
  handleVNPayReturn
};
