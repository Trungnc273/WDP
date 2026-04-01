import React, { useEffect, useState } from 'react';

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
  onViewUser,
  onPromoteUser,
  onSuspendUser,
  onUnsuspendUser
}) => {
  const [searchInput, setSearchInput] = useState(search || '');

  useEffect(() => {
    setSearchInput(search || '');
  }, [search]);

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

  const getKYCStatusLabel = (status) => {
    const statusLabels = {
      not_submitted: 'Chưa gửi',
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Bị từ chối'
    };
    return statusLabels[status] || status;
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchInput.trim());
  };

  const handleResetFilters = () => {
    setSearchInput('');
    onSearch('');
    onFilterChange('role', '');
    onFilterChange('status', '');
  };

  return (
    <>
      <div className="admin-module__filters">
        <div className="filter-group">
          <form onSubmit={handleSearchSubmit} style={{ display: 'contents' }}>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="filter-input"
            />
          </form>

          <select
            value={roleFilter}
            onChange={(e) => onFilterChange('role', e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả vai trò</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="user">Người dùng</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="suspended">Bị khóa</option>
          </select>

          <div className="filter-actions">
            <button type="button" className="btn btn-primary" onClick={() => onSearch(searchInput.trim())}>
              <i className="fas fa-search"></i>
              Lọc
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleResetFilters}>
              <i className="fas fa-redo"></i>
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      <div className="admin-module__content">
        {loading ? (
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i>
            Đang tải...
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="admin-table user-admin-table">
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th className="role-col">Vai trò</th>
                    <th className="status-col">Trạng thái</th>
                    <th className="kyc-col">KYC</th>
                    <th>Ngày tạo</th>
                    <th className="action-col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
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
                        <td className="role-col">
                          <span className={`role ${user.role}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="status-col">{getStatusLabel(user)}</td>
                        <td className="kyc-col">
                          <span className={`kyc-status ${user.kycStatus}`}>
                            {getKYCStatusLabel(user.kycStatus)}
                          </span>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td className="action-col">
                          <div className="action-buttons user-action-buttons">
                            <button className="btn btn-sm btn-secondary" onClick={() => onViewUser(user)}>
                              Chi tiết
                            </button>

                            {user.role === 'user' ? (
                              <button className="btn btn-sm btn-primary" onClick={() => onPromoteUser(user)}>
                                Nâng lên Mod
                              </button>
                            ) : user.role === 'moderator' ? (
                              <button className="btn btn-sm btn-secondary" disabled>
                                Đã là Mod
                              </button>
                            ) : (
                              <button className="btn btn-sm btn-secondary" disabled>
                                Admin
                              </button>
                            )}

                            {user.role !== 'admin' && (
                              user.isSuspended ? (
                                <button className="btn btn-sm btn-secondary" onClick={() => onUnsuspendUser(user)}>
                                  Mở khóa
                                </button>
                              ) : (
                                <button className="btn btn-sm btn-danger" onClick={() => onSuspendUser(user)}>
                                  Khóa
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

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
          </>
        )}
      </div>
    </>
  );
};

export default UserList;
