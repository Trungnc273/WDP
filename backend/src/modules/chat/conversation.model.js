const mongoose = require('mongoose');

/**
 * Conversation Schema
 * Represents a chat channel between buyer and seller about a specific product
 */
const conversationSchema = new mongoose.Schema({
  // Buyer in the conversation
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Seller in the conversation
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Product being discussed
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  
  // Last message preview
  lastMessage: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Last message timestamp
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Unread message count for buyer
  buyerUnreadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Unread message count for seller
  sellerUnreadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Conversation status
  status: {
    type: String,
    enum: ['active', 'archived', 'blocked'],
    default: 'active'
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Compound index for finding conversation between two users about a product
conversationSchema.index({ buyerId: 1, sellerId: 1, productId: 1 }, { unique: true });

// Index for sorting by last message
conversationSchema.index({ lastMessageAt: -1 });

// Virtual for checking if conversation is active
conversationSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Method to get unread count for a specific user
conversationSchema.methods.getUnreadCount = function(userId) {
  if (this.buyerId.toString() === userId.toString()) {
    return this.buyerUnreadCount;
  } else if (this.sellerId.toString() === userId.toString()) {
    return this.sellerUnreadCount;
  }
  return 0;
};

// Method to increment unread count for a user
conversationSchema.methods.incrementUnreadCount = function(userId) {
  if (this.buyerId.toString() === userId.toString()) {
    this.buyerUnreadCount += 1;
  } else if (this.sellerId.toString() === userId.toString()) {
    this.sellerUnreadCount += 1;
  }
  return this.save();
};

// Method to reset unread count for a user
conversationSchema.methods.resetUnreadCount = function(userId) {
  if (this.buyerId.toString() === userId.toString()) {
    this.buyerUnreadCount = 0;
  } else if (this.sellerId.toString() === userId.toString()) {
    this.sellerUnreadCount = 0;
  }
  return this.save();
};

// Method to update last message
conversationSchema.methods.updateLastMessage = function(message) {
  this.lastMessage = message.substring(0, 200);
  this.lastMessageAt = new Date();
  return this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
