import api from './api';

/**
 * Service vận chuyển
 * Xử lý các API liên quan đến giao hàng
 */

/**
 * Tạo bản ghi vận chuyển cho đơn hàng
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
 * Lấy thông tin vận chuyển theo mã đơn hàng
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
 * Cập nhật trạng thái giao hàng
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
 * Lấy lịch sử theo dõi giao hàng
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
 * Cập nhật thông tin vận chuyển
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
 * Lấy toàn bộ danh sách vận chuyển (cho quản trị/điều phối)
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