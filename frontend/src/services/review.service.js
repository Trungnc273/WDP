import api from './api';

/**
 * Service đánh giá
 * Xử lý các API liên quan đến đánh giá/nhận xét
 */

/**
 * Tạo đánh giá cho một đơn hàng
 * @param {string} orderId - Mã đơn hàng
 * @param {number} rating - Số sao (1-5)
 * @param {string} comment - Nội dung đánh giá
 */
export const createReview = async (orderId, rating, comment) => {
  const response = await api.post(`/orders/${orderId}/rate`, {
    rating,
    comment
  });
  return response.data;
};

/**
 * Lấy danh sách đánh giá của một người dùng (người bán)
 * @param {string} userId - Mã người dùng
 * @param {object} filters - Điều kiện lọc
 * @param {object} pagination - Thông tin phân trang
 */
export const getReviews = async (userId, filters = {}, pagination = {}) => {
  const params = new URLSearchParams();
  
  if (filters.rating) params.append('rating', filters.rating);
  if (pagination.page) params.append('page', pagination.page);
  if (pagination.limit) params.append('limit', pagination.limit);
  
  const response = await api.get(`/users/${userId}/reviews?${params}`);
  return response.data;
};

/**
 * Lấy đánh giá theo mã đơn hàng
 * @param {string} orderId - Mã đơn hàng
 */
export const getReviewByOrderId = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/review`);
  return response.data;
};

/**
 * Kiểm tra người dùng có thể đánh giá đơn hàng hay không
 * @param {string} orderId - Mã đơn hàng
 */
export const canReviewOrder = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/can-review`);
  return response.data;
};

/**
 * Lấy thống kê điểm đánh giá của một người dùng
 * @param {string} userId - Mã người dùng
 */
export const getRatingStats = async (userId) => {
  const response = await api.get(`/users/${userId}/rating-stats`);
  return response.data;
};

/**
 * Lấy các đánh giá của người dùng hiện tại
 * @param {object} pagination - Thông tin phân trang
 */
export const getMyReviews = async (pagination = {}) => {
  const params = new URLSearchParams();
  
  if (pagination.page) params.append('page', pagination.page);
  if (pagination.limit) params.append('limit', pagination.limit);
  
  const response = await api.get(`/reviews/my-reviews?${params}`);
  return response.data;
};

/**
 * Cập nhật một đánh giá
 * @param {string} reviewId - Mã đánh giá
 * @param {number} rating - Số sao mới
 * @param {string} comment - Nội dung mới
 */
export const updateReview = async (reviewId, rating, comment) => {
  const response = await api.put(`/reviews/${reviewId}`, {
    rating,
    comment
  });
  return response.data;
};

/**
 * Xóa một đánh giá
 * @param {string} reviewId - Mã đánh giá
 */
export const deleteReview = async (reviewId) => {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response.data;
};