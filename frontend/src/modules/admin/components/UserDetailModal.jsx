import React from 'react';

const UserDetailModal = ({ user, canPromote, onPromote, onCancel }) => {
  const formatDateTime = (dateString) => {
    if (!dateString) {
      return 'Không có dữ liệu';
    }
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'Admin';
    if (role === 'moderator') return 'Moderator';
    return 'Người dùng';
  };

  const getKycLabel = (status) => {
    const labels = {
      not_submitted: 'Chưa gửi',
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Bị từ chối'
    };
    return labels[status] || status || 'Chưa gửi';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content user-detail-modal">
        <div className="modal-header">
          <h2>Chi tiết người dùng</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <div className="user-detail-header">
            <img
              src={user.avatar || '/images/placeholders/avatar-placeholder.svg'}
              alt={user.fullName}
              className="user-detail-avatar"
            />
            <div>
              <h3>{user.fullName || 'Không có tên'}</h3>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="review-details-grid user-detail-grid">
            <div className="detail-item">
              <label>Vai trò</label>
              <span>{getRoleLabel(user.role)}</span>
            </div>

            <div className="detail-item">
              <label>Trạng thái</label>
              <span>{user.isSuspended ? 'Bị khóa' : 'Hoạt động'}</span>
            </div>

            <div className="detail-item">
              <label>KYC</label>
              <span>{getKycLabel(user.kycStatus)}</span>
            </div>

            <div className="detail-item">
              <label>Xác thực email</label>
              <span>{user.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}</span>
            </div>

            <div className="detail-item">
              <label>Số điện thoại</label>
              <span>{user.phone || 'Chưa cập nhật'}</span>
            </div>

            <div className="detail-item">
              <label>Ngày tạo</label>
              <span>{formatDateTime(user.createdAt)}</span>
            </div>

            <div className="detail-item full-width">
              <label>Địa chỉ</label>
              <span>{user.address || 'Chưa cập nhật'}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Đóng
          </button>

          {canPromote ? (
            <button className="btn btn-primary" onClick={onPromote}>
              Nâng quyền lên Moderator
            </button>
          ) : (
            <button className="btn btn-secondary" disabled>
              {user.role === 'moderator' ? 'Tài khoản đã là Moderator' : 'Tài khoản Admin không thể nâng quyền'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
