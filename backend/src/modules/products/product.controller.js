const productService = require('./product.service');
const Category = require('./category.model');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

function parseCategoryInput(value) {
  // Chap nhan nhieu dinh dang payload: array, JSON string, comma string, object indexed.
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) {
      return [];
    }

    try {
      const parsed = JSON.parse(normalized);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      // Fall through to comma/single value parsing.
    }

    if (normalized.includes(',')) {
      return normalized.split(',').map(item => item.trim()).filter(Boolean);
    }

    return [normalized];
  }

  if (value && typeof value === 'object') {
    return Object.values(value).filter(Boolean);
  }

  return [];
}

async function normalizeCategorySelection(productData, resolveCategoryId) {
  // Gom category theo nhieu key de tranh mat du lieu giua cac client version.
  const candidateCategoryValues = [
    ...parseCategoryInput(productData.categories),
    ...parseCategoryInput(productData.categoryIds)
  ];

  const normalizedCategories = [];
  for (const rawCategory of candidateCategoryValues) {
    const categoryId = await resolveCategoryId(String(rawCategory || '').trim());
    if (!categoryId) {
      throw new Error('Danh mục không hợp lệ');
    }
    if (!normalizedCategories.includes(categoryId)) {
      normalizedCategories.push(categoryId);
    }
  }

  let primaryCategoryId = null;
  const singleCategoryCandidates = [productData.category, productData.categoryId];

  for (const candidate of singleCategoryCandidates) {
    if (!candidate) {
      continue;
    }

    const resolved = await resolveCategoryId(String(candidate).trim());
    if (!resolved) {
      throw new Error('Danh mục không hợp lệ');
    }
    primaryCategoryId = resolved;
    break;
  }

  if (!primaryCategoryId && normalizedCategories.length > 0) {
    primaryCategoryId = normalizedCategories[0];
  }

  if (primaryCategoryId && !normalizedCategories.includes(primaryCategoryId)) {
    // Dam bao category chinh luon nam trong mang categories.
    normalizedCategories.unshift(primaryCategoryId);
  }

  return {
    primaryCategoryId,
    normalizedCategories
  };
}

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
      sort: req.query.sort || null,
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

    const isPublicVisible =
      product.status === 'active' && product.moderationStatus === 'approved';
    if (!isPublicVisible) {
      const requester = req.user;
      const isOwner = requester && String(product.seller?._id) === String(requester.userId);
      const canModerate = requester && ['moderator', 'admin'].includes(requester.role);

      if (!isOwner && !canModerate) {
        return sendError(res, 404, 'Sản phẩm không tồn tại');
      }
    }
    
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

    const resolveCategoryId = async (value) => {
      if (!value || typeof value !== 'string') return null;

      const categoryBySlug = await Category.findOne({ slug: value }).select('_id');
      if (categoryBySlug) {
        return categoryBySlug._id.toString();
      }

      const categoryById = await Category.findById(value).select('_id');
      if (categoryById) {
        return categoryById._id.toString();
      }

      return null;
    };

    const resolveOtherFallbackCategoryId = async () => {
      const candidateSlugs = ['other', 'khac'];

      for (const slug of candidateSlugs) {
        const category = await Category.findOne({ slug }).select('_id');
        if (category) {
          return category._id.toString();
        }
      }

      try {
        const category = await Category.create({
          name: 'Khác',
          slug: 'other',
          description: 'Danh mục mặc định cho sản phẩm tự khai báo',
          icon: '🧩',
          isActive: true
        });

        return category._id.toString();
      } catch (error) {
        if (error?.code === 11000) {
          const category = await Category.findOne({ slug: 'other' }).select('_id');
          if (category) {
            return category._id.toString();
          }
        }
        throw error;
      }
    };
    
    // Bat buoc KYC approved moi duoc dang tin.
    const canPostProduct = req.user.kycStatus === 'approved';
    if (!canPostProduct) {
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
    
    let primaryCategoryId = null;
    let normalizedCategories = [];
    try {
      const normalizedSelection = await normalizeCategorySelection(productData, resolveCategoryId);
      primaryCategoryId = normalizedSelection.primaryCategoryId;
      normalizedCategories = normalizedSelection.normalizedCategories;
    } catch (error) {
      return sendError(res, 400, error.message);
    }

    const normalizedOtherCategory = String(productData.otherCategory || '').trim();

    if (!primaryCategoryId && normalizedOtherCategory) {
      primaryCategoryId = await resolveOtherFallbackCategoryId();
      if (!normalizedCategories.includes(primaryCategoryId)) {
        normalizedCategories.unshift(primaryCategoryId);
      }
    }

    if (!primaryCategoryId) {
      return sendError(res, 400, 'Vui lòng chọn danh mục');
    }
    
    if (!productData.images || productData.images.length === 0) {
      return sendError(res, 400, 'Vui lòng tải lên ít nhất 1 ảnh');
    }
    
    if (!productData.location || !productData.location.city || !productData.location.district) {
      return sendError(res, 400, 'Vui lòng nhập đầy đủ địa chỉ (tỉnh/thành phố và quận/huyện)');
    }
    
    productData.category = primaryCategoryId;
    productData.categories = normalizedCategories;
    productData.otherCategory = normalizedOtherCategory;
    
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
    const updateData = { ...req.body };

    const resolveCategoryId = async (value) => {
      if (!value || typeof value !== 'string') return null;

      const categoryBySlug = await Category.findOne({ slug: value }).select('_id');
      if (categoryBySlug) {
        return categoryBySlug._id.toString();
      }

      const categoryById = await Category.findById(value).select('_id');
      if (categoryById) {
        return categoryById._id.toString();
      }

      return null;
    };

    const shouldNormalizeCategories =
      updateData.category !== undefined ||
      updateData.categoryId !== undefined ||
      updateData.categories !== undefined ||
      updateData.categoryIds !== undefined;

    if (shouldNormalizeCategories) {
      try {
        const normalizedSelection = await normalizeCategorySelection(updateData, resolveCategoryId);
        if (normalizedSelection.primaryCategoryId) {
          updateData.category = normalizedSelection.primaryCategoryId;
        }
        updateData.categories = normalizedSelection.normalizedCategories;
      } catch (error) {
        return sendError(res, 400, error.message);
      }
    }
    
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
      status: req.query.status,
      moderationStatus: req.query.moderationStatus
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
