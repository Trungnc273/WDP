import api from './api';

/**
 * User Service
 * Handles all user profile and KYC related API calls
 */

/**
 * Get current user profile
 */
export const getProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

/**
 * Update user profile
 * @param {object} profileData - Profile data to update
 */
export const updateProfile = async (profileData) => {
  const response = await api.put('/users/profile', profileData);
  return response.data;
};

/**
 * Upload avatar
 * @param {string} avatarUrl - Avatar URL
 */
export const uploadAvatar = async (avatarUrl) => {
  const response = await api.post('/users/avatar', { avatarUrl });
  return response.data;
};

/**
 * Get public profile
 * @param {string} userId - User ID
 */
export const getPublicProfile = async (userId) => {
  const response = await api.get(`/users/${userId}/public`);
  return response.data;
};

/**
 * Submit KYC verification
 * @param {object} kycData - KYC documents
 */
export const submitKYC = async (kycData) => {
  const response = await api.post('/users/kyc', kycData);
  return response.data;
};

/**
 * Get KYC status
 */
export const getKYCStatus = async () => {
  const response = await api.get('/users/kyc/status');
  return response.data;
};

/**
 * Change password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 */
export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post('/users/change-password', {
    currentPassword,
    newPassword
  });
  return response.data;
};

/**
 * Get user statistics
 * @param {string} userId - User ID
 */
export const getUserStats = async (userId) => {
  const response = await api.get(`/users/${userId}/stats`);
  return response.data;
};