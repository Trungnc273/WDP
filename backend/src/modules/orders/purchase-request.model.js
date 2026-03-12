const mongoose = require('mongoose');

/**
 * Purchase Request Schema
 * Represents a buyer's initial offer to purchase a product
 * Seller can accept or reject this request
 */
const purchaseRequestSchema = new mongoose.Schema({
  // Product being requested
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  
  // Buyer information
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Seller information
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Buyer's message to seller
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // Agreed price (buyer's offer)
  agreedPrice: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Request status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },

  // Which side initiated this request
  initiatedBy: {
    type: String,
    enum: ['buyer', 'seller'],
    default: 'buyer',
    index: true
  },
  
  // Response from seller
  sellerResponse: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Timestamps for status changes
  acceptedAt: {
    type: Date
  },
  
  rejectedAt: {
    type: Date
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Indexes for efficient queries
purchaseRequestSchema.index({ sellerId: 1, status: 1 });
purchaseRequestSchema.index({ buyerId: 1, status: 1 });
purchaseRequestSchema.index({ initiatedBy: 1, status: 1 });
purchaseRequestSchema.index({ createdAt: -1 });

// Virtual for checking if request is still pending
purchaseRequestSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

// Virtual for checking if request can be accepted
purchaseRequestSchema.virtual('canBeAccepted').get(function() {
  return this.status === 'pending';
});

// Virtual for checking if request can be rejected
purchaseRequestSchema.virtual('canBeRejected').get(function() {
  return this.status === 'pending';
});

const PurchaseRequest = mongoose.model('PurchaseRequest', purchaseRequestSchema);

module.exports = PurchaseRequest;
