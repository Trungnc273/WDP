const reviewService = require('./review.service');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

/**
 * Review Controller
 * Handles review/rating endpoints
 */

/**
 * Create a review (rate seller after order completion)
 * POST /api/orders/:orderId/rate
 */
async function createReview(req, res) {
  try {
    const { orderId } = req.params;
    const { rating, comment, evidenceFiles } = req.body;
    const reviewerId = req.user.userId;
    
    // Validate required fields
    if (!rating) {
      return sendError(res, 400, 'Vui lòng chọn số sao đánh giá');
    }
    
    const review = await reviewService.createReview(
      reviewerId,
      orderId,
      rating,
      comment,
      evidenceFiles
    );
    
    sendSuccess(res, 200, review, 'Đánh giá thành công');
  } catch (error) {
    console.error('Create review error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Get reviews for a user (seller)
 * GET /api/users/:userId/reviews
 */
async function getReviews(req, res) {
  try {
    const { userId } = req.params;
    const { rating, page, limit } = req.query;
    
    const filters = {};
    if (rating) {
      filters.rating = rating;
    }
    
    const pagination = { page, limit };
    
    const result = await reviewService.getReviews(userId, filters, pagination);
    
    sendSuccess(res, 200, result);
  } catch (error) {
    console.error('Get reviews error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Get review by ID
 * GET /api/reviews/:reviewId
 */
async function getReviewById(req, res) {
  try {
    const { reviewId } = req.params;
    
    const review = await reviewService.getReviewById(reviewId);
    
    sendSuccess(res, 200, review);
  } catch (error) {
    console.error('Get review by ID error:', error);
    sendError(res, 404, error.message);
  }
}

/**
 * Get review by order ID
 * GET /api/orders/:orderId/review
 */
async function getReviewByOrderId(req, res) {
  try {
    const { orderId } = req.params;
    
    const review = await reviewService.getReviewByOrderId(orderId);
    
    if (!review) {
      return sendSuccess(res, 200, null, 'Chưa có đánh giá cho đơn hàng này');
    }
    
    sendSuccess(res, 200, review);
  } catch (error) {
    console.error('Get review by order ID error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Update review
 * PUT /api/reviews/:reviewId
 */
async function updateReview(req, res) {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const reviewerId = req.user.userId;
    
    const review = await reviewService.updateReview(reviewId, reviewerId, rating, comment);
    
    sendSuccess(res, 200, review, 'Cập nhật đánh giá thành công');
  } catch (error) {
    console.error('Update review error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Delete review (hide)
 * DELETE /api/reviews/:reviewId
 */
async function deleteReview(req, res) {
  try {
    const { reviewId } = req.params;
    const reviewerId = req.user.userId;
    
    await reviewService.deleteReview(reviewId, reviewerId);
    
    sendSuccess(res, 200, null, 'Xóa đánh giá thành công');
  } catch (error) {
    console.error('Delete review error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Get rating statistics for a user
 * GET /api/users/:userId/rating-stats
 */
async function getRatingStats(req, res) {
  try {
    const { userId } = req.params;
    
    const stats = await reviewService.getRatingStats(userId);
    
    sendSuccess(res, 200, stats);
  } catch (error) {
    console.error('Get rating stats error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Check if user can review an order
 * GET /api/orders/:orderId/can-review
 */
async function canReviewOrder(req, res) {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;
    
    const result = await reviewService.canReviewOrder(userId, orderId);
    
    sendSuccess(res, 200, result);
  } catch (error) {
    console.error('Can review order error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Get reviews written by current user
 * GET /api/reviews/my-reviews
 */
async function getMyReviews(req, res) {
  try {
    const reviewerId = req.user.userId;
    const { page, limit } = req.query;
    
    const pagination = { page, limit };
    
    const result = await reviewService.getReviewsByReviewer(reviewerId, pagination);
    
    sendSuccess(res, 200, result);
  } catch (error) {
    console.error('Get my reviews error:', error);
    sendError(res, 400, error.message);
  }
}

module.exports = {
  createReview,
  getReviews,
  getReviewById,
  getReviewByOrderId,
  updateReview,
  deleteReview,
  getRatingStats,
  canReviewOrder,
  getMyReviews
};