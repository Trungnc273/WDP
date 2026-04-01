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

  // Optional media evidence attached by buyer when confirming receipt/review.
  evidenceFiles: {
    type: [String],
    default: [],
    validate: {
      validator(files) {
        return !Array.isArray(files) || files.length <= 5;
      },
      message: 'Tối đa 5 tệp bằng chứng cho mỗi đánh giá'
    }
  },

  // Legacy alias to keep old UI/API payloads working.
  evidenceImages: {
    type: [String],
    default: []
  },
  
  // Review status
  status: {
    type: String,
    enum: ['active', 'hidden', 'reported'],
    default: 'active'
  },

  // Moderator assessment used for seller penalty workflow
  moderatorAssessment: {
    isReviewed: {
      type: Boolean,
      default: false
    },
    isBad: {
      type: Boolean,
      default: false
    },
    verdict: {
      type: String,
      enum: ['good', 'bad'],
      default: null
    },
    moderatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500
    },
    markedAt: {
      type: Date
    },
    penaltyLevel: {
      type: Number,
      default: 0
    }
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
// Sửa lại aggregate để luôn trả về đúng điểm trung bình và số lượng review active cho seller
reviewSchema.statics.calculateAverageRating = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        reviewedUserId: new mongoose.Types.ObjectId(userId),
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
  if (result.length > 0 && typeof result[0].averageRating === 'number') {
    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
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
