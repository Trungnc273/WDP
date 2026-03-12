import api from './api';

/**
 * Admin API Service
 * Handles admin-specific API calls
 */

// User Management APIs
export const adminUserApi = {
  // Get all users with pagination and filters
  getAllUsers: (params = {}) => {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = params;
    return api.get('/users/admin/users', {
      params: { page, limit, search, role, status }
    });
  },

  // Get user by ID (admin view)
  getUserById: (userId) => {
    return api.get(`/users/admin/users/${userId}`);
  },

  // Create new user
  createUser: (userData) => {
    return api.post('/users/admin/users', userData);
  },

  // Update user
  updateUser: (userId, userData) => {
    return api.put(`/users/admin/users/${userId}`, userData);
  },

  // Delete user
  deleteUser: (userId) => {
    return api.delete(`/users/admin/users/${userId}`);
  },

  // Suspend user
  suspendUser: (userId, suspendData) => {
    return api.post(`/users/admin/users/${userId}/suspend`, suspendData);
  },

  // Unsuspend user
  unsuspendUser: (userId) => {
    return api.post(`/users/admin/users/${userId}/unsuspend`);
  },

  // Get system statistics
  getSystemStats: () => {
    return api.get('/users/admin/stats');
  }
};

export default adminUserApi;