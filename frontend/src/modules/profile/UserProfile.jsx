import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import './UserProfile.css';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Tai thong tin nguoi dung
      const userResponse = await api.get(`/users/${userId}`);
      setUser(userResponse.data.data);
      
      // Tai danh sach san pham cua nguoi dung
      const productsResponse = await api.get(`/products?seller=${userId}`);
      setProducts(productsResponse.data.data?.products || []);
      
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
            {user.avatar ? (
              <img src={user.avatar} alt={user.fullName} />
            ) : (
              <div className="avatar-placeholder-large">
                {user.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="user-details">
            <h1 className="user-name">
              {user.fullName}
              {user.isVerified && (
                <span className="verified-badge" title="Đã xác thực">✓</span>
              )}
            </h1>
            <div className="user-meta">
              <span className="meta-item">
                👤 Thành viên từ {formatDate(user.createdAt)}
              </span>
              <span className="meta-item">
                📦 {products.length} sản phẩm đang bán
              </span>
            </div>
          </div>
        </div>

        {user.bio && (
          <div className="user-bio">
            <h3>Giới thiệu</h3>
            <p>{user.bio}</p>
          </div>
        )}
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
                    src={product.images[0] || '/images/placeholder.png'} 
                    alt={product.title}
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
    </div>
  );
};

export default UserProfile;
