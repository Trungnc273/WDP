import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Link, useLocation, useNavigate } from 'react-router-dom';
import { getUserAvatarUrl } from './utils/imageHelper';
import { useAuth } from './hooks/useAuth';
import AppRoutes from './routes';
import MobileMenu from './components/MobileMenu';
import Footer from './components/Footer';
import NotificationPanel from './components/NotificationPanel';
import notificationService from './services/notification.service';
import chatService from './services/chat.service';

function AppShell() {
  const { isAuthenticated, user, logout, token } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newNotificationCount, setNewNotificationCount] = useState(0);
  const [notificationRefreshTick, setNotificationRefreshTick] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const socketRef = useRef(null);
  const lastUnreadCountRef = useRef(0);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isModeratorRoute = location.pathname.startsWith('/moderator');
  const isAdminRoute = location.pathname.startsWith('/admin');
  // Dang o trang chat thi an badge tren icon chat de tranh roi mat.
  const isChatRoute = location.pathname.startsWith('/chat');

  // Dong dropdown thong bao khi bam ra ngoai
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotification(false);
      }
    };
    if (showNotification) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotification]);

  // Dong dropdown profile khi bam ra ngoai
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);

       // Khong dung realtime: chi bao "moi" khi polling thay so chua doc tang.
      if (!showNotification && count > lastUnreadCountRef.current) {
        setNewNotificationCount((prev) => prev + (count - lastUnreadCountRef.current));
      }

      if (count < lastUnreadCountRef.current && showNotification) {
        setNewNotificationCount(0);
      }

      lastUnreadCountRef.current = count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [showNotification]);

  const fetchChatUnreadCount = useCallback(async () => {
    try {
      const conversationData = await chatService.getConversations(1, 100);
      const conversations = conversationData?.conversations || [];
      const currentUserId = user?._id?.toString?.();

      if (!currentUserId) {
        setChatUnreadCount(0);
        return;
      }

      const totalUnread = conversations.reduce((total, conversation) => {
        const buyerId = (
          conversation?.buyer?._id ||
          conversation?.buyerId?._id ||
          conversation?.buyer ||
          conversation?.buyerId
        )?.toString?.();
        const sellerId = (
          conversation?.seller?._id ||
          conversation?.sellerId?._id ||
          conversation?.seller ||
          conversation?.sellerId
        )?.toString?.();

        if (buyerId && buyerId === currentUserId) {
          return total + Number(conversation?.buyerUnreadCount || 0);
        }

        if (sellerId && sellerId === currentUserId) {
          return total + Number(conversation?.sellerUnreadCount || 0);
        }

        return total;
      }, 0);

      setChatUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching chat unread count:', error);
    }
  }, [user?._id]);

  // Khoi tao socket cho chat badge (khong dung realtime cho thong bao he thong)
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    try {
      socketRef.current = chatService.connectSocket(token);

      // Chi lay unread chat khi vao app
      fetchChatUnreadCount();

      // Su kien chinh de tang badge tin nhan khi co tin moi.
      socketRef.current.on('new_message_notification', () => {
        setChatUnreadCount((prev) => prev + 1);
      });

      // Fallback khi tin moi chi phat qua room, tranh hut thong bao.
      socketRef.current.on('receive_message', ({ message }) => {
        const currentUserId = user?._id?.toString?.();
        const senderId = (
          message?.sender?._id ||
          message?.senderId?._id ||
          message?.sender ||
          message?.senderId
        )?.toString?.();

        if (senderId && currentUserId && senderId !== currentUserId) {
          setChatUnreadCount((prev) => prev + 1);
        }
      });

      socketRef.current.on('connect', () => {
        fetchChatUnreadCount();
      });
    } catch (error) {
      console.error('Error initializing notification socket:', error);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isAuthenticated, token, user?._id, fetchChatUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchUnreadCount();

    const intervalId = setInterval(() => {
      fetchUnreadCount();
    }, 12000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, fetchUnreadCount]);

  const handleChatIconClick = () => {
    setChatUnreadCount(0);
  };

  const handleNotificationBellClick = () => {
    const nextOpen = !showNotification;
    setShowNotification(nextOpen);

    if (nextOpen) {
      // Chi tat chi bao "moi" khi nguoi dung chu dong bam chuong de xem.
      setNewNotificationCount(0);
      setNotificationRefreshTick(prev => prev + 1);
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  return (
    <div className="App">
      {!isModeratorRoute && !isAdminRoute && (
        <nav className={`navbar ${isScrolled ? 'navbar--scrolled' : 'navbar--transparent'}`}>
          <div className="navbar__container">
            {/* Ben trai: Logo + menu mobile */}
            <div className="navbar__left">
              <MobileMenu />
              <Link to="/" className="navbar__logo navbar__logo--large">
                <img 
                  src="/images/logo/logo.png" 
                  alt="ReFlow Logo" 
                  className="navbar__logo-image"
                />
              </Link>
            </div>

            {/* O giua: Menu chinh */}
            <div className="navbar__center">
              <Link to="/" className="navbar__menu-item">
                Trang chủ
              </Link>
            </div>

            {/* Ben phai: Nhom hanh dong */}
            <div className="navbar__right">
              {isAuthenticated ? (
                <>
                  <div className="navbar__nav-cluster">
                    <Link to="/orders" className="navbar__btn-orders">
                      Đơn hàng
                    </Link>

                    <Link to="/seller-orders" className="navbar__btn-orders navbar__btn-orders--seller">
                      Đơn bán
                    </Link>
                    
                    <Link to="/my-products" className="navbar__btn-manage">
                      Quản lý tin
                    </Link>
                  </div>
                  
                  <Link to="/product/create" className="navbar__btn-post">
                    Đăng tin
                  </Link>

                  <div className="navbar__tool-cluster">
                    <Link to="/favorites" className="navbar__icon-btn" title="Yêu thích">
                      <span className="icon">❤️</span>
                    </Link>
                    <div className="notification-dropdown-wrapper" ref={notificationRef}>
                      <button 
                        className="navbar__icon-btn" 
                        title="Thông báo"
                        onClick={handleNotificationBellClick}
                      >
                        <span className="icon">🔔</span>
                        {newNotificationCount > 0 && (
                          <span className="notification-badge">{newNotificationCount > 99 ? '99+' : newNotificationCount}</span>
                        )}
                      </button>
                      {showNotification && (
                        <NotificationPanel 
                          isOpen={showNotification} 
                          onClose={() => setShowNotification(false)}
                          refreshTrigger={notificationRefreshTick}
                          onUnreadCountChange={setUnreadCount}
                        />
                      )}
                    </div>
                    <Link to="/chat" className="navbar__icon-btn" title="Chat" onClick={handleChatIconClick}>
                      <span className="icon">💬</span>
                      {/* Chi hien badge khi khong dung trong trang chat. */}
                      {!isChatRoute && chatUnreadCount > 0 && (
                        <span className="notification-badge">{chatUnreadCount > 99 ? '99+' : chatUnreadCount}</span>
                      )}
                    </Link>
                  </div>
                  
                  {/* Dropdown avatar nguoi dung */}
                  <div className="navbar__user-dropdown" ref={userMenuRef}>
                    <button 
                      className="navbar__user-avatar"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                      <img 
                        src={getUserAvatarUrl(user)}
                        alt={user?.fullName}
                        onError={(e) => { e.currentTarget.src = '/images/placeholders/avatar-placeholder.svg'; }}
                      />
                      <span className="navbar__user-arrow">▼</span>
                    </button>
                    
                    {showUserMenu && (
                      <div className="user-dropdown-menu">
                        <div className="user-dropdown-menu__header">
                          <div className="user-dropdown-menu__avatar">
                            <img 
                              src={getUserAvatarUrl(user)}
                              alt={user?.fullName}
                              onError={(e) => { e.currentTarget.src = '/images/placeholders/avatar-placeholder.svg'; }}
                            />
                          </div>
                          <div className="user-dropdown-menu__info">
                            <div className="user-dropdown-menu__name">{user?.fullName}</div>
                            <div className="user-dropdown-menu__id">ID: {user?._id?.slice(-8)}</div>
                          </div>
                        </div>
                        
                        <div className="user-dropdown-menu__section">
                          <div className="user-dropdown-menu__label">Quản lý</div>
                          <Link to="/profile" className="user-dropdown-menu__item">
                            <span className="icon">👤</span>
                            Tài khoản
                          </Link>
                          <Link to="/wallet" className="user-dropdown-menu__item">
                            <span className="icon">💰</span>
                            Ví của tôi
                          </Link>
                          <Link to="/chat" className="user-dropdown-menu__item">
                            <span className="icon">💬</span>
                            Tin nhắn
                          </Link>
                          {user?.role === 'admin' && (
                            <Link to="/admin" className="user-dropdown-menu__item">
                              <span className="icon">⚙️</span>
                              Trang quản trị
                            </Link>
                          )}
                          {user?.role === 'moderator' && (
                            <Link to="/moderator" className="user-dropdown-menu__item">
                              <span className="icon">🛡️</span>
                              Trang kiểm duyệt
                            </Link>
                          )}
                        </div>
                        
                        <div className="user-dropdown-menu__section">
                          <button onClick={handleLogout} className="user-dropdown-menu__item">
                            <span className="icon">🚪</span>
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="navbar__btn-login">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="navbar__btn-post">
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}

      <AppRoutes />
        
      {!isModeratorRoute && !isAdminRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
