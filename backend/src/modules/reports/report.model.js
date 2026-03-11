const mongoose = require('mongoose');

/**
 * Report Schema
 * Represents a user report about a product or another user
 */
const reportSchema = new mongoose.Schema({
  // Reporter (user who submitted the report)
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Reported user (if reporting a user)
  reportedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Reported product (if reporting a product)
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    index: true
  },
  
  // Report type
  reportType: {
    type: String,
    enum: ['product', 'user'],
    required: true
  },
  
  // Report reason
  reason: {
    type: String,
    enum: ['counterfeit', 'inappropriate', 'scam', 'spam', 'other'],
    required: true
  },
  
  // Detailed description
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Evidence images
  evidenceImages: [{
    type: String // URLs to images
  }],
  
  // Report status
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
    default: 'pending'
  },
  
  // Moderator who handled the report
  moderatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Quyết định xử lý của moderator (đã loại bỏ lựa chọn "không hành động")
  moderatorDecision: {
    type: String,
    enum: ['remove_content', 'warn_user', 'ban_user', 'reply_feedback'],
  },
  
  // Moderator's notes
  moderatorNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Nội dung phản hồi lại cho người dùng đã gửi báo cáo
  moderatorReply: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Timestamps for status changes
  reviewedAt: {
    type: Date
  },
  
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Indexes for efficient queries
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportType: 1, status: 1 });
reportSchema.index({ productId: 1, status: 1 });

// Validation: Must have either reportedUserId or productId
reportSchema.pre('validate', function(next) {
  if (!this.reportedUserId && !this.productId) {
    next(new Error('Report must have either reportedUserId or productId'));
  } else {
    next();
  }
});

// Virtual for checking if report is pending
reportSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
