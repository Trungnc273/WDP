import api from './api';

/**
 * Product Service
 * Handles all product-related API calls
 * Implements Requirements 5-10
 */

/**
 * Get products with filters and pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {string} params.search - Search keyword
 * @param {string} params.category - Category ID
 * @param {number} params.minPrice - Minimum price
 * @param {number} params.maxPrice - Maximum price
 * @param {string} params.city - City filter
 * @returns {Promise<Object>} { products, total, page, totalPages, limit }
 */
async function getProducts(params = {}) {
  try {
    const response = await api.get('/products', { params });
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Search products by keyword
 * @param {string} keyword - Search keyword
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>} { products, total, page, totalPages, limit }
 */
async function searchProducts(keyword, params = {}) {
  try {
    const response = await api.get('/products', {
      params: {
        search: keyword,
        ...params
      }
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get product by ID
 * @param {string} id - Product ID
 * @returns {Promise<Object>} Product object
 */
async function getProductById(id) {
  try {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Create a new product
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product
 */
async function createProduct(productData) {
  try {
    const response = await api.post('/products', productData);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Update a product
 * @param {string} id - Product ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated product
 */
async function updateProduct(id, updateData) {
  try {
    const response = await api.put(`/products/${id}`, updateData);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a product
 * @param {string} id - Product ID
 * @returns {Promise<Object>} Deleted product
 */
async function deleteProduct(id) {
  try {
    const response = await api.delete(`/products/${id}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Update product visibility
 * @param {string} id - Product ID
 * @param {string} status - active | hidden
 * @returns {Promise<Object>} Updated product
 */
async function updateProductVisibility(id, status) {
  try {
    const response = await api.patch(`/products/${id}/visibility`, { status });
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get user's products
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} { products, total, page, totalPages, limit }
 */
async function getMyProducts(params = {}) {
  try {
    const response = await api.get('/products/my-products', { params });
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

const productService = {
  getProducts,
  searchProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductVisibility,
  getMyProducts
};

export default productService;
