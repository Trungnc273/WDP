const Notification = require('./notification.model');
const User = require('../users/user.model');
const { emitToUser } = require('../chat/chat.socket');

function normalizeLegacyNotification(notification) {
  if (!notification) return null;

  return {
    _id: notification._id,
    recipientId: null,
    type: notification.type || 'system',
    title: notification.title || 'Thông báo',
    message: notification.message || '',
    isRead: Boolean(notification.isRead),
    createdAt: notification.createdAt || new Date(),
    orderId: null,
    disputeId: notification.relatedDisputeId || null,
    reportId: notification.relatedReportId || null,
    senderId: null,
    source: 'legacy'
  };
}

function sortNotificationsByDate(items = []) {
  return items.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

/**
 * Create and send notification
 */
async function createNotification(recipientId, notificationData) {
  try {
    const notification = await Notification.create({
      recipientId,
      ...notificationData
    });

    await notification.populate('senderId', 'fullName avatar');

    // Gui thong bao realtime cho nguoi nhan neu dang online
    emitToUser(recipientId.toString(), 'new_notification', {
      notification: notification.toObject()
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Get unread notifications for user
 */
async function getUnreadNotifications(userId, limit = 10) {
  try {
    const normalizedLimit = Math.max(1, parseInt(limit, 10) || 10);

    const notifications = await Notification.find({
      recipientId: userId,
      isRead: false
    })
      .sort({ createdAt: -1 })
      .populate('senderId', 'fullName avatar')
      .populate('orderId', 'status totalToPay');

    const user = await User.findById(userId, 'notifications').lean();
    const legacyNotifications = (user?.notifications || [])
      .filter((notification) => !notification.isRead)
      .map(normalizeLegacyNotification);

    return sortNotificationsByDate([
      ...notifications.map((notification) => notification.toObject()),
      ...legacyNotifications
    ]).slice(0, normalizedLimit);
  } catch (error) {
    console.error('Error getting unread notifications:', error);
    throw error;
  }
}

/**
 * Get all notifications for user with pagination
 */
async function getNotifications(userId, pagination = {}) {
  try {
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .populate('senderId', 'fullName avatar')
      .populate('orderId', 'status totalToPay');

    const user = await User.findById(userId, 'notifications').lean();
    const legacyNotifications = (user?.notifications || []).map(normalizeLegacyNotification);

    const mergedNotifications = sortNotificationsByDate([
      ...notifications.map((notification) => notification.toObject()),
      ...legacyNotifications
    ]);

    const total = mergedNotifications.length;

    return {
      notifications: mergedNotifications.slice(skip, skip + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
async function markAsRead(notificationId, userId) {
  try {
    const notification = await Notification.findById(notificationId);

    if (notification && notification.recipientId.toString() === userId.toString()) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();

      return notification;
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, 'notifications._id': notificationId },
      {
        $set: {
          'notifications.$.isRead': true
        }
      },
      { new: true }
    ).lean();

    if (!user) {
      throw new Error('Không tìm thấy thông báo');
    }

    return user.notifications.find((item) => String(item._id) === String(notificationId));
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
async function markAllAsRead(userId) {
  try {
    const result = await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          'notifications.$[item].isRead': true
        }
      },
      {
        arrayFilters: [{ 'item.isRead': false }]
      }
    );

    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Get unread count
 */
async function getUnreadCount(userId) {
  try {
    const count = await Notification.countDocuments({
      recipientId: userId,
      isRead: false
    });

    const user = await User.findById(userId, 'notifications').lean();
    const legacyUnreadCount = (user?.notifications || []).filter((item) => !item.isRead).length;

    return count + legacyUnreadCount;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
}

module.exports = {
  createNotification,
  getUnreadNotifications,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
