import React, { useState, useEffect } from 'react';
import { adminUserApi } from '../../../services/adminApi';
import UserList from '../components/UserList';
import UserForm from '../components/UserForm';
import UserStats from '../components/UserStats';
import '../AdminModules.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Load users and stats on component mount
  useEffect(() => {
    loadUsers();
    loadStats();
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

  const loadStats = async () => {
    try {
      const response = await adminUserApi.getSystemStats();
      
      if (response.data && response.data.data) {
        setStats(response.data.data);
      } else {
        setStats({});
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      setStats({});
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      await adminUserApi.createUser(userData);
      setSuccess('Tạo người dùng thành công');
      setShowCreateModal(false);
      loadUsers();
      loadStats();
    } catch (err) {
      setError(err.message || 'Không thể tạo người dùng');
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      await adminUserApi.updateUser(selectedUser._id, userData);
      setSuccess('Cập nhật người dùng thành công');
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
      loadStats();
    } catch (err) {
      setError(err.message || 'Không thể cập nhật người dùng');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return;
    }

    try {
      await adminUserApi.deleteUser(userId);
      setSuccess('Xóa người dùng thành công');
      loadUsers();
      loadStats();
    } catch (err) {
      setError(err.message || 'Không thể xóa người dùng');
    }
  };

  const handleSuspendUser = async (userId, suspendData) => {
    try {
      await adminUserApi.suspendUser(userId, suspendData);
      setSuccess('Khóa người dùng thành công');
      loadUsers();
      loadStats();
    } catch (err) {
      setError(err.message || 'Không thể khóa người dùng');
    }
  };

  const handleUnsuspendUser = async (userId) => {
    try {
      await adminUserApi.unsuspendUser(userId);
      setSuccess('Mở khóa người dùng thành công');
      loadUsers();
      loadStats();
    } catch (err) {
      setError(err.message || 'Không thể mở khóa người dùng');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
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
            <p className="total-users">
              Tổng cộng: <strong>{(totalUsers || 0).toLocaleString('vi-VN')}</strong> người dùng
            </p>
          </div>
          <button 
            className="btn btn-primary btn-sm btn-create-small"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="fas fa-plus"></i>
            Tạo
          </button>
        </div>
      </div>

      {/* System Statistics */}
      <UserStats stats={stats} />

      {/* Messages */}
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

      {/* User List */}
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
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onSuspendUser={handleSuspendUser}
        onUnsuspendUser={handleUnsuspendUser}
      />

      {/* Create User Modal */}
      {showCreateModal && (
        <UserForm
          title="Tạo người dùng mới"
          onSubmit={handleCreateUser}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <UserForm
          title="Chỉnh sửa người dùng"
          user={selectedUser}
          onSubmit={handleUpdateUser}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;