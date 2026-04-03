import React from 'react';

const UserStats = ({ stats }) => {
  const {
    totalUsers = 0,
    activeUsers = 0,
    suspendedUsers = 0,
    usersByRole = {}
  } = stats;

  return (
    <div className="user-stats">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{totalUsers}</div>
          <div className="stat-label">Tổng người dùng</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{activeUsers}</div>
          <div className="stat-label">Đang hoạt động</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{suspendedUsers}</div>
          <div className="stat-label">Hạn chế quyền bán</div>
        </div>
        
      </div>

      <div className="role-stats">
        <h3>Thống kê theo vai trò</h3>
        <div className="role-grid">
          <div className="role-item">
            <span>Admin: </span>
            <strong>{usersByRole.admin || 0}</strong>
          </div>
          <div className="role-item">
            <span>Moderator: </span>
            <strong>{usersByRole.moderator || 0}</strong>
          </div>
          <div className="role-item">
            <span>User: </span>
            <strong>{usersByRole.user || 0}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStats;