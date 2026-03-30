import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPublicProfile, getUserStats } from '../../services/user.service';
import productService from '../../services/product.service';
import { getImageUrl, getUserAvatarUrl, handleImageError } from '../../utils/imageHelper';
import { useAuth } from '../../hooks/useAuth';
import ReportUser from '../report/ReportUser';
import './UserProfile.css';

const PRODUCT_PLACEHOLDER = '/images/placeholders/product-placeholder.svg';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      const [profileResponse, statsResponse, productsResponse] = await Promise.all([
        getPublicProfile(userId),
        getUserStats(userId),
        productService.getProducts({ seller: userId, limit: 12 })
      ]);

      setUser(profileResponse.data);
      setStats(statsResponse.data);
      setProducts(productsResponse.products || []);
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleOpenReport = () => {
    const currentUserId = String(currentUser?._id || currentUser?.id || currentUser?.userId || '');
    if (!currentUserId) {
      alert('Vui lòng đăng nhập để báo cáo người dùng');
      navigate('/login');
      return;
    }

    if (currentUserId === String(userId)) {
      alert('Bạn không thể báo cáo chính mình');
      return;
    }

    setShowReportModal(true);
  };

  const handleReportSuccess = () => {
    setShowReportModal(false);
    alert('Báo cáo người dùng đã được gửi thành công. Chúng tôi sẽ kiểm tra sớm nhất.');
  };

  if (loading) {
    return (
      <div className="user-profile-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate(-1)} className="btn-back">
          Quay lại
        </button>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="user-profile-container">
      {/* User Info Card */}
      <div className="user-info-card">
        <div className="user-header">
          <div className="user-avatar-large">
            <img
              src={getUserAvatarUrl(user)}
              alt={user.fullName}
              onError={(event) => handleImageError(event, 'avatar')}
            />
          </div>
          <div className="user-details">
            <h1 className="user-name">
              {user.fullName}
            </h1>
            <div className="user-meta">
              <span className="meta-item">
                👤 Thành viên từ {formatDate(user.createdAt)}
              </span>
              <span className="meta-item">
                📦 {products.length} sản phẩm đang bán
              </span>
              <span className="meta-item">
                ⭐ {Number(stats?.rating || user.rating || 0).toFixed(1)}/5 · {Number(stats?.totalReviews || user.totalReviews || 0)} đánh giá
              </span>
            </div>
          </div>
        </div>

        <div className="user-profile-actions">
          <Link to={`/user/${userId}/reviews`} className="user-profile-link-btn">
            Xem đánh giá người bán
          </Link>
          {String(currentUser?._id || currentUser?.id || currentUser?.userId || '') !== String(userId) && (
            <button type="button" className="user-profile-link-btn user-profile-link-btn--danger" onClick={handleOpenReport}>
              Báo cáo người dùng
            </button>
          )}
        </div>

        <div className="user-bio">
          <h3>Tổng quan</h3>
          <p>
            Người bán đang hoạt động trên ReFlow. Hãy xem thêm đánh giá và tin đăng trước khi giao dịch.
          </p>
        </div>
      </div>

      {/* User's Products */}
      <div className="user-products-section">
        <h2>Sản phẩm đang bán ({products.length})</h2>
        
        {products.length === 0 ? (
          <div className="no-products">
            <p>Người dùng chưa có sản phẩm nào</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <Link 
                key={product._id} 
                to={`/product/${product._id}`}
                className="product-card"
              >
                <div className="product-image">
                  <img 
                    src={getImageUrl(product.images?.[0]) || PRODUCT_PLACEHOLDER}
                    alt={product.title}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = PRODUCT_PLACEHOLDER;
                    }}
                  />
                </div>
                <div className="product-info">
                  <h3 className="product-title">{product.title}</h3>
                  <div className="product-price">{formatPrice(product.price)}</div>
                  <div className="product-location">
                    📍 {product.location?.district}, {product.location?.city}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showReportModal && user && (
        <ReportUser
          reportedUser={{ ...user, rating: stats?.rating || user.rating }}
          onSuccess={handleReportSuccess}
          onCancel={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};

export default UserProfile;
