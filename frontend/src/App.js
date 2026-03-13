import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Link, useLocation } from 'react-router-dom';
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
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const socketRef = useRef(null);
  const notificationRef = useRef(null);
  const location = useLocation();

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
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

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

  // Khoi tao socket va lang nghe thong bao
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    try {
      socketRef.current = chatService.connectSocket(token);

      // Lay so thong bao chua doc ban dau
      fetchUnreadCount();
      fetchChatUnreadCount();

      // Lang nghe thong bao moi
      socketRef.current.on('new_notification', ({ notification }) => {
        setUnreadCount(prev => prev + 1);
      });

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
  }, [isAuthenticated, token, user?._id, fetchUnreadCount, fetchChatUnreadCount]);

  const handleChatIconClick = () => {
    setChatUnreadCount(0);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
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
              <Link to="/products" className="navbar__menu-item">
                Sản phẩm
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
                    <button className="navbar__icon-btn" title="Yêu thích">
                      <span className="icon">❤️</span>
                    </button>
                    <div className="notification-dropdown-wrapper" ref={notificationRef}>
                      <button 
                        className="navbar__icon-btn" 
                        title="Thông báo"
                        onClick={() => setShowNotification(!showNotification)}
                      >
                        <span className="icon">🔔</span>
                        {unreadCount > 0 && (
                          <span className="notification-badge">{unreadCount}</span>
                        )}
                      </button>
                      {showNotification && (
                        <NotificationPanel 
                          isOpen={showNotification} 
                          onClose={() => setShowNotification(false)}
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
                  <div className="navbar__user-dropdown">
                    <button 
                      className="navbar__user-avatar"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                      <img 
                        src="/images/placeholders/avatar-placeholder.svg"
                        alt={user?.fullName}
                      />
                      <span className="navbar__user-arrow">▼</span>
                    </button>
                    
                    {showUserMenu && (
                      <div className="user-dropdown-menu">
                        <div className="user-dropdown-menu__header">
                          <div className="user-dropdown-menu__avatar">
                            <img 
                              src="/images/placeholders/avatar-placeholder.svg"
                              alt={user?.fullName}
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
                        </div>
                        
                        <div className="user-dropdown-menu__section">
                          <div className="user-dropdown-menu__label">Tiện ích</div>
                          <Link to="/favorites" className="user-dropdown-menu__item">
                            <span className="icon">❤️</span>
                            Tin đăng đã lưu
                          </Link>
                          <Link to="/saved-searches" className="user-dropdown-menu__item">
                            <span className="icon">🔖</span>
                            Tìm kiếm đã lưu
                          </Link>
                          <Link to="/history" className="user-dropdown-menu__item">
                            <span className="icon">🕐</span>
                            Lịch sử xem tin
                          </Link>
                        </div>
                        
                        <div className="user-dropdown-menu__section">
                          <div className="user-dropdown-menu__label">Dịch vụ trả phí</div>
                          <Link to="/pro" className="user-dropdown-menu__item">
                            <span className="icon">⚡</span>
                            Gói PRO
                          </Link>
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
