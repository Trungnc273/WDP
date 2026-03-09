const crypto = require('crypto');
const querystring = require('querystring');
const walletService = require('./wallet.service');
const Transaction = require('./transaction.model');

/**
 * Payment Service
 * Handles VNPay payment gateway integration
 */

// VNPay configuration (will be loaded from env)
const getVNPayConfig = () => ({
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || 'DEMO',
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || 'DEMOSECRET',
  vnp_Url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/wallet/vnpay-return'
});

/**
 * Sort object by key (required for VNPay signature)
 */
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  
  keys.forEach(key => {
    sorted[key] = obj[key];
  });
  
  return sorted;
}

/**
 * Create VNPay payment URL
 */
async function createVNPayPayment(userId, amount, ipAddr, orderInfo = 'Nạp tiền vào ví') {
  // Validate amount
  if (!amount || amount < 10000) {
    throw new Error('Số tiền nạp tối thiểu là 10,000 VND');
  }
  
  if (amount > 500000000) {
    throw new Error('Số tiền nạp tối đa là 500,000,000 VND');
  }
  
  const config = getVNPayConfig();
  
  // Create transaction record
  const transaction = await walletService.createTransaction(userId, {
    type: 'deposit',
    amount: amount,
    status: 'pending',
    description: orderInfo,
    paymentMethod: 'vnpay'
  });
  
  // Create VNPay parameters
  const date = new Date();
  const createDate = formatDate(date);
  const orderId = transaction._id.toString();
  
  let vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: config.vnp_TmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: amount * 100, // VNPay requires amount in smallest unit (VND * 100)
    vnp_ReturnUrl: config.vnp_ReturnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate
  };
  
  // Sort parameters
  vnp_Params = sortObject(vnp_Params);
  
  // Create signature
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac('sha512', config.vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  vnp_Params['vnp_SecureHash'] = signed;
  
  // Create payment URL
  const paymentUrl = config.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });
  
  return {
    paymentUrl,
    transactionId: transaction._id,
    orderId: orderId
  };
}

/**
 * Verify VNPay signature
 */
function verifyVNPaySignature(vnpParams) {
  const config = getVNPayConfig();
  
  const secureHash = vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHashType'];
  
  // Sort parameters
  const sortedParams = sortObject(vnpParams);
  
  // Create signature
  const signData = querystring.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac('sha512', config.vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  
  return secureHash === signed;
}

/**
 * Handle VNPay callback (IPN)
 */
async function handleVNPayCallback(vnpParams) {
  // Verify signature
  const isValidSignature = verifyVNPaySignature(vnpParams);
  
  if (!isValidSignature) {
    return {
      success: false,
      message: 'Invalid signature',
      RspCode: '97'
    };
  }
  
  const orderId = vnpParams['vnp_TxnRef'];
  const responseCode = vnpParams['vnp_ResponseCode'];
  const amount = parseInt(vnpParams['vnp_Amount']) / 100; // Convert back to VND
  const transactionNo = vnpParams['vnp_TransactionNo'];
  const bankCode = vnpParams['vnp_BankCode'];
  
  // Get transaction
  const transaction = await Transaction.findById(orderId);
  
  if (!transaction) {
    return {
      success: false,
      message: 'Transaction not found',
      RspCode: '01'
    };
  }
  
  // Check if transaction is already processed
  if (transaction.status === 'completed') {
    return {
      success: true,
      message: 'Transaction already processed',
      RspCode: '00'
    };
  }
  
  // Check response code
  if (responseCode === '00') {
    // Payment successful
    try {
      // Update transaction
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      transaction.vnpayTransactionId = transactionNo;
      transaction.vnpayTransactionNo = transactionNo;
      transaction.metadata = {
        ...transaction.metadata,
        bankCode: bankCode,
        vnpParams: vnpParams
      };
      await transaction.save();
      
      // Credit wallet
      await walletService.incrementBalance(
        transaction.userId,
        amount,
        'deposit',
        `Nạp tiền qua VNPay - ${transactionNo}`,
        {
          transactionId: transaction._id,
          vnpayTransactionNo: transactionNo,
          bankCode: bankCode
        }
      );
      
      return {
        success: true,
        message: 'Payment successful',
        RspCode: '00'
      };
    } catch (error) {
      console.error('Error processing VNPay callback:', error);
      
      // Update transaction as failed
      transaction.status = 'failed';
      transaction.failedAt = new Date();
      transaction.failureReason = error.message;
      await transaction.save();
      
      return {
        success: false,
        message: 'Error processing payment',
        RspCode: '99'
      };
    }
  } else {
    // Payment failed
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
}

/**
 * Handle VNPay return (user redirect)
 */
async function handleVNPayReturn(vnpParams) {
  // Verify signature
  const isValidSignature = verifyVNPaySignature(vnpParams);
  
  if (!isValidSignature) {
    return {
      success: false,
      message: 'Chữ ký không hợp lệ'
    };
  }
  
  const orderId = vnpParams['vnp_TxnRef'];
  const responseCode = vnpParams['vnp_ResponseCode'];
  const amount = parseInt(vnpParams['vnp_Amount']) / 100;
  
  // Get transaction
  const transaction = await Transaction.findById(orderId);
  
  if (!transaction) {
    return {
      success: false,
      message: 'Không tìm thấy giao dịch'
    };
  }
  
  if (responseCode === '00') {
    return {
      success: true,
      message: 'Nạp tiền thành công',
      amount: amount,
      transactionId: transaction._id
    };
  } else {
    return {
      success: false,
      message: getVNPayResponseMessage(responseCode),
      responseCode: responseCode
    };
  }
}

/**
 * Get VNPay response message
 */
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

/**
 * Format date for VNPay (yyyyMMddHHmmss)
 */
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
