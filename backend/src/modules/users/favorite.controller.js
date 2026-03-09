const Favorite = require('./favorite.model');
const Product = require('../products/product.model');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

/**
 * Add product to favorites
 */
async function addFavorite(req, res, next) {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return sendError(res, 404, 'Sản phẩm không tồn tại');
    }

    // Check if already favorited
    const existing = await Favorite.findOne({ user: userId, product: productId });
    if (existing) {
      return sendError(res, 400, 'Sản phẩm đã có trong danh sách yêu thích');
    }

    // Create favorite
    const favorite = new Favorite({
      user: userId,
      product: productId
    });
    await favorite.save();

    return sendSuccess(res, 201, favorite, 'Đã thêm vào danh sách yêu thích');
  } catch (error) {
    next(error);
  }
}

/**
 * Remove product from favorites
 */
async function removeFavorite(req, res, next) {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      user: userId,
      product: productId
    });

    if (!favorite) {
      return sendError(res, 404, 'Sản phẩm không có trong danh sách yêu thích');
    }

    return sendSuccess(res, 200, null, 'Đã xóa khỏi danh sách yêu thích');
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's favorites
 */
async function getFavorites(req, res, next) {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const favorites = await Favorite.find({ user: userId })
      .populate({
        path: 'product',
        populate: [
          { path: 'category', select: 'name slug icon' },
          { path: 'seller', select: 'fullName isVerified' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Favorite.countDocuments({ user: userId });

    // Filter out favorites with deleted products
    const validFavorites = favorites.filter(f => f.product);

    const result = {
      favorites: validFavorites,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit
    };

    return sendSuccess(res, 200, result, 'Danh sách yêu thích');
  } catch (error) {
    next(error);
  }
}

/**
 * Check if product is favorited
 */
async function checkFavorite(req, res, next) {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const favorite = await Favorite.findOne({
      user: userId,
      product: productId
    });

    return sendSuccess(res, 200, { isFavorite: !!favorite });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite
};
