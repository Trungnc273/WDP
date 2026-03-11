import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    {
      path: '/admin/dashboard',
      icon: 'fas fa-tachometer-alt',
      label: 'Tổng quan',
      description: 'Dashboard và thống kê'
    },
    {
      path: '/admin/users',
      icon: 'fas fa-users',
      label: 'Quản lý người dùng',
      description: 'CRUD người dùng hệ thống'
    }
  ];

  const isActive = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname === path;
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? 'admin-sidebar--open' : ''}`}>
      <div className="admin-sidebar__header">
        <div className="admin-sidebar__logo">
          <i className="fas fa-shield-alt"></i>
          <span>Admin Panel</span>
        </div>
        <button 
          className="admin-sidebar__close"
          onClick={onClose}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="admin-sidebar__user">
        <div className="admin-sidebar__avatar">
          <img 
            src={user?.avatar || '/images/placeholders/avatar-placeholder.svg'} 
            alt={user?.fullName}
          />
        </div>
        <div className="admin-sidebar__user-info">
          <div className="admin-sidebar__user-name">{user?.fullName}</div>
          <div className="admin-sidebar__user-role">Administrator</div>
        </div>
      </div>

      <nav className="admin-sidebar__nav">
        <ul className="admin-sidebar__menu">
          {menuItems.map((item) => (
            <li key={item.path} className="admin-sidebar__menu-item">
              {item.disabled ? (
                <div className="admin-sidebar__link admin-sidebar__link--disabled">
                  <div className="admin-sidebar__link-icon">
                    <i className={item.icon}></i>
                  </div>
                  <div className="admin-sidebar__link-content">
                    <div className="admin-sidebar__link-label">{item.label}</div>
                    <div className="admin-sidebar__link-desc">{item.description}</div>
                  </div>
                  <div className="admin-sidebar__link-badge">
                    <span>Soon</span>
                  </div>
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`admin-sidebar__link ${isActive(item.path) ? 'admin-sidebar__link--active' : ''}`}
                  onClick={onClose}
                >
                  <div className="admin-sidebar__link-icon">
                    <i className={item.icon}></i>
                  </div>
                  <div className="admin-sidebar__link-content">
                    <div className="admin-sidebar__link-label">{item.label}</div>
                    <div className="admin-sidebar__link-desc">{item.description}</div>
                  </div>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

    </aside>
  );
};

export default AdminSidebar;