const mongoose = require('mongoose');

/**
 * Wallet Schema
 * Digital wallet for each user to manage their balance
 * Used for payments, deposits, and withdrawals
 */
const walletSchema = new mongoose.Schema({
  // User who owns this wallet
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Current available balance
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  
  // Total amount ever deposited
  totalDeposited: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Total amount ever withdrawn
  totalWithdrawn: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Total amount spent on purchases
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Total amount earned from sales
  totalEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Currency (for future multi-currency support)
  currency: {
    type: String,
    default: 'VND'
  },
  
  // Wallet status
  status: {
    type: String,
    enum: ['active', 'frozen', 'closed'],
    default: 'active'
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Virtual for checking if wallet is active
walletSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Virtual for checking if wallet has sufficient balance
walletSchema.methods.hasSufficientBalance = function(amount) {
  return this.balance >= amount;
};

// Method to increment balance
walletSchema.methods.incrementBalance = function(amount, type = 'deposit') {
  this.balance += amount;
  
  if (type === 'deposit') {
    this.totalDeposited += amount;
  } else if (type === 'earning') {
    this.totalEarned += amount;
  }
  
  return this.save();
};

// Method to decrement balance
walletSchema.methods.decrementBalance = function(amount, type = 'payment') {
  if (!this.hasSufficientBalance(amount)) {
    throw new Error('Số dư không đủ');
  }
  
  this.balance -= amount;
  
  if (type === 'payment') {
    this.totalSpent += amount;
  } else if (type === 'withdrawal') {
    this.totalWithdrawn += amount;
  }
  
  return this.save();
};

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
