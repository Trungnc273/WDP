const productService = require('./product.service');
const Category = require('./category.model');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

/**
 * Get all products with filters and pagination
 * GET /api/products
 * Query params: page, limit, search, category, minPrice, maxPrice, city
 * Implements Requirements 5-10
 */
async function getProducts(req, res, next) {
  try {
    // Parse filters from query params
    const filters = {
      search: req.query.search,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
      cities: req.query.cities ? (Array.isArray(req.query.cities) ? req.query.cities : [req.query.cities]) : null,
      sellerId: req.query.seller
    };
    
    // Handle category - convert slug to ID if provided
    if (req.query.category) {
      const category = await Category.findOne({ slug: req.query.category });
      if (category) {
        filters.categoryId = category._id;
      }
    }
    
    // Parse pagination params
    const pagination = {
      page: req.query.page,
      limit: req.query.limit
    };
    
    // Get products from service
    const result = await productService.getProducts(filters, pagination);
    
    return sendSuccess(res, 200, result, 'Products retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Get product by ID
 * GET /api/products/:id
 */
async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    
    const product = await productService.getProductById(id);
    
    return sendSuccess(res, 200, product, 'Product retrieved successfully');
  } catch (error) {
    if (error.message.includes('không tồn tại')) {
      return sendError(res, 404, error.message);
    }
    next(error);
  }
}

/**
 * Search products
 * GET /api/products/search
 * Query params: q (search keyword), page, limit
 * Implements Requirement 6
 */
async function searchProducts(req, res, next) {
  try {
    const keyword = req.query.q || '';
    
    const pagination = {
      page: req.query.page,
      limit: req.query.limit
    };
    
    const result = await productService.searchProducts(keyword, pagination);
    
    return sendSuccess(res, 200, result, 'Search completed successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new product
 * POST /api/products
 * Body: title, description, price, category, condition, images, location
 * Requires authentication
 */
async function createProduct(req, res, next) {
  try {
    const userId = req.user.userId;
    const productData = { ...req.body };
    
    // Require verified (KYC-approved) account before allowing product creation
    if (!req.user.isVerified) {
      return sendError(
        res,
        403,
        'Tài khoản của bạn chưa được xác thực KYC. Vui lòng hoàn thành xác thực danh tính trước khi đăng sản phẩm.'
      );
    }
    
    console.log('Create product request:', productData);
    
    // Validate required fields
    if (!productData.title || !productData.description || !productData.price) {
      return sendError(res, 400, 'Thiếu thông tin bắt buộc: tiêu đề, mô tả, giá');
    }
    
    if (!productData.category) {
      return sendError(res, 400, 'Vui lòng chọn danh mục');
    }
    
    if (!productData.images || productData.images.length === 0) {
      return sendError(res, 400, 'Vui lòng tải lên ít nhất 1 ảnh');
    }
    
    if (!productData.location || !productData.location.city || !productData.location.district) {
      return sendError(res, 400, 'Vui lòng nhập đầy đủ địa chỉ (tỉnh/thành phố và quận/huyện)');
    }
    
    // Handle category - convert slug to ID if provided as string
    if (productData.category && typeof productData.category === 'string') {
      const category = await Category.findOne({ slug: productData.category });
      if (category) {
        productData.category = category._id;
      } else {
        // Try to find by ID
        const categoryById = await Category.findById(productData.category);
        if (!categoryById) {
          return sendError(res, 400, 'Danh mục không hợp lệ');
        }
      }
    }
    
    const product = await productService.createProduct(userId, productData);
    
    return sendSuccess(res, 201, product, 'Sản phẩm đã được tạo thành công');
  } catch (error) {
    console.error('Create product error:', error);
    if (error.message.includes('validation')) {
      return sendError(res, 400, `Dữ liệu không hợp lệ: ${error.message}`);
    }
    next(error);
  }
}

/**
 * Update a product
 * PUT /api/products/:id
 * Body: title, description, price, condition, images, location
 * Requires authentication and ownership
 */
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const updateData = req.body;
    
    const product = await productService.updateProduct(id, userId, updateData);
    
    return sendSuccess(res, 200, product, 'Sản phẩm đã được cập nhật thành công');
  } catch (error) {
    if (error.message.includes('không tồn tại')) {
      return sendError(res, 404, error.message);
    }
    if (error.message.includes('không có quyền') || error.message.includes('đã bán')) {
      return sendError(res, 403, error.message);
    }
    next(error);
  }
}

/**
 * Delete a product (soft delete)
 * DELETE /api/products/:id
 * Requires authentication and ownership
 */
async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const product = await productService.deleteProduct(id, userId);
    
    return sendSuccess(res, 200, product, 'Sản phẩm đã được xóa thành công');
  } catch (error) {
    if (error.message.includes('không tồn tại')) {
      return sendError(res, 404, error.message);
    }
    if (error.message.includes('không có quyền') || error.message.includes('đã bán')) {
      return sendError(res, 403, error.message);
    }
    next(error);
  }
}

/**
 * Update product visibility (active/hidden)
 * PATCH /api/products/:id/visibility
 * Body: { status: 'active' | 'hidden' }
 * Requires authentication and ownership
 */
async function updateProductVisibility(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const nextStatus = String(req.body?.status || '').trim();

    if (!nextStatus) {
      return sendError(res, 400, 'Thiếu trạng thái cập nhật');
    }

    const product = await productService.setProductVisibility(id, userId, nextStatus);

    return sendSuccess(res, 200, product, 'Trạng thái hiển thị đã được cập nhật');
  } catch (error) {
    if (error.message.includes('không tồn tại')) {
      return sendError(res, 404, error.message);
    }
    if (error.message.includes('không có quyền') || error.message.includes('Không thể') || error.message.includes('không hợp lệ')) {
      return sendError(res, 403, error.message);
    }
    next(error);
  }
}

/**
 * Get user's products
 * GET /api/products/my-products
 * Query params: status, page, limit
 * Requires authentication
 */
async function getMyProducts(req, res, next) {
  try {
    const userId = req.user.userId;
    
    const filters = {
      status: req.query.status
    };
    
    const pagination = {
      page: req.query.page,
      limit: req.query.limit
    };
    
    const result = await productService.getMyProducts(userId, filters, pagination);
    
    return sendSuccess(res, 200, result, 'Danh sách sản phẩm của bạn');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducts,
  getProductById,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductVisibility,
  getMyProducts
};
