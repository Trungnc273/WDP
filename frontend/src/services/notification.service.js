import api from './api';

const notificationService = {
  /**
  * Lấy danh sách thông báo chưa đọc
   */
  getUnreadNotifications: async (limit = 10) => {
    try {
      const response = await api.get(`/notifications/unread?limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
    * Lấy toàn bộ thông báo có phân trang
   */
  getNotifications: async (page = 1, limit = 20) => {
    try {
      const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
    * Lấy số lượng thông báo chưa đọc
   */
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.data.unreadCount || 0;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
    * Đánh dấu một thông báo là đã đọc
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await api.post(`/notifications/${notificationId}/read`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
    * Đánh dấu tất cả thông báo là đã đọc
   */
  markAllAsRead: async () => {
    try {
      const response = await api.post('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
    * Lấy thông tin tranh chấp theo mã tranh chấp
   */
  getDisputeById: async (disputeId) => {
    try {
      const response = await api.get(`/disputes/${disputeId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default notificationService;
