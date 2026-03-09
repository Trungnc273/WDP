const Review = require('./review.model');
const Order = require('../orders/order.model');
const User = require('../users/user.model');

/**
 * Review Service
 * Handles seller ratings and reviews
 */

/**
 * Create a review (rate seller after order completion)
 */
async function createReview(reviewerId, orderId, rating, comment = '') {
  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    throw new Error('Đánh giá phải từ 1 đến 5 sao');
  }
  
  // Get order
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new Error('Đơn hàng không tồn tại');
  }
  
  // Verify reviewer is the buyer
  if (order.buyerId.toString() !== reviewerId.toString()) {
    throw new Error('Chỉ người mua mới có thể đánh giá');
  }
  
  // Check if order is completed
  if (order.status !== 'completed') {
    throw new Error('Chỉ có thể đánh giá sau khi đơn hàng hoàn thành');
  }
  
  // Check if review already exists
  const existingReview = await Review.findOne({ orderId: orderId });
  if (existingReview) {
    throw new Error('Bạn đã đánh giá đơn hàng này rồi');
  }
  
  // Create review
  const review = await Review.create({
    orderId: orderId,
    reviewerId: reviewerId,
    reviewedUserId: order.sellerId,
    productId: order.productId,
    rating: rating,
    comment: comment.trim(),
    status: 'active'
  });
  
  // Update seller's rating
  await updateUserRating(order.sellerId);
  
  // Populate details
  await review.populate([
    { path: 'reviewerId', select: 'fullName avatar' },
    { path: 'reviewedUserId', select: 'fullName avatar' },
    { path: 'productId', select: 'title images' },
    { path: 'orderId', select: 'agreedAmount' }
  ]);
  
  return review;
}

/**
 * Update user's average rating
 */
async function updateUserRating(userId) {
  // Calculate average rating
  const stats = await Review.calculateAverageRating(userId);
  
  // Update user
  await User.findByIdAndUpdate(userId, {
    rating: stats.averageRating,
    totalReviews: stats.totalReviews
  });
  
  return stats;
}

/**
 * Get reviews for a user (seller)
 */
async function getReviews(userId, filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;
  
  const query = {
    reviewedUserId: userId,
    status: 'active'
  };
  
  if (filters.rating) {
    query.rating = parseInt(filters.rating);
  }
  
  const reviews = await Review.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('reviewerId', 'fullName avatar')
    .populate('productId', 'title images')
    .populate('orderId', 'agreedAmount');
  
  const total = await Review.countDocuments(query);
  
  // Get rating statistics
  const stats = await Review.calculateAverageRating(userId);
  
  return {
    reviews,
    stats: {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get review by ID
 */
async function getReviewById(reviewId) {
  const review = await Review.findById(reviewId)
    .populate('reviewerId', 'fullName avatar')
    .populate('reviewedUserId', 'fullName avatar rating totalReviews')
    .populate('productId', 'title images price')
    .populate('orderId', 'agreedAmount status');
  
  if (!review) {
    throw new Error('Đánh giá không tồn tại');
  }
  
  return review;
}

/**
 * Get review by order ID
 */
async function getReviewByOrderId(orderId) {
  const review = await Review.findOne({ orderId: orderId })
    .populate('reviewerId', 'fullName avatar')
    .populate('reviewedUserId', 'fullName avatar')
    .populate('productId', 'title images');
  
  return review; // Can be null if no review exists
}

/**
 * Update review
 */
async function updateReview(reviewId, reviewerId, rating, comment) {
  // Validate rating
  if (rating && (rating < 1 || rating > 5)) {
    throw new Error('Đánh giá phải từ 1 đến 5 sao');
  }
  
  // Get review
  const review = await Review.findById(reviewId);
  
  if (!review) {
    throw new Error('Đánh giá không tồn tại');
  }
  
  // Verify reviewer
  if (review.reviewerId.toString() !== reviewerId.toString()) {
    throw new Error('Bạn không có quyền chỉnh sửa đánh giá này');
  }
  
  // Update review
  if (rating) {
    review.rating = rating;
  }
  
  if (comment !== undefined) {
    review.comment = comment.trim();
  }
  
  await review.save();
  
  // Recalculate seller's rating
  await updateUserRating(review.reviewedUserId);
  
  return review;
}

/**
 * Delete review (hide)
 */
async function deleteReview(reviewId, reviewerId) {
  // Get review
  const review = await Review.findById(reviewId);
  
  if (!review) {
    throw new Error('Đánh giá không tồn tại');
  }
  
  // Verify reviewer
  if (review.reviewerId.toString() !== reviewerId.toString()) {
    throw new Error('Bạn không có quyền xóa đánh giá này');
  }
  
  // Hide review (soft delete)
  review.status = 'hidden';
  await review.save();
  
  // Recalculate seller's rating
  await updateUserRating(review.reviewedUserId);
  
  return review;
}

/**
 * Get rating statistics for a user
 */
async function getRatingStats(userId) {
  const stats = await Review.calculateAverageRating(userId);
  
  // Get rating distribution
  const distribution = await Review.aggregate([
    {
      $match: {
        reviewedUserId: userId,
        status: 'active'
      }
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);
  
  // Format distribution
  const ratingDistribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  };
  
  distribution.forEach(item => {
    ratingDistribution[item._id] = item.count;
  });
  
  return {
    averageRating: stats.averageRating,
    totalReviews: stats.totalReviews,
    distribution: ratingDistribution
  };
}

/**
 * Check if user can review an order
 */
async function canReviewOrder(userId, orderId) {
  // Get order
  const order = await Order.findById(orderId);
  
  if (!order) {
    return { canReview: false, reason: 'Đơn hàng không tồn tại' };
  }
  
  // Check if user is the buyer
  if (order.buyerId.toString() !== userId.toString()) {
    return { canReview: false, reason: 'Chỉ người mua mới có thể đánh giá' };
  }
  
  // Check if order is completed
  if (order.status !== 'completed') {
    return { canReview: false, reason: 'Đơn hàng chưa hoàn thành' };
  }
  
  // Check if review already exists
  const existingReview = await Review.findOne({ orderId: orderId });
  if (existingReview) {
    return { canReview: false, reason: 'Bạn đã đánh giá đơn hàng này rồi' };
  }
  
  return { canReview: true };
}

/**
 * Get reviews written by a user
 */
async function getReviewsByReviewer(reviewerId, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;
  
  const reviews = await Review.find({ reviewerId: reviewerId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('reviewedUserId', 'fullName avatar')
    .populate('productId', 'title images')
    .populate('orderId', 'agreedAmount');
  
  const total = await Review.countDocuments({ reviewerId: reviewerId });
  
  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

module.exports = {
  createReview,
  updateUserRating,
  getReviews,
  getReviewById,
  getReviewByOrderId,
  updateReview,
  deleteReview,
  getRatingStats,
  canReviewOrder,
  getReviewsByReviewer
};
