const mongoose = require('mongoose');

/**
 * Dispute Schema
 * Represents a formal complaint by a buyer about an order
 * Used when product is not as described, damaged, or not received
 */
const disputeSchema = new mongoose.Schema({
  // Order being disputed
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true // One dispute per order
  },
  
  // Buyer who raised the dispute
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Seller involved in the dispute
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Product involved
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  
  // Dispute reason
  reason: {
    type: String,
    enum: ['not_as_described', 'damaged', 'not_received', 'counterfeit', 'return_request', 'other'],
    required: true
  },
  
  // Detailed description
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Evidence images (required for disputes)
  evidenceImages: [{
    type: String, // URLs to images
    required: true
  }],
  
  // Dispute status
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved'],
    default: 'pending'
  },
  
  // Resolution decision
  resolution: {
    type: String,
    enum: ['refund', 'release', 'partial_refund']
  },
  
  // Refund amount (if partial refund)
  refundAmount: {
    type: Number,
    min: 0
  },
  
  // Moderator who handled the dispute
  moderatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Moderator's notes
  moderatorNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  // Nhat ky cap nhat tu moderator de hien thi trong dong thoi gian tranh chap.
  moderatorUpdates: [{
    moderatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      trim: true,
      maxlength: 1000,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Seller's response
  sellerResponse: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  sellerResponseUpdatedAt: {
    type: Date
  },
  
  // Seller's evidence
  sellerEvidenceImages: [{
    type: String // URLs to images
  }],

  // Additional buyer notes/evidence after moderator starts investigating
  buyerFollowUpNote: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  buyerAdditionalEvidenceImages: [{
    type: String
  }],

  buyerFollowUpUpdatedAt: {
    type: Date
  },
  
  // Timestamps for status changes
  investigatingAt: {
    type: Date
  },
  
  resolvedAt: {
    type: Date
  },

  // For return_request: seller confirms they have received the returned item
  sellerConfirmedReturnAt: {
    type: Date
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Indexes for efficient queries
disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ buyerId: 1, status: 1 });
disputeSchema.index({ sellerId: 1, status: 1 });

// Virtual for checking if dispute is pending
disputeSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

// Virtual for checking if dispute is resolved
disputeSchema.virtual('isResolved').get(function() {
  return this.status === 'resolved';
});

const Dispute = mongoose.model('Dispute', disputeSchema);

module.exports = Dispute;
