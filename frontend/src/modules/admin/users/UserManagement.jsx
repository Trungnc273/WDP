import React, { useState, useEffect } from 'react';
import { adminUserApi } from '../../../services/adminApi';
import UserList from '../components/UserList';
import UserDetailModal from '../components/UserDetailModal';
import '../AdminModules.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [currentPage, search, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminUserApi.getAllUsers({
        page: currentPage,
        limit: 10,
        search,
        role: roleFilter,
        status: statusFilter
      });

      if (response.data && response.data.data) {
        setUsers(response.data.data.users || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
        setTotalUsers(response.data.data.pagination?.total || 0);
      } else {
        setUsers([]);
        setTotalPages(1);
        setTotalUsers(0);
      }
      setError('');
    } catch (err) {
      console.error('Load users error:', err);
      setError(err.response?.data?.message || err.message || 'Không thể tải danh sách người dùng');
      setUsers([]);
      setTotalPages(1);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToModerator = async (user) => {
    if (!user?._id || user.role !== 'user') {
      return;
    }

    if (!window.confirm(`Nâng quyền "${user.fullName}" lên Moderator?`)) {
      return;
    }

    try {
      await adminUserApi.updateUser(user._id, { role: 'moderator' });
      setSuccess(`Đã nâng quyền "${user.fullName}" lên Moderator`);

      if (selectedUser?._id === user._id) {
        setSelectedUser((prev) => (prev ? { ...prev, role: 'moderator' } : prev));
      }

      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể nâng quyền người dùng');
    }
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);

    try {
      const response = await adminUserApi.getUserById(user._id);
      if (response?.data?.data) {
        setSelectedUser(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể tải chi tiết người dùng');
    }
  };

  const handleSearch = (searchTerm) => {
    setSearch(searchTerm);
    setCurrentPage(1);
  };

  const handleFilterChange = (type, value) => {
    if (type === 'role') {
      setRoleFilter(value);
    } else if (type === 'status') {
      setStatusFilter(value);
    }
    setCurrentPage(1);
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="admin-module">
      <div className="admin-module__header">
        <div className="header-content">
          <div className="header-info">
            <h1>Quản lý người dùng</h1>
            <p>
              Xem chi tiết tài khoản và nâng quyền User lên Moderator. Tổng cộng: {(totalUsers || 0).toLocaleString('vi-VN')} tài khoản.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={clearMessages} className="alert-close">×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={clearMessages} className="alert-close">×</button>
        </div>
      )}

      <UserList
        users={users}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        search={search}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onPageChange={setCurrentPage}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onViewUser={handleViewUser}
        onPromoteUser={handlePromoteToModerator}
      />

      {showDetailModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          canPromote={selectedUser.role === 'user'}
          onPromote={() => handlePromoteToModerator(selectedUser)}
          onCancel={() => {
            setShowDetailModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;
