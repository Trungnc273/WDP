const mongoose = require('mongoose');

/**
 * Transaction Schema
 * Records all financial movements in the system
 * Includes deposits, withdrawals, payments, refunds, and earnings
 */
const transactionSchema = new mongoose.Schema({
  // Wallet this transaction belongs to
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  
  // User who owns the wallet
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Transaction type
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'payment', 'refund', 'earning', 'fee'],
    required: true
  },
  
  // Transaction amount
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Related order (if applicable)
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // Description of transaction
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  // Payment method (for deposits)
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'vnpay', 'sepay', 'wallet', 'escrow'],
    default: 'wallet'
  },
  
  // VNPay transaction details (if applicable)
  vnpayTransactionId: {
    type: String
  },
  
  vnpayTransactionNo: {
    type: String
  },

  // SePay transaction details (if applicable)
  sepayTransactionId: {
    type: String
  },
  
  // Bank transfer details (if applicable)
  bankTransferReceipt: {
    type: String // URL to receipt image
  },
  
  // Balance before and after transaction
  balanceBefore: {
    type: Number,
    required: true
  },
  
  balanceAfter: {
    type: Number,
    required: true
  },
  
  // Metadata for additional information
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Timestamps for status changes
  completedAt: {
    type: Date
  },
  
  failedAt: {
    type: Date
  },
  
  cancelledAt: {
    type: Date
  },
  
  // Failure reason
  failureReason: {
    type: String
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Indexes for efficient queries
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ vnpayTransactionId: 1 });

// Virtual for checking if transaction is completed
transactionSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Virtual for checking if transaction is pending
transactionSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

// Static method to create a transaction
transactionSchema.statics.createTransaction = async function(data) {
  const transaction = new this(data);
  return await transaction.save();
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
