import React, { useState } from 'react';
import UserFilters from './UserFilters';
import SuspendModal from './SuspendModal';

const UserList = ({
  users,
  loading,
  currentPage,
  totalPages,
  search,
  roleFilter,
  statusFilter,
  onPageChange,
  onSearch,
  onFilterChange,
  onEditUser,
  onDeleteUser,
  onSuspendUser,
  onUnsuspendUser
}) => {
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const handleSuspendClick = (userId) => {
    setSelectedUserId(userId);
    setShowSuspendModal(true);
  };

  const handleSuspendSubmit = (suspendData) => {
    onSuspendUser(selectedUserId, suspendData);
    setShowSuspendModal(false);
    setSelectedUserId(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      admin: 'Admin',
      moderator: 'Moderator',
      user: 'Người dùng'
    };
    return roleLabels[role] || role;
  };

  const getStatusLabel = (user) => {
    if (user.isSuspended) {
      return <span className="status suspended">Bị khóa</span>;
    }
    return <span className="status active">Hoạt động</span>;
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="user-list">
      {/* Filters */}
      <UserFilters
        search={search}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onSearch={onSearch}
        onFilterChange={onFilterChange}
      />

      {/* Users Table */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info">
                      <img 
                        src={user.avatar || '/images/placeholders/avatar-placeholder.svg'} 
                        alt={user.fullName}
                        className="user-avatar"
                      />
                      <span>{user.fullName}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role ${user.role}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>{getStatusLabel(user)}</td>
                  <td>
                    {formatDate(user.createdAt)}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => onEditUser(user)}
                      >
                        Sửa
                      </button>
                      
                      {user.isSuspended ? (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => onUnsuspendUser(user._id)}
                        >
                          Mở khóa
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleSuspendClick(user._id)}
                          disabled={user.role === 'admin'}
                        >
                          Khóa
                        </button>
                      )}
                      
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => onDeleteUser(user._id)}
                        disabled={user.role === 'admin'}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Trước
          </button>
          
          <span className="page-info">
            Trang {currentPage} / {totalPages}
          </span>
          
          <button
            className="btn btn-sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Sau
          </button>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <SuspendModal
          onSubmit={handleSuspendSubmit}
          onCancel={() => {
            setShowSuspendModal(false);
            setSelectedUserId(null);
          }}
        />
      )}
    </div>
  );
};

export default UserList;