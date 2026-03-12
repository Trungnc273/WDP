import api from './api';

/**
 * Service ví
 * Xử lý các API liên quan đến ví và giao dịch ví
 */

/**
 * Lấy số dư ví
 * @returns {Promise<Object>} Thông tin số dư
 */
async function getBalance() {
  try {
    const response = await api.get('/wallets/balance');
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Lấy lịch sử giao dịch
 * @param {Object} params - Tham số truy vấn
 * @param {number} params.page - Trang hiện tại
 * @param {number} params.limit - Số bản ghi mỗi trang
 * @param {string} params.type - Lọc theo loại giao dịch
 * @param {string} params.startDate - Lọc từ ngày
 * @param {string} params.endDate - Lọc đến ngày
 * @returns {Promise<Object>} Dữ liệu giao dịch có phân trang
 */
async function getTransactions(params = {}) {
  try {
    const response = await api.get('/wallets/transactions', { params });
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Tạo yêu cầu rút tiền
 * @param {Object} withdrawalData - Dữ liệu rút tiền
 * @param {number} withdrawalData.amount - Số tiền cần rút
 * @param {Object} withdrawalData.bankAccount - Thông tin tài khoản ngân hàng
 * @returns {Promise<Object>} Kết quả tạo yêu cầu rút tiền
 */
async function createWithdrawal(withdrawalData) {
  try {
    const response = await api.post('/wallets/withdraw', withdrawalData);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Tạo giao dịch nạp tiền qua VNPay
 * @param {Object} paymentData - Dữ liệu thanh toán
 * @param {number} paymentData.amount - Số tiền thanh toán
 * @param {string} paymentData.orderInfo - Mô tả giao dịch
 * @returns {Promise<Object>} Link thanh toán và thông tin giao dịch
 */
async function createVNPayPayment(paymentData) {
  try {
    const response = await api.post('/payments/vnpay/create', paymentData);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

const walletService = {
  getBalance,
  getTransactions,
  createWithdrawal,
  createVNPayPayment
};

export default walletService;