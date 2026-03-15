const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  type: {
    type: String,
    enum: [
      'order_created',
      'order_confirmed',
      'order_shipped',
      'order_completed',
      'payment_success',
      'dispute_created',
      'review_received',
      'report_update',
      'dispute_update',
      'system',
      'security'
    ],
    default: 'order_created'
  },

  // Lien ket den thuc the lien quan
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },

  disputeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  },

  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  },

  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  },

  // Thong tin nguoi gui
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Noi dung thong bao
  title: {
    type: String,
    required: true
  },

  message: {
    type: String
  },

  // Trang thai da doc
  isRead: {
    type: Boolean,
    default: false
  },

  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Tao index de truy van hieu qua hon
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, type: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
