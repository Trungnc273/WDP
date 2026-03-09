const mongoose = require('mongoose');

/**
 * Escrow Hold Schema
 * Represents funds held in escrow during a transaction
 * Funds are held until buyer confirms receipt or dispute is resolved
 */
const escrowHoldSchema = new mongoose.Schema({
  // Order this escrow hold is for
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  
  // Amount held in escrow
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Buyer who paid
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Seller who will receive funds
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Escrow status
  status: {
    type: String,
    enum: ['held', 'released', 'refunded'],
    default: 'held'
  },
  
  // Timestamps for status changes
  releasedAt: {
    type: Date
  },
  
  refundedAt: {
    type: Date
  },
  
  // Release/refund reason
  releaseReason: {
    type: String
  },
  
  refundReason: {
    type: String
  },
  
  // Auto-release flag
  isAutoReleased: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Indexes for efficient queries
escrowHoldSchema.index({ status: 1 });
escrowHoldSchema.index({ createdAt: -1 });

// Virtual for checking if funds are still held
escrowHoldSchema.virtual('isHeld').get(function() {
  return this.status === 'held';
});

// Virtual for checking if funds were released
escrowHoldSchema.virtual('isReleased').get(function() {
  return this.status === 'released';
});

// Virtual for checking if funds were refunded
escrowHoldSchema.virtual('isRefunded').get(function() {
  return this.status === 'refunded';
});

// Method to release funds to seller
escrowHoldSchema.methods.release = function(reason = 'Buyer confirmed receipt', isAuto = false) {
  if (this.status !== 'held') {
    throw new Error('Escrow funds are not in held status');
  }
  
  this.status = 'released';
  this.releasedAt = new Date();
  this.releaseReason = reason;
  this.isAutoReleased = isAuto;
  
  return this.save();
};

// Method to refund funds to buyer
escrowHoldSchema.methods.refund = function(reason = 'Dispute resolved in favor of buyer') {
  if (this.status !== 'held') {
    throw new Error('Escrow funds are not in held status');
  }
  
  this.status = 'refunded';
  this.refundedAt = new Date();
  this.refundReason = reason;
  
  return this.save();
};

const EscrowHold = mongoose.model('EscrowHold', escrowHoldSchema);

module.exports = EscrowHold;
