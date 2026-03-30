import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { adminUserApi } from '../../../services/adminApi';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await adminUserApi.getAdminDashboardStats();
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  const {
    userStats = {},
    moderationStats = {}
  } = dashboardStats;

  const {
    totalUsers = 0,
    activeUsers = 0,
    suspendedUsers = 0,
    usersByRole = {}
  } = userStats;

  const {
    pendingReports = 0,
    reviewingReports = 0,
    unresolvedReports = 0,
    pendingWithdrawals = 0,
    reportedReviews = 0,
    openOrders = 0,
    pendingDisputes = 0,
    recentReports = []
  } = moderationStats;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Chào mừng, {user?.fullName}</p>
      </div>

      {/* Quick Stats */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{totalUsers}</div>
            <div className="stat-label">Tổng người dùng</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-number">{unresolvedReports}</div>
            <div className="stat-label">Báo cáo chưa xử lý</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <div className="stat-number">{pendingWithdrawals}</div>
            <div className="stat-label">Rút tiền chờ duyệt</div>
          </div>
        </div>
      </div>

      {/* Detailed Stats Grid */}
      <div className="stats-grid">
        {/* User Management Stats */}
        <div className="stats-section">
          <h3>Quản lý người dùng</h3>
          <div className="stats-cards">
            <div className="mini-stat-card">
              <div className="mini-stat-icon">✅</div>
              <div className="mini-stat-content">
                <div className="mini-stat-number">{activeUsers}</div>
                <div className="mini-stat-label">Đang hoạt động</div>
              </div>
            </div>
            
            <div className="mini-stat-card">
              <div className="mini-stat-icon">🔒</div>
              <div className="mini-stat-content">
                <div className="mini-stat-number">{suspendedUsers}</div>
                <div className="mini-stat-label">Bị khóa</div>
              </div>
            </div>
            
            <div className="mini-stat-card">
              <div className="mini-stat-icon">🛡️</div>
              <div className="mini-stat-content">
                <div className="mini-stat-number">{usersByRole.user || 0}</div>
                <div className="mini-stat-label">Người dùng thường</div>
              </div>
            </div>
          </div>
        </div>

        {/* Moderation Stats */}
        <div className="stats-section">
          <h3>Kiểm duyệt nội dung</h3>
          <div className="stats-cards">
            <div className="mini-stat-card">
              <div className="mini-stat-icon">🚩</div>
              <div className="mini-stat-content">
                <div className="mini-stat-number">{pendingReports}</div>
                <div className="mini-stat-label">Báo cáo mới</div>
              </div>
            </div>
            
            <div className="mini-stat-card">
              <div className="mini-stat-icon">👁️</div>
              <div className="mini-stat-content">
                <div className="mini-stat-number">{reviewingReports}</div>
                <div className="mini-stat-label">Đang xem xét</div>
              </div>
            </div>
            
            <div className="mini-stat-card">
              <div className="mini-stat-icon">⭐</div>
              <div className="mini-stat-content">
                <div className="mini-stat-number">{reportedReviews}</div>
                <div className="mini-stat-label">Đánh giá bị báo cáo</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Distribution */}
      <div className="role-distribution">
        <h3>Phân bố vai trò</h3>
        <div className="role-stats">
          <div className="role-item">
            <span className="role-label">Admin:</span>
            <span className="role-count">{usersByRole.admin || 0}</span>
          </div>
          <div className="role-item">
            <span className="role-label">Moderator:</span>
            <span className="role-count">{usersByRole.moderator || 0}</span>
          </div>
          <div className="role-item">
            <span className="role-label">User:</span>
            <span className="role-count">{usersByRole.user || 0}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Thao tác nhanh</h3>
        <div className="action-grid">
          <Link to="/admin/users" className="action-card">
            <div className="action-icon">👤</div>
            <div className="action-content">
              <h4>Quản lý người dùng</h4>
              <p>Xem, tạo, sửa, xóa người dùng</p>
            </div>
          </Link>

          <div className="action-card disabled">
            <div className="action-icon">📊</div>
            <div className="action-content">
              <h4>Báo cáo thống kê</h4>
              <p>Xem báo cáo chi tiết hệ thống</p>
            </div>
          </div>

          <div className="action-card disabled">
            <div className="action-icon">⚙️</div>
            <div className="action-content">
              <h4>Cài đặt hệ thống</h4>
              <p>Cấu hình các tham số hệ thống</p>
            </div>
          </div>

          <div className="action-card disabled">
            <div className="action-icon">🔍</div>
            <div className="action-content">
              <h4>Kiểm duyệt nội dung</h4>
              <p>Duyệt sản phẩm, đánh giá</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>Hoạt động gần đây</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">👤</div>
            <div className="activity-content">
              <p>Người dùng đang hoạt động: {activeUsers}</p>
              <span className="activity-time">Cập nhật liên tục</span>
            </div>
          </div>
          
          <div className="activity-item">
            <div className="activity-icon">📈</div>
            <div className="activity-content">
              <p>Tổng số người dùng: {totalUsers}</p>
              <span className="activity-time">Thống kê hiện tại</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;