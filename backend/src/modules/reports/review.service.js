const Review = require('./review.model');
const Order = require('../orders/order.model');
const User = require('../users/user.model');

/**
 * Service xu ly nghiep vu danh gia va diem so seller.
 */

/**
 * Tao danh gia cho seller sau khi don hoan thanh.
 */
async function createReview(reviewerId, orderId, rating, comment = '') {
  // Kiem tra rating hop le 1..5.
  if (!rating || rating < 1 || rating > 5) {
    throw new Error('Đánh giá phải từ 1 đến 5 sao');
  }
  
  // Lay don hang de doi chieu quyen va trang thai.
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new Error('Đơn hàng không tồn tại');
  }
  
  // Chi buyer cua don moi duoc review.
  if (order.buyerId.toString() !== reviewerId.toString()) {
    throw new Error('Chỉ người mua mới có thể đánh giá');
  }
  
  // Don phai hoan thanh moi duoc danh gia.
  if (order.status !== 'completed') {
    throw new Error('Chỉ có thể đánh giá sau khi đơn hàng hoàn thành');
  }
  
  // Moi don chi duoc tao 1 review.
  const existingReview = await Review.findOne({ orderId: orderId });
  if (existingReview) {
    throw new Error('Bạn đã đánh giá đơn hàng này rồi');
  }
  
  // Tao review active.
  const review = await Review.create({
    orderId: orderId,
    reviewerId: reviewerId,
    reviewedUserId: order.sellerId,
    productId: order.productId,
    rating: rating,
    comment: comment.trim(),
    status: 'active'
  });
  
  // Cap nhat lai diem trung binh seller sau khi co review moi.
  await updateUserRating(order.sellerId);
  
  // Bo sung thong tin lien quan de frontend hien thi.
  await review.populate([
    { path: 'reviewerId', select: 'fullName avatar' },
    { path: 'reviewedUserId', select: 'fullName avatar' },
    { path: 'productId', select: 'title images' },
    { path: 'orderId', select: 'agreedAmount' }
  ]);
  
  return review;
}

/**
 * Tinh va cap nhat diem trung binh + tong review cho seller.
 */
async function updateUserRating(userId) {
  // Tinh thong ke tu cac review active.
  const stats = await Review.calculateAverageRating(userId);
  
  // Luu thong ke vao user profile.
  await User.findByIdAndUpdate(userId, {
    rating: stats.averageRating,
    totalReviews: stats.totalReviews
  });
  
  return stats;
}

/**
 * Lay danh sach review cua seller theo bo loc + phan trang.
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
  
  // Tra kem thong ke diem tong quan.
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
 * Lay chi tiet 1 review.
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
 * Lay review theo order (neu da ton tai).
 */
async function getReviewByOrderId(orderId) {
  const review = await Review.findOne({ orderId: orderId })
    .populate('reviewerId', 'fullName avatar')
    .populate('reviewedUserId', 'fullName avatar')
    .populate('productId', 'title images');
  
  return review; // Co the null neu don chua duoc review.
}

/**
 * Sua review cua chinh reviewer.
 */
async function updateReview(reviewId, reviewerId, rating, comment) {
  // Kiem tra rating neu co thay doi.
  if (rating && (rating < 1 || rating > 5)) {
    throw new Error('Đánh giá phải từ 1 đến 5 sao');
  }
  
  // Lay review can sua.
  const review = await Review.findById(reviewId);
  
  if (!review) {
    throw new Error('Đánh giá không tồn tại');
  }
  
  // Chi tac gia review moi duoc sua.
  if (review.reviewerId.toString() !== reviewerId.toString()) {
    throw new Error('Bạn không có quyền chỉnh sửa đánh giá này');
  }
  
  // Cap nhat truong duoc phep.
  if (rating) {
    review.rating = rating;
  }
  
  if (comment !== undefined) {
    review.comment = comment.trim();
  }
  
  await review.save();
  
  // Tinh lai diem seller sau khi sua.
  await updateUserRating(review.reviewedUserId);
  
  return review;
}

/**
 * Xoa mem review (an review), khong xoa cung du lieu.
 */
async function deleteReview(reviewId, reviewerId) {
  // Lay review can xoa.
  const review = await Review.findById(reviewId);
  
  if (!review) {
    throw new Error('Đánh giá không tồn tại');
  }
  
  // Chi tac gia review moi duoc xoa.
  if (review.reviewerId.toString() !== reviewerId.toString()) {
    throw new Error('Bạn không có quyền xóa đánh giá này');
  }
  
  // Chuyen status sang hidden.
  review.status = 'hidden';
  await review.save();
  
  // Tinh lai diem seller sau khi an review.
  await updateUserRating(review.reviewedUserId);
  
  return review;
}

/**
 * Lay thong ke phan bo sao cua seller.
 */
async function getRatingStats(userId) {
  const stats = await Review.calculateAverageRating(userId);
  
  // Gom nhom so luong review theo tung muc sao.
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
  
  // Chuan hoa response 1..5 sao cho frontend.
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
 * Kiem tra user co du dieu kien review don hay khong.
 */
async function canReviewOrder(userId, orderId) {
  // Lay don de check quyen + trang thai.
  const order = await Order.findById(orderId);
  
  if (!order) {
    return { canReview: false, reason: 'Đơn hàng không tồn tại' };
  }
  
  // Chi buyer duoc review.
  if (order.buyerId.toString() !== userId.toString()) {
    return { canReview: false, reason: 'Chỉ người mua mới có thể đánh giá' };
  }
  
  // Don chua completed thi chua duoc review.
  if (order.status !== 'completed') {
    return { canReview: false, reason: 'Đơn hàng chưa hoàn thành' };
  }
  
  // Da co review thi chan tao moi.
  const existingReview = await Review.findOne({ orderId: orderId });
  if (existingReview) {
    return { canReview: false, reason: 'Bạn đã đánh giá đơn hàng này rồi' };
  }
  
  return { canReview: true };
}

/**
 * Lay cac review ma user da viet.
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
