const mongoose = require('mongoose');

/**
 * Review Schema
 * Represents a rating and review left by a buyer for a seller after order completion
 */
const reviewSchema = new mongoose.Schema({
  // Order this review is for
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true, // One review per order
    index: true
  },
  
  // Reviewer (buyer)
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Reviewed user (seller)
  reviewedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Product that was purchased
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  
  // Rating (1-5 stars)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  // Review comment (optional)
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Review status
  status: {
    type: String,
    enum: ['active', 'hidden', 'reported'],
    default: 'active'
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Indexes for efficient queries
reviewSchema.index({ reviewedUserId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ reviewerId: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });

// Virtual for checking if review is active
reviewSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Static method to calculate average rating for a user
reviewSchema.statics.calculateAverageRating = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        reviewedUserId: userId,
        status: 'active'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  if (result.length > 0) {
    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: result[0].totalReviews
    };
  }
  
  return {
    averageRating: 0,
    totalReviews: 0
  };
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
