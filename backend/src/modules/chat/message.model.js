const mongoose = require('mongoose');

/**
 * Message Schema
 * Represents individual messages in a conversation
 */
const messageSchema = new mongoose.Schema({
  // Conversation this message belongs to
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  
  // Sender of the message
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Message content
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Message type
  type: {
    type: String,
    // Bo sung 'image' de luu tin nhan anh trong chat.
    enum: ['text', 'image', 'system', 'offer'],
    default: 'text'
  },

  // Optional structured payload for non-text messages (e.g., seller offers)
  metadata: {
    // Chat anh dung metadata de luu imageUrl, mimeType, kich thuoc, ...
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Read timestamp
  readAt: {
    type: Date
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Indexes for efficient queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, isRead: 1 });

// Virtual for checking if message is unread
messageSchema.virtual('isUnread').get(function() {
  return !this.isRead;
});

// Method to mark message as read
messageSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to mark all messages as read in a conversation
messageSchema.statics.markAllAsRead = async function(conversationId, userId) {
  return await this.updateMany(
    {
      conversationId: conversationId,
      senderId: { $ne: userId },
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
