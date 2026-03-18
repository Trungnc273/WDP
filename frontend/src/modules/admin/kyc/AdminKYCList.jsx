import React, { useState, useEffect } from 'react';
import { 
  getModeratorPendingKYC, 
  approveModeratorKYC, 
  rejectModeratorKYC 
} from '../../../services/moderator.service';
import '../AdminModules.css';

const AdminKYCList = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ keyword: '' });
  const [message, setMessage] = useState('');
  const [viewTarget, setViewTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getModeratorPendingKYC();
      setUsers(data);
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Không tải được danh sách KYC');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId) => {
    try {
      await approveModeratorKYC(userId);
      setMessage('Đã xác nhận KYC thành công');
      setViewTarget(null);
      fetchUsers();
    } catch (error) {
      setMessage(error.message || 'Không thể duyệt KYC');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    if (rejectReason.length < 10) {
      setMessage('Lý do từ chối phải ít nhất 10 ký tự');
      return;
    }
    setSubmitting(true);
    try {
      await rejectModeratorKYC(rejectTarget, rejectReason);
      setMessage('Đã từ chối KYC thành công');
      setRejectTarget(null);
      setRejectReason('');
      setViewTarget(null);
      fetchUsers();
    } catch (error) {
      setMessage(error.message || 'Không thể từ chối KYC');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = filters.keyword
    ? users.filter((u) => {
        const name = (u.fullName || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        const kw = filters.keyword.toLowerCase();
        return name.includes(kw) || email.includes(kw) || phone.includes(kw);
      })
    : users;

  return (
    <div className="admin-module">
      <div className="admin-module__header">
        <h1>Thẩm định KYC</h1>
        <p>Phê duyệt danh tính người dùng hệ thống</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('thành công') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div className="admin-module__filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Tên, email, SĐT..."
            value={filters.keyword}
            onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            className="filter-input"
          />
          
          <div className="filter-actions">
            <button 
              className="btn btn-primary"
              onClick={() => fetchUsers()}
            >
              <i className="fas fa-search"></i>
              Lọc
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => { setFilters({ keyword: '' }); fetchUsers(); }}
            >
              <i className="fas fa-redo"></i>
              Reset
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
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Thông tin khách hàng</th>
                  <th>Ảnh CCCD</th>
                  <th>Ngày gửi</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-data">
                      Không có hồ sơ KYC nào chờ duyệt
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div>
                          <strong style={{ fontSize: '15px', display: 'block' }}>
                            {user.fullName || 'N/A'}
                          </strong>
                          <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                            {user.email}
                          </div>
                          <div style={{ marginTop: '4px' }}>
                            <span className="status status-blue" style={{ fontSize: '11px' }}>
                              <i className="fas fa-id-card"></i>
                              {user.phone || 'No Phone'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {user.kycDocuments?.idCardFront ? (
                            <div style={{ textAlign: 'center' }}>
                              <img
                                src={user.kycDocuments.idCardFront}
                                alt="Mặt trước"
                                style={{
                                  width: '120px',
                                  height: '80px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  border: '1px solid #f0f0f0'
                                }}
                                onError={(e) => {
                                  e.target.src = '/images/placeholder.png';
                                }}
                              />
                              <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                                Mặt trước
                              </div>
                            </div>
                          ) : (
                            <span className="status status-red">Thiếu ảnh trước</span>
                          )}

                          {user.kycDocuments?.idCardBack ? (
                            <div style={{ textAlign: 'center' }}>
                              <img
                                src={user.kycDocuments.idCardBack}
                                alt="Mặt sau"
                                style={{
                                  width: '120px',
                                  height: '80px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  border: '1px solid #f0f0f0'
                                }}
                                onError={(e) => {
                                  e.target.src = '/images/placeholder.png';
                                }}
                              />
                              <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                                Mặt sau
                              </div>
                            </div>
                          ) : (
                            <span className="status status-red">Thiếu ảnh sau</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px' }}>
                          {user.kycSubmittedAt
                            ? new Date(user.kycSubmittedAt).toLocaleString('vi-VN', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })
                            : 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setViewTarget(user)}
                          >
                            <i className="fas fa-eye"></i>
                            Chi tiết
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleApprove(user._id)}
                            style={{ background: '#52c41a' }}
                          >
                            <i className="fas fa-check"></i>
                            Duyệt
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setRejectTarget(user._id)}
                          >
                            <i className="fas fa-times"></i>
                            Loại
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Detail Modal */}
      {viewTarget && (
        <div className="modal-overlay" onClick={() => setViewTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thẩm định hồ sơ khách hàng</h3>
              <button className="modal-close" onClick={() => setViewTarget(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '16px' }}>Thông tin cá nhân</h4>
                <div className="review-details-grid">
                  <div className="detail-item">
                    <label>Họ và tên</label>
                    <span><strong>{viewTarget.fullName}</strong></span>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <span>{viewTarget.email}</span>
                  </div>
                  <div className="detail-item">
                    <label>Số điện thoại</label>
                    <span>{viewTarget.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Ngày sinh</label>
                    <span>
                      {viewTarget.dateOfBirth
                        ? new Date(viewTarget.dateOfBirth).toLocaleDateString('vi-VN')
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Giới tính</label>
                    <span>{viewTarget.gender || 'N/A'}</span>
                  </div>
                  <div className="detail-item full-width">
                    <label>Địa chỉ</label>
                    <span>{viewTarget.address || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: '16px' }}>Chứng thực hình ảnh</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#666', marginBottom: '8px', fontSize: '14px' }}>
                      Mặt trước
                    </div>
                    <img
                      src={viewTarget.kycDocuments?.idCardFront}
                      alt="Mặt trước"
                      style={{
                        width: '100%',
                        maxWidth: '200px',
                        height: 'auto',
                        borderRadius: '8px',
                        border: '1px solid #ddd'
                      }}
                      onError={(e) => {
                        e.target.src = '/images/placeholder.png';
                      }}
                    />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#666', marginBottom: '8px', fontSize: '14px' }}>
                      Mặt sau
                    </div>
                    <img
                      src={viewTarget.kycDocuments?.idCardBack}
                      alt="Mặt sau"
                      style={{
                        width: '100%',
                        maxWidth: '200px',
                        height: 'auto',
                        borderRadius: '8px',
                        border: '1px solid #ddd'
                      }}
                      onError={(e) => {
                        e.target.src = '/images/placeholder.png';
                      }}
                    />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#666', marginBottom: '8px', fontSize: '14px' }}>
                      Ảnh Selfie
                    </div>
                    <img
                      src={viewTarget.kycDocuments?.selfie}
                      alt="Selfie"
                      style={{
                        width: '100%',
                        maxWidth: '200px',
                        height: 'auto',
                        borderRadius: '8px',
                        border: '1px solid #ddd'
                      }}
                      onError={(e) => {
                        e.target.src = '/images/placeholder.png';
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewTarget(null)}>
                Đóng
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setRejectTarget(viewTarget._id);
                  setViewTarget(null);
                }}
              >
                <i className="fas fa-times"></i>
                Từ chối
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleApprove(viewTarget._id)}
                style={{ background: '#52c41a' }}
              >
                <i className="fas fa-check"></i>
                Duyệt ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="modal-overlay" onClick={() => !submitting && setRejectTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Lý do từ chối hồ sơ</h3>
              <button 
                className="modal-close" 
                onClick={() => !submitting && setRejectTarget(null)}
                disabled={submitting}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
                <strong>Lưu ý:</strong> Người dùng sẽ nhận được email thông báo kèm lý do này.
              </div>
              <div className="form-group">
                <label>Nhập lý do từ chối hồ sơ KYC</label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Ảnh mặt sau mờ, thông báo người dùng chụp lại..."
                  className="form-control"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setRejectTarget(null)}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                className="btn btn-danger"
                onClick={handleRejectConfirm}
                disabled={submitting || rejectReason.trim().length < 10}
              >
                {submitting ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-times"></i>
                )}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKYCList;