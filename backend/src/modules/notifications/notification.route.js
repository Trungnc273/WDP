const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');

/**
 * Notification Routes
 * All routes require authentication
 */

router.use(authenticate);

// Get unread notifications
router.get('/unread', notificationController.getUnreadNotifications);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Get all notifications
router.get('/', notificationController.getNotifications);

// Mark notification as read
router.post('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.post('/mark-all-read', notificationController.markAllAsRead);

module.exports = router;
