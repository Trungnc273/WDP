import api from './api';

/**
 * Order Service
 * Handles all order and purchase request related API calls
 */

/**
 * Create a purchase request
 */
export const createPurchaseRequest = async (requestData) => {
  try {
    const response = await api.post('/orders/purchase-request', requestData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Seller creates an offer directly from chat
 */
export const createSellerOfferFromChat = async (payload) => {
  try {
    const response = await api.post('/orders/seller-offer', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get sent purchase requests (buyer)
 */
export const getSentPurchaseRequests = async (params = {}) => {
  try {
    const response = await api.get('/orders/purchase-requests/sent', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get received purchase requests (seller)
 */
export const getReceivedPurchaseRequests = async (params = {}) => {
  try {
    const response = await api.get('/orders/purchase-requests/received', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Accept a purchase request
 */
export const acceptPurchaseRequest = async (requestId) => {
  try {
    const response = await api.post(`/orders/${requestId}/accept`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Reject a purchase request
 */
export const rejectPurchaseRequest = async (requestId, reason = '') => {
  try {
    const response = await api.post(`/orders/${requestId}/reject`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Pay for an order
 */
export const payOrder = async (orderId) => {
  try {
    const response = await api.post(`/orders/${orderId}/pay`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Confirm shipment
 */
export const confirmShipment = async (orderId, shipmentData) => {
  try {
    const response = await api.post(`/orders/${orderId}/ship`, shipmentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Confirm receipt
 */
export const confirmReceipt = async (orderId) => {
  try {
    const response = await api.post(`/orders/${orderId}/confirm-receipt`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get orders as buyer
 */
export const getOrdersAsBuyer = async (params = {}) => {
  try {
    const response = await api.get('/orders/buying', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get orders as seller
 */
export const getOrdersAsSeller = async (params = {}) => {
  try {
    const response = await api.get('/orders/selling', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Confirm order by seller
 */
export const confirmOrderBySeller = async (orderId) => {
  try {
    const response = await api.patch(`/orders/${orderId}/confirm`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Confirm delivery (seller action - shipped → delivered)
 */
export const confirmDelivery = async (orderId) => {
  try {
    const response = await api.post(`/orders/${orderId}/deliver`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Buyer cancels order
 */
export const cancelOrder = async (orderId, reason = '') => {
  try {
    const response = await api.post(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const orderService = {
  createPurchaseRequest,
  createSellerOfferFromChat,
  getSentPurchaseRequests,
  getReceivedPurchaseRequests,
  acceptPurchaseRequest,
  rejectPurchaseRequest,
  payOrder,
  confirmShipment,
  confirmDelivery,
  confirmReceipt,
  getOrdersAsBuyer,
  getOrdersAsSeller,
  getOrderById,
  confirmOrderBySeller,
  cancelOrder
};

export default orderService;