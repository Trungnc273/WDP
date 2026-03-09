import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Link } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AppRoutes from './routes';
import MobileMenu from './components/MobileMenu';
import Footer from './components/Footer';

function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <Router>
      <div className="App">
        <nav className={`navbar ${isScrolled ? 'navbar--scrolled' : 'navbar--transparent'}`}>
          <div className="navbar__container">
            {/* Left: Logo + Mobile Menu */}
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

            {/* Center: Main Menu */}
            <div className="navbar__center">
              <Link to="/" className="navbar__menu-item">
                Trang chủ
              </Link>
              <Link to="/products" className="navbar__menu-item">
                Sản phẩm
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="navbar__right">
              {isAuthenticated ? (
                <>
                  <button className="navbar__icon-btn" title="Yêu thích">
                    <span className="icon">❤️</span>
                  </button>
                  <button className="navbar__icon-btn" title="Thông báo">
                    <span className="icon">🔔</span>
                  </button>
                  <Link to="/chat" className="navbar__icon-btn" title="Chat">
                    <span className="icon">💬</span>
                  </Link>
                  
                  <Link to="/my-products" className="navbar__btn-manage">
                    Quản lý tin
                  </Link>
                  
                  <Link to="/product/create" className="navbar__btn-post">
                    Đăng tin
                  </Link>
                  
                  {/* User Avatar Dropdown */}
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
                          <Link to="/orders" className="user-dropdown-menu__item">
                            <span className="icon">📦</span>
                            Đơn hàng
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

        <AppRoutes />
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;
