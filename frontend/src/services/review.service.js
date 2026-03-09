import api from './api';

/**
 * Review Service
 * Handles all review-related API calls
 */

/**
 * Create a review for an order
 * @param {string} orderId - Order ID
 * @param {number} rating - Rating (1-5)
 * @param {string} comment - Review comment
 */
export const createReview = async (orderId, rating, comment) => {
  const response = await api.post(`/orders/${orderId}/rate`, {
    rating,
    comment
  });
  return response.data;
};

/**
 * Get reviews for a user (seller)
 * @param {string} userId - User ID
 * @param {object} filters - Filter options
 * @param {object} pagination - Pagination options
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
 * Get review by order ID
 * @param {string} orderId - Order ID
 */
export const getReviewByOrderId = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/review`);
  return response.data;
};

/**
 * Check if user can review an order
 * @param {string} orderId - Order ID
 */
export const canReviewOrder = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/can-review`);
  return response.data;
};

/**
 * Get rating statistics for a user
 * @param {string} userId - User ID
 */
export const getRatingStats = async (userId) => {
  const response = await api.get(`/users/${userId}/rating-stats`);
  return response.data;
};

/**
 * Get current user's reviews
 * @param {object} pagination - Pagination options
 */
export const getMyReviews = async (pagination = {}) => {
  const params = new URLSearchParams();
  
  if (pagination.page) params.append('page', pagination.page);
  if (pagination.limit) params.append('limit', pagination.limit);
  
  const response = await api.get(`/reviews/my-reviews?${params}`);
  return response.data;
};

/**
 * Update a review
 * @param {string} reviewId - Review ID
 * @param {number} rating - New rating
 * @param {string} comment - New comment
 */
export const updateReview = async (reviewId, rating, comment) => {
  const response = await api.put(`/reviews/${reviewId}`, {
    rating,
    comment
  });
  return response.data;
};

/**
 * Delete a review
 * @param {string} reviewId - Review ID
 */
export const deleteReview = async (reviewId) => {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response.data;
};