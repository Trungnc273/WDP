import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminHeader = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <button 
          className="admin-header__menu-btn"
          onClick={onToggleSidebar}
        >
          <i className="fas fa-bars"></i>
        </button>
        
        <div className="admin-header__breadcrumb">
          <span>Admin Panel</span>
        </div>
      </div>

      <div className="admin-header__right">
        <button className="admin-header__notification">
          <i className="fas fa-bell"></i>
          <span className="admin-header__notification-badge">3</span>
        </button>

        <div className="admin-header__user">
          <button 
            className="admin-header__user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <img 
              src={user?.avatar || '/images/placeholders/avatar-placeholder.svg'} 
              alt={user?.fullName}
              className="admin-header__user-avatar"
            />
            <span className="admin-header__user-name">{user?.fullName}</span>
            <i className="fas fa-chevron-down"></i>
          </button>

          {showUserMenu && (
            <div className="admin-header__user-menu">
              <div className="admin-header__user-menu-header">
                <img 
                  src={user?.avatar || '/images/placeholders/avatar-placeholder.svg'} 
                  alt={user?.fullName}
                />
                <div>
                  <div className="admin-header__user-menu-name">{user?.fullName}</div>
                  <div className="admin-header__user-menu-role">Administrator</div>
                </div>
              </div>
              
              <div className="admin-header__user-menu-items">
                
                <button 
                  className="admin-header__user-menu-item admin-header__user-menu-item--danger"
                  onClick={handleLogout}
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;