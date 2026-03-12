const API_ORIGIN = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Noi khai bao tap trung cho cac endpoint mang.
export const NETWORK_CONFIG = {
  API_ORIGIN,
  API_BASE_URL: `${API_ORIGIN}/api`,
  SOCKET_URL: API_ORIGIN
};

export default NETWORK_CONFIG;
