import axios from 'axios';
import { NETWORK_CONFIG } from './network.config';

const api = axios.create({
  baseURL: NETWORK_CONFIG.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor request de gan token vao header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor response de xu ly loi
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Xu ly 401 Unauthorized - token het han hoac khong hop le
      if (error.response.status === 401) {
        const requestUrl = error.config?.url || '';
        const isAuthLoginRequest = requestUrl.includes('/auth/login');

        // Với request đăng nhập sai thông tin, chỉ trả lỗi cho màn hình login xử lý,
        // không reload hoặc redirect trang để tránh gây khó hiểu cho người dùng.
        if (!isAuthLoginRequest) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
      
      // Tra ve thong bao loi tu backend
      const message = error.response.data?.message || 'Đã có lỗi xảy ra';
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Loi mang
      return Promise.reject(new Error('Không thể kết nối đến server'));
    } else {
      return Promise.reject(error);
    }
  }
);

export default api;
