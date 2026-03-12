import api from './api';

/**
 * VNPay Service
 * Isolated VNPay API calls for maintainability.
 */

const vnpayService = {
  createPayment: async ({ amount, orderInfo }) => {
    const response = await api.post('/payments/vnpay/create', {
      amount,
      orderInfo
    });
    return response.data.data;
  }
};

export default vnpayService;
