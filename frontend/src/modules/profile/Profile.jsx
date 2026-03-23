import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { getProfile, getKYCStatus } from '../../services/user.service';
import { getImageUrl } from '../../utils/imageHelper';
import './Profile.css';

function Profile() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Tai profile va trang thai KYC song song
      const [profileResponse, kycResponse] = await Promise.all([
        getProfile(),
        getKYCStatus()
      ]);
      
      setProfile(profileResponse.data);
      setKycStatus(kycResponse.data);
      setError('');
    } catch (error) {
      setError('Không thể tải thông tin profile');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getKYCStatusText = (status) => {
    const statusMap = {
      'not_submitted': 'Chưa gửi',
      'pending': 'Đang xử lý',
      'approved': 'Đã duyệt',
      'rejected': 'Bị từ chối'
    };
    return statusMap[status] || status;
  };

  const getKYCStatusClass = (status) => {
    const classMap = {
      'not_submitted': 'kyc-not-submitted',
      'pending': 'kyc-pending',
      'approved': 'kyc-approved',
      'rejected': 'kyc-rejected'
    };
    return classMap[status] || '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="profile-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="error-message">Vui lòng đăng nhập để xem profile</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchProfileData} className="btn btn-primary">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Thông tin tài khoản</h1>
        <div className="profile-actions">
          <Link to="/profile/edit" className="btn btn-primary">
            Chỉnh sửa thông tin
          </Link>
          <button onClick={handleLogout} className="btn btn-outline">
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="profile-content">
        {/* Basic Information */}
        <div className="profile-card">
          <h2>Thông tin cơ bản</h2>
          
          <div className="profile-avatar-section">
            <div className="avatar-container">
              {profile?.avatar ? (
                <img 
                  src={getImageUrl(profile.avatar)} 
                  alt={profile.fullName} 
                  className="profile-avatar"
                  onError={(e) => { e.currentTarget.style.display='none'; }}
                />
              ) : (
                <div className="avatar-placeholder">
                  {profile?.fullName?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="avatar-info">
              <h3>{profile?.fullName}</h3>
              <p className="user-email">{profile?.email}</p>
              <div className="user-stats">
                <div className="stat-item" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span className="stat-label">Đánh giá:</span>
                  <span className="stat-value">
                    {profile?.rating > 0 ? `${profile.rating.toFixed(1)}/5` : 'Chưa có'}
                    {profile?.totalReviews > 0 && (
                      <span className="review-count"> ({profile.totalReviews} đánh giá)</span>
                    )}
                  </span>
                  {profile?._id && (
                    <Link to={`/user/${profile._id}/reviews`} className="btn btn-outline btn-sm" style={{marginLeft: '8px'}}>
                      Xem chi tiết đánh giá
                    </Link>
                  )}
                </div>
                <div className="stat-item">
                  <span className="stat-label">Thành viên từ:</span>
                  <span className="stat-value">{formatDate(profile?.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-info">
            <div className="info-row">
              <label>Số điện thoại:</label>
              <span>{profile?.phone || 'Chưa cập nhật'}</span>
            </div>

            <div className="info-row">
              <label>Địa chỉ:</label>
              <span>{profile?.address || 'Chưa cập nhật'}</span>
            </div>

            <div className="info-row">
              <label>Vai trò:</label>
              <span className="role-badge">{profile?.role}</span>
            </div>

            <div className="info-row">
              <label>Trạng thái tài khoản:</label>
              <span className={profile?.isVerified ? 'verified' : 'not-verified'}>
                {profile?.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
              </span>
            </div>
          </div>
        </div>

        {/* KYC Information */}
        <div className="profile-card">
          <h2>Xác thực danh tính (KYC)</h2>
          
          <div className="kyc-info">
            <div className="kyc-status-row">
              <label>Trạng thái KYC:</label>
              <span className={`kyc-status ${getKYCStatusClass(kycStatus?.status)}`}>
                {getKYCStatusText(kycStatus?.status)}
              </span>
            </div>

            {kycStatus?.submittedAt && (
              <div className="info-row">
                <label>Ngày gửi:</label>
                <span>{formatDate(kycStatus.submittedAt)}</span>
              </div>
            )}

            {kycStatus?.approvedAt && (
              <div className="info-row">
                <label>Ngày duyệt:</label>
                <span>{formatDate(kycStatus.approvedAt)}</span>
              </div>
            )}

            {kycStatus?.rejectedAt && (
              <div className="info-row">
                <label>Ngày từ chối:</label>
                <span>{formatDate(kycStatus.rejectedAt)}</span>
              </div>
            )}

            {kycStatus?.rejectionReason && (
              <div className="info-row">
                <label>Lý do từ chối:</label>
                <span className="rejection-reason">{kycStatus.rejectionReason}</span>
              </div>
            )}
          </div>

          <div className="kyc-actions">
            {kycStatus?.status === 'not_submitted' && (
              <Link to="/profile/kyc" className="btn btn-primary">
                Gửi yêu cầu xác thực
              </Link>
            )}
            
            {kycStatus?.status === 'pending' && (
              <div className="kyc-pending-message">
                <i className="fas fa-clock"></i>
                Yêu cầu xác thực đang được xử lý. Vui lòng chờ 1-3 ngày làm việc.
              </div>
            )}
            
            {kycStatus?.status === 'rejected' && (
              <Link to="/profile/kyc" className="btn btn-warning">
                Gửi lại yêu cầu xác thực
              </Link>
            )}
            
            {kycStatus?.status === 'approved' && (
              <div className="kyc-approved-message">
                <i className="fas fa-check-circle"></i>
                Tài khoản đã được xác thực thành công
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="profile-card">
          <h2>Thao tác nhanh</h2>
          
          <div className="quick-actions">
            <Link to="/my-products" className="action-item">
              <i className="fas fa-box"></i>
              <span>Quản lý sản phẩm</span>
            </Link>
            
            <Link to="/orders" className="action-item">
              <i className="fas fa-shopping-cart"></i>
              <span>Đơn hàng của tôi</span>
            </Link>
            
            <Link to="/wallet" className="action-item">
              <i className="fas fa-wallet"></i>
              <span>Ví của tôi</span>
            </Link>
            
            <Link to="/orders" className="action-item">
              <i className="fas fa-handshake"></i>
              <span>Yêu cầu mua hàng</span>
            </Link>
            
            <Link to="/chat" className="action-item">
              <i className="fas fa-comments"></i>
              <span>Tin nhắn</span>
            </Link>
            
            <Link to="/profile/change-password" className="action-item">
              <i className="fas fa-key"></i>
              <span>Đổi mật khẩu</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
