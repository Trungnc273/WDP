import api from './api';

/**
 * SePay Service (Frontend)
 */

/**
 * Submit a hidden POST form to the SEPay checkout page.
 * @param {string} checkoutUrl  - The SEPay checkout endpoint URL
 * @param {object} fields       - Form fields (must include 'signature')
 */
export function postToSepay(checkoutUrl, fields) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = checkoutUrl;
  form.style.display = 'none';

  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

const sePayService = {
  /**
   * Create a SEPay top-up payment.
   * Returns { checkoutUrl, fields, transactionId }
   */
  createPayment: async (data) => {
    const response = await api.post('/payments/sepay/create', data);
    return response.data?.data || response.data;
  },

  /**
   * Check top-up transaction status (called on success_url return)
   */
  checkTransactionStatus: async (transactionId) => {
    const response = await api.get('/payments/sepay/return', {
      params: { transactionId },
    });
    return response.data?.data || response.data;
  },

  /**
   * Create a SEPay order payment.
   * Returns { checkoutUrl, fields, transactionId }
   */
  createOrderPayment: async (orderId, data) => {
    const response = await api.post(`/payments/sepay/order/${orderId}/create`, data);
    return response.data?.data || response.data;
  },

  /**
   * Check order payment transaction status (called on success_url return)
   */
  checkOrderTransactionStatus: async (transactionId) => {
    const response = await api.get('/payments/sepay/order/return', {
      params: { transactionId },
    });
    return response.data?.data || response.data;
  },
};

export default sePayService;
