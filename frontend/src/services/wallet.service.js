import api from './api';

/**
 * Wallet Service
 * Handles all wallet-related API calls
 */

/**
 * Get wallet balance
 * @returns {Promise<Object>} Balance information
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
 * Get transaction history
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.type - Transaction type filter
 * @param {string} params.startDate - Start date filter
 * @param {string} params.endDate - End date filter
 * @returns {Promise<Object>} Transaction history with pagination
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
 * Create withdrawal request
 * @param {Object} withdrawalData - Withdrawal data
 * @param {number} withdrawalData.amount - Amount to withdraw
 * @param {Object} withdrawalData.bankAccount - Bank account info
 * @returns {Promise<Object>} Withdrawal request
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
 * Create VNPay payment
 * @param {Object} paymentData - Payment data
 * @param {number} paymentData.amount - Amount to pay
 * @param {string} paymentData.orderInfo - Order description
 * @returns {Promise<Object>} Payment URL and transaction info
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