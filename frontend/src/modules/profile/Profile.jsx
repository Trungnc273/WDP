import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { getProfile } from "../../services/user.service";
import { getImageUrl } from "../../utils/imageHelper";
import "./Profile.css";

function Profile() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      const profileResponse = await getProfile();

      setProfile(profileResponse.data);
      setError("");
    } catch (error) {
      setError("Không thể tải thông tin profile");
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
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
        <h1 className="profile-title">Thông tin tài khoản</h1>
        <div className="profile-actions">
          <Link to="/profile/edit" className="btn btn-uniqlo-primary">
            Chỉnh sửa
          </Link>
          <button onClick={handleLogout} className="btn btn-uniqlo-outline">
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
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
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
                <div
                  className="stat-item"
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span className="stat-label">Đánh giá:</span>
                  <span className="stat-value">
                    {profile?.rating > 0
                      ? `${profile.rating.toFixed(1)}/5`
                      : "Chưa có"}
                    {profile?.totalReviews > 0 && (
                      <span className="review-count">
                        {" "}
                        ({profile.totalReviews} đánh giá)
                      </span>
                    )}
                  </span>
                  {profile?._id && (
                    <Link
                      to={`/user/${profile._id}/reviews`}
                      className="btn btn-outline btn-sm"
                      style={{ marginLeft: "8px" }}
                    >
                      Xem chi tiết đánh giá
                    </Link>
                  )}
                </div>
                <div className="stat-item">
                  <span className="stat-label">Thành viên từ:</span>
                  <span className="stat-value">
                    {formatDate(profile?.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-info">
            <div className="info-row">
              <label>Số điện thoại:</label>
              <span>{profile?.phone || "Chưa cập nhật"}</span>
            </div>

            <div className="info-row">
              <label>Địa chỉ:</label>
              <span>{profile?.address || "Chưa cập nhật"}</span>
            </div>

            <div className="info-row">
              <label>Vai trò:</label>
              <span className="role-badge">{profile?.role}</span>
            </div>
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
