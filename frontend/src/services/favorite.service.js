import api from './api';

/**
 * Add product to favorites
 */
export const addFavorite = async (productId) => {
  try {
    const response = await api.post('/favorites', { productId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Remove product from favorites
 */
export const removeFavorite = async (productId) => {
  try {
    const response = await api.delete(`/favorites/${productId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get user's favorites
 */
export const getFavorites = async (params = {}) => {
  try {
    const response = await api.get('/favorites', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Check if product is favorited
 */
export const checkFavorite = async (productId) => {
  try {
    const response = await api.get(`/favorites/check/${productId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite
};
