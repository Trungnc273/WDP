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
    },
    {
      path: '/admin/reports',
      icon: 'fas fa-flag',
      label: 'Quản lý báo cáo',
      description: 'Xử lý báo cáo từ người dùng'
    },
    {
      path: '/admin/orders',
      icon: 'fas fa-shopping-cart',
      label: 'Quản lý đơn hàng',
      description: 'Theo dõi và xử lý đơn hàng'
    },
    {
      path: '/admin/reviews',
      icon: 'fas fa-star',
      label: 'Đánh giá & Nhận xét',
      description: 'Quản lý đánh giá người dùng'
    },
    {
      path: '/admin/products',
      icon: 'fas fa-box',
      label: 'Duyệt sản phẩm',
      description: 'Phê duyệt sản phẩm mới'
    },
    {
      path: '/admin/withdrawals',
      icon: 'fas fa-money-bill-wave',
      label: 'Duyệt rút tiền',
      description: 'Xử lý yêu cầu rút tiền'
    },
    {
      path: '/admin/disputes',
      icon: 'fas fa-gavel',
      label: 'Giải quyết tranh chấp',
      description: 'Xử lý tranh chấp đơn hàng'
    },
    {
      path: '/admin/kyc',
      icon: 'fas fa-id-card',
      label: 'Thẩm định KYC',
      description: 'Xác minh danh tính người dùng'
    }
  ];

  const isActive = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    if (location.pathname.startsWith("/admin/reports")) return path === "/admin/reports";
    if (location.pathname.startsWith("/admin/orders")) return path === "/admin/orders";
    if (location.pathname.startsWith("/admin/reviews")) return path === "/admin/reviews";
    if (location.pathname.startsWith("/admin/products")) return path === "/admin/products";
    if (location.pathname.startsWith("/admin/withdrawals")) return path === "/admin/withdrawals";
    if (location.pathname.startsWith("/admin/disputes")) return path === "/admin/disputes";
    if (location.pathname.startsWith("/admin/kyc")) return path === "/admin/kyc";
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