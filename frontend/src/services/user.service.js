import api from './api';

/**
 * Service người dùng
 * Xử lý các API liên quan đến hồ sơ người dùng và KYC
 */

/**
 * Lấy hồ sơ của người dùng hiện tại
 */
export const getProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

/**
 * Cập nhật hồ sơ người dùng
 * @param {object} profileData - Dữ liệu hồ sơ cần cập nhật
 */
export const updateProfile = async (profileData) => {
  const response = await api.put('/users/profile', profileData);
  return response.data;
};

/**
 * Cập nhật ảnh đại diện
 * @param {string} avatarUrl - Đường dẫn ảnh đại diện
 */
export const uploadAvatar = async (avatarUrl) => {
  const response = await api.post('/users/avatar', { avatarUrl });
  return response.data;
};

/**
 * Lấy hồ sơ công khai
 * @param {string} userId - Mã người dùng
 */
export const getPublicProfile = async (userId) => {
  const response = await api.get(`/users/${userId}/public`);
  return response.data;
};

/**
 * Gửi hồ sơ xác minh KYC
 * @param {object} kycData - Dữ liệu giấy tờ KYC
 */
export const submitKYC = async (kycData) => {
  const response = await api.post('/users/kyc', kycData);
  return response.data;
};

/**
 * Lấy trạng thái xác minh KYC
 */
export const getKYCStatus = async () => {
  const response = await api.get('/users/kyc/status');
  return response.data;
};

/**
 * Đổi mật khẩu
 * @param {string} currentPassword - Mật khẩu hiện tại
 * @param {string} newPassword - Mật khẩu mới
 */
export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
};

/**
 * Lấy thống kê người dùng
 * @param {string} userId - Mã người dùng
 */
export const getUserStats = async (userId) => {
  const response = await api.get(`/users/${userId}/stats`);
  return response.data;
};