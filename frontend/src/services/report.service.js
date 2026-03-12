import api from './api';

/**
 * Report Service
 * Handles all report and dispute-related API calls
 */

/**
 * Create a product report
 * @param {string} productId - Product ID
 * @param {string} reason - Report reason
 * @param {string} description - Report description
 * @param {Array} evidenceImages - Evidence image URLs
 */
export const createProductReport = async (productId, reason, description, evidenceImages = []) => {
  const response = await api.post('/reports/product', {
    productId,
    reason,
    description,
    evidenceImages
  });
  return response.data;
};

/**
 * Create a user report
 * @param {string} reportedUserId - Reported user ID
 * @param {string} reason - Report reason
 * @param {string} description - Report description
 * @param {Array} evidenceImages - Evidence image URLs
 */
export const createUserReport = async (reportedUserId, reason, description, evidenceImages = []) => {
  const response = await api.post('/reports/user', {
    reportedUserId,
    reason,
    description,
    evidenceImages
  });
  return response.data;
};

/**
 * Get current user's reports
 * @param {object} pagination - Pagination options
 */
export const getMyReports = async (pagination = {}) => {
  const params = new URLSearchParams();
  
  if (pagination.page) params.append('page', pagination.page);
  if (pagination.limit) params.append('limit', pagination.limit);
  
  const response = await api.get(`/reports/my-reports?${params}`);
  return response.data;
};

/**
 * Create a dispute for an order
 * @param {string} orderId - Order ID
 * @param {string} reason - Dispute reason
 * @param {string} description - Dispute description
 * @param {Array} evidenceImages - Evidence image URLs
 */
export const createDispute = async (orderId, reason, description, evidenceImages) => {
  const response = await api.post(`/orders/${orderId}/dispute`, {
    reason,
    description,
    evidenceImages
  });
  return response.data;
};

/**
 * Get current user's disputes
 * @param {object} pagination - Pagination options
 */
export const getMyDisputes = async (pagination = {}) => {
  const params = new URLSearchParams();
  
  if (pagination.page) params.append('page', pagination.page);
  if (pagination.limit) params.append('limit', pagination.limit);
  
  const response = await api.get(`/disputes/my-disputes?${params}`);
  return response.data;
};

/**
 * Add seller response to dispute
 * @param {string} disputeId - Dispute ID
 * @param {string} response - Seller response
 * @param {Array} evidenceImages - Evidence image URLs
 */
export const addSellerResponse = async (disputeId, response, evidenceImages = []) => {
  const response_data = await api.post(`/disputes/${disputeId}/respond`, {
    response,
    evidenceImages
  });
  return response_data.data;
};

/**
 * Upload evidence images and return stored backend paths
 * @param {File[]} files - Image files
 * @returns {Promise<string[]>} Array of stored image paths
 */
export const uploadEvidenceImages = async (files = []) => {
  if (!files.length) return [];

  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));

  const response = await api.post('/upload/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return (response.data?.data || []).map((item) => item.path).filter(Boolean);
};