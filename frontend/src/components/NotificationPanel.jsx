import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notification.service';
import './NotificationPanel.css';

const NotificationPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(1, 20);
      setNotifications(data?.notifications || []);
      
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractEntityId = (value) => {
    if (!value) return null;
    if (typeof value === 'string' || typeof value === 'number') return value.toString();
    return value._id?.toString?.() || value.id?.toString?.() || null;
  };

  const resolveOrderIdFromNotification = async (notification) => {
    const directOrderId = extractEntityId(notification?.orderId);
    if (directOrderId) return directOrderId;

    const disputeId = extractEntityId(notification?.disputeId);
    if (disputeId) {
      try {
        const dispute = await notificationService.getDisputeById(disputeId);
        return extractEntityId(dispute?.orderId);
      } catch (error) {
        console.error('Error resolving dispute notification order:', error);
      }
    }

    return null;
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Danh dau da doc
      if (!notification.isRead) {
        await notificationService.markAsRead(notification._id);
        setNotifications(prev => prev.map((item) => (
          item._id === notification._id ? { ...item, isRead: true } : item
        )));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Dieu huong theo loai thong bao
      // Cac thong bao lien quan don hang deu mo trang chi tiet don
      const orderId = await resolveOrderIdFromNotification(notification);
      
      switch (notification.type) {
        case 'order_created':
        case 'order_confirmed':
        case 'order_shipped':
        case 'order_completed':
        case 'payment_success':
        case 'dispute_created':
        case 'report_update':
        case 'dispute_update':
        case 'review_received': {
          if (orderId) {
            navigate(`/order-detail/${orderId}`);
          } else {
            navigate('/orders');
          }
          break;
        }
        
        default:
          break;
      }
      
      onClose();
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map((notification) => ({ ...notification, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_created':
        return '📦';
      case 'order_confirmed':
        return '✅';
      case 'order_shipped':
        return '🚚';
      case 'order_completed':
        return '🎉';
      case 'payment_success':
        return '💸';
      case 'report_update':
        return '🛡️';
      case 'dispute_update':
        return '⚖️';
      case 'system':
        return '📢';
      case 'dispute_created':
        return '⚠️';
      case 'review_received':
        return '⭐';
      default:
        return '🔔';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notification-header">
          <h3>Thông báo ({unreadCount})</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {notifications.length > 0 && (
          <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
            Đánh dấu tất cả đã đọc
          </button>
        )}

        <div className="notification-list">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <p>Không có thông báo nào</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-item ${notification.isRead ? 'is-read' : 'is-unread'}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <span className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  {notification.message && (
                    <div className="notification-message">{notification.message}</div>
                  )}
                  <div className="notification-time">
                    {new Date(notification.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
  );
};

export default NotificationPanel;
