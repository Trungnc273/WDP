import api from './api';

export const authService = {
  async register(email, password, fullName) {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        fullName,
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Đăng ký thất bại');
      }
    } catch (error) {
      throw error;
    }
  },

  async login(email, password) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      throw error;
    }
  },

  async getProfile(token) {
    try {
      const response = await api.get('/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Không thể lấy thông tin profile');
      }
    } catch (error) {
      throw error;
    }
  },

  async logout() {
    // For now, logout is handled client-side by removing token
    // In the future, we can add a backend endpoint to invalidate tokens
    localStorage.removeItem('token');
  },
};
