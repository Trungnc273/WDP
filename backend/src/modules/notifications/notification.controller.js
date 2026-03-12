const notificationService = require('./notification.service');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

/**
 * Get unread notifications
 */
async function getUnreadNotifications(req, res) {
  try {
    const userId = req.user.userId;
    const { limit } = req.query;

    const notifications = await notificationService.getUnreadNotifications(userId, limit);

    return sendSuccess(res, 200, notifications, 'Lấy thông báo chưa đọc thành công');
  } catch (error) {
    console.error('Get unread notifications error:', error);
    return sendError(res, 400, error.message);
  }
}

/**
 * Get all notifications
 */
async function getNotifications(req, res) {
  try {
    const userId = req.user.userId;
    const { page, limit } = req.query;

    const result = await notificationService.getNotifications(userId, { page, limit });

    return sendSuccess(res, 200, result, 'Lấy danh sách thông báo thành công');
  } catch (error) {
    console.error('Get notifications error:', error);
    return sendError(res, 400, error.message);
  }
}

/**
 * Mark notification as read
 */
async function markAsRead(req, res) {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    const notification = await notificationService.markAsRead(notificationId, userId);

    return sendSuccess(res, 200, notification, 'Đánh dấu đã đọc thành công');
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return sendError(res, 400, error.message);
  }
}

/**
 * Mark all notifications as read
 */
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.userId;

    await notificationService.markAllAsRead(userId);

    return sendSuccess(res, 200, null, 'Đánh dấu tất cả đã đọc thành công');
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return sendError(res, 400, error.message);
  }
}

/**
 * Get unread count
 */
async function getUnreadCount(req, res) {
  try {
    const userId = req.user.userId;

    const count = await notificationService.getUnreadCount(userId);

    return sendSuccess(res, 200, { unreadCount: count }, 'Lấy số thông báo chưa đọc thành công');
  } catch (error) {
    console.error('Get unread count error:', error);
    return sendError(res, 400, error.message);
  }
}

module.exports = {
  getUnreadNotifications,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
