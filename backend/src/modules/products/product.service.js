const Product = require('./product.model');

/**
 * Build MongoDB query from filters
 * @param {Object} filters - Filter parameters
 * @returns {Object} MongoDB query object
 */
function buildProductQuery(filters) {
  const query = { status: 'active' };
  
  // Apply search filter (Req 6)
  if (filters.search && filters.search.trim().length > 0) {
    query.$text = { $search: filters.search };
  }
  
  // Apply category filter (Req 7)
  if (filters.categoryId) {
    query.category = filters.categoryId;
  }
  
  // Apply price range filter (Req 8)
  if (filters.minPrice !== null && filters.minPrice !== undefined || 
      filters.maxPrice !== null && filters.maxPrice !== undefined) {
    query.price = {};
    if (filters.minPrice !== null && filters.minPrice !== undefined) {
      query.price.$gte = filters.minPrice;
    }
    if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
      query.price.$lte = filters.maxPrice;
    }
  }
  
  // Apply location filter (Req 9)
  if (filters.city) {
    query['location.city'] = filters.city;
  }
  
  return query;
}

/**
 * Get products with filters and pagination
 * Implements Requirements 5-10
 * @param {Object} filters - Filter parameters (search, categoryId, minPrice, maxPrice, city)
 * @param {Object} pagination - Pagination parameters (page, limit)
 * @returns {Promise<Object>} Products with pagination metadata
 */
async function getProducts(filters = {}, pagination = {}) {
  try {
    // Build query with filters (Req 10 - combine multiple filters)
    const query = buildProductQuery(filters);
    
    // Calculate pagination (Req 5)
    const page = parseInt(pagination.page) || 1;
    const limit = Math.min(parseInt(pagination.limit) || 20, 100); // Max 100 per page (Req 5.6)
    const skip = (page - 1) * limit;
    
    // Execute query with pagination (Req 5)
    const products = await Product.find(query)
      .populate('seller', 'fullName isVerified') // Req 5.4
      .populate('category', 'name slug') // Req 5.4
      .sort({ createdAt: -1 }) // Req 5.5 - newest first
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination metadata (Req 5.3)
    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    return {
      products,
      total,
      page,
      totalPages,
      limit
    };
  } catch (error) {
    throw new Error(`Error fetching products: ${error.message}`);
  }
}

/**
 * Get product by ID
 * @param {String} productId - Product ID
 * @returns {Promise<Object>} Product details
 */
async function getProductById(productId) {
  try {
    const product = await Product.findById(productId)
      .populate('seller', 'fullName isVerified email')
      .populate('category', 'name slug description');
    
    if (!product) {
      throw new Error('Sản phẩm không tồn tại');
    }
    
    return product;
  } catch (error) {
    throw new Error(`Error fetching product: ${error.message}`);
  }
}

/**
 * Search products by keyword
 * Implements Requirement 6
 * @param {String} keyword - Search keyword
 * @param {Object} pagination - Pagination parameters
 * @returns {Promise<Object>} Search results with pagination
 */
async function searchProducts(keyword, pagination = {}) {
  try {
    const filters = { search: keyword };
    return await getProducts(filters, pagination);
  } catch (error) {
    throw new Error(`Error searching products: ${error.message}`);
  }
}

/**
 * Filter products by category
 * Implements Requirement 7
 * @param {String} categoryId - Category ID
 * @param {Object} additionalFilters - Additional filters
 * @param {Object} pagination - Pagination parameters
 * @returns {Promise<Object>} Filtered products with pagination
 */
async function filterByCategory(categoryId, additionalFilters = {}, pagination = {}) {
  try {
    const filters = { ...additionalFilters, categoryId };
    return await getProducts(filters, pagination);
  } catch (error) {
    throw new Error(`Error filtering by category: ${error.message}`);
  }
}

/**
 * Filter products by price range
 * Implements Requirement 8
 * @param {Number} minPrice - Minimum price
 * @param {Number} maxPrice - Maximum price
 * @param {Object} additionalFilters - Additional filters
 * @param {Object} pagination - Pagination parameters
 * @returns {Promise<Object>} Filtered products with pagination
 */
async function filterByPriceRange(minPrice, maxPrice, additionalFilters = {}, pagination = {}) {
  try {
    const filters = { ...additionalFilters, minPrice, maxPrice };
    return await getProducts(filters, pagination);
  } catch (error) {
    throw new Error(`Error filtering by price range: ${error.message}`);
  }
}

/**
 * Filter products by location
 * Implements Requirement 9
 * @param {String} city - City name
 * @param {Object} additionalFilters - Additional filters
 * @param {Object} pagination - Pagination parameters
 * @returns {Promise<Object>} Filtered products with pagination
 */
async function filterByLocation(city, additionalFilters = {}, pagination = {}) {
  try {
    const filters = { ...additionalFilters, city };
    return await getProducts(filters, pagination);
  } catch (error) {
    throw new Error(`Error filtering by location: ${error.message}`);
  }
}

/**
 * Create a new product
 * @param {String} userId - User ID (seller)
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product
 */
async function createProduct(userId, productData) {
  try {
    const product = new Product({
      ...productData,
      seller: userId,
      status: 'active'
    });
    
    await product.save();
    
    // Populate seller and category info
    await product.populate('seller', 'fullName isVerified');
    await product.populate('category', 'name slug');
    
    return product;
  } catch (error) {
    throw new Error(`Error creating product: ${error.message}`);
  }
}

/**
 * Update a product
 * @param {String} productId - Product ID
 * @param {String} userId - User ID (must be owner)
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated product
 */
async function updateProduct(productId, userId, updateData) {
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Sản phẩm không tồn tại');
    }
    
    // Check ownership
    if (product.seller.toString() !== userId.toString()) {
      throw new Error('Bạn không có quyền chỉnh sửa sản phẩm này');
    }
    
    // Cannot update if product is sold
    if (product.status === 'sold') {
      throw new Error('Không thể chỉnh sửa sản phẩm đã bán');
    }
    
    // Update allowed fields
    const allowedFields = ['title', 'description', 'price', 'condition', 'images', 'location'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        product[field] = updateData[field];
      }
    });
    
    await product.save();
    
    // Populate seller and category info
    await product.populate('seller', 'fullName isVerified');
    await product.populate('category', 'name slug');
    
    return product;
  } catch (error) {
    throw new Error(`Error updating product: ${error.message}`);
  }
}

/**
 * Delete a product (soft delete)
 * @param {String} productId - Product ID
 * @param {String} userId - User ID (must be owner)
 * @returns {Promise<Object>} Deleted product
 */
async function deleteProduct(productId, userId) {
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Sản phẩm không tồn tại');
    }
    
    // Check ownership
    if (product.seller.toString() !== userId.toString()) {
      throw new Error('Bạn không có quyền xóa sản phẩm này');
    }
    
    // Cannot delete if product is sold or has active orders
    if (product.status === 'sold') {
      throw new Error('Không thể xóa sản phẩm đã bán');
    }
    
    // Soft delete - set status to 'deleted'
    product.status = 'deleted';
    await product.save();
    
    return product;
  } catch (error) {
    throw new Error(`Error deleting product: ${error.message}`);
  }
}

/**
 * Get user's products
 * @param {String} userId - User ID
 * @param {Object} filters - Filter parameters (status)
 * @param {Object} pagination - Pagination parameters
 * @returns {Promise<Object>} User's products with pagination
 */
async function getMyProducts(userId, filters = {}, pagination = {}) {
  try {
    const query = { seller: userId };
    
    // Filter by status if provided
    if (filters.status) {
      query.status = filters.status;
    } else {
      // By default, exclude deleted products
      query.status = { $ne: 'deleted' };
    }
    
    // Calculate pagination
    const page = parseInt(pagination.page) || 1;
    const limit = Math.min(parseInt(pagination.limit) || 20, 100);
    const skip = (page - 1) * limit;
    
    // Execute query
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count
    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    return {
      products,
      total,
      page,
      totalPages,
      limit
    };
  } catch (error) {
    throw new Error(`Error fetching user products: ${error.message}`);
  }
}

module.exports = {
  getProducts,
  getProductById,
  searchProducts,
  filterByCategory,
  filterByPriceRange,
  filterByLocation,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts
};
