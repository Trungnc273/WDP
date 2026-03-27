import axios from 'axios';
import { NETWORK_CONFIG } from './network.config';

function normalizeUserFacingErrorMessage(rawMessage = '') {
  const message = String(rawMessage || '').trim();
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes('invalid login') ||
    lowerMessage.includes('authentication unsuccessful') ||
    lowerMessage.includes('535 5.7.3')
  ) {
    return 'Không thể gửi email xác thực lúc này. Vui lòng thử lại sau ít phút.';
  }

  if (
    lowerMessage.includes('esocket') ||
    lowerMessage.includes('econnection') ||
    lowerMessage.includes('etimedout') ||
    lowerMessage.includes('connection timeout')
  ) {
    return 'Không thể kết nối đến dịch vụ email lúc này. Vui lòng thử lại sau.';
  }

  return message;
}

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
      const rawMessage = error.response.data?.message || 'Đã có lỗi xảy ra';
      const normalizedMessage = normalizeUserFacingErrorMessage(rawMessage);
      return Promise.reject(new Error(normalizedMessage));
    } else if (error.request) {
      // Loi mang
      return Promise.reject(new Error('Không thể kết nối đến server'));
    } else {
      return Promise.reject(error);
    }
  }
);

export default api;
