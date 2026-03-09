import api from './api';

/**
 * Delivery Service
 * Handles shipping and delivery API calls
 */

/**
 * Create delivery record for an order
 */
export const createDelivery = async (deliveryData) => {
  try {
    const response = await api.post('/delivery/create', deliveryData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Có lỗi xảy ra khi tạo thông tin vận chuyển' };
  }
};

/**
 * Get delivery information by order ID
 */
export const getDeliveryByOrderId = async (orderId) => {
  try {
    const response = await api.get(`/delivery/${orderId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Có lỗi xảy ra khi lấy thông tin vận chuyển' };
  }
};

/**
 * Update delivery status
 */
export const updateDeliveryStatus = async (orderId, statusData) => {
  try {
    const response = await api.put(`/delivery/${orderId}/status`, statusData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Có lỗi xảy ra khi cập nhật trạng thái vận chuyển' };
  }
};

/**
 * Get delivery tracking history
 */
export const getTrackingHistory = async (orderId) => {
  try {
    const response = await api.get(`/delivery/${orderId}/tracking`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Có lỗi xảy ra khi lấy lịch sử vận chuyển' };
  }
};

/**
 * Update delivery information
 */
export const updateDelivery = async (orderId, updateData) => {
  try {
    const response = await api.put(`/delivery/${orderId}`, updateData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Có lỗi xảy ra khi cập nhật thông tin vận chuyển' };
  }
};

/**
 * Get all deliveries (admin/management)
 */
export const getAllDeliveries = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/delivery/all?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Có lỗi xảy ra khi lấy danh sách vận chuyển' };
  }
};