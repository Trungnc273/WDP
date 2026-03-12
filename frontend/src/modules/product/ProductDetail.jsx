import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import productService from '../../services/product.service';
import chatService from '../../services/chat.service';
import favoriteService from '../../services/favorite.service';
import { createDirectOrder } from '../../services/order.service'; // Added
import PurchaseRequest from '../order/PurchaseRequest';
import ReportProduct from '../report/ReportProduct';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPurchaseRequest, setShowPurchaseRequest] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false); // Added

  useEffect(() => {
    fetchProduct();
    if (user) {
      checkIfFavorited();
    }
  }, [id, user]);

  const checkIfFavorited = async () => {
    try {
      const response = await favoriteService.checkFavorite(id);
      setIsFavorite(response.data.isFavorite);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để lưu tin');
      navigate('/login');
      return;
    }

    try {
      if (isFavorite) {
        await favoriteService.removeFavorite(id);
        setIsFavorite(false);
      } else {
        await favoriteService.addFavorite(id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert(error.message || 'Có lỗi xảy ra');
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productService.getProductById(id);
      setProduct(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await productService.deleteProduct(id);
      alert('Sản phẩm đã được xóa thành công');
      navigate('/my-products');
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa sản phẩm');
    }
    setShowDeleteModal(false);
  };

  const handlePurchaseRequest = () => {
    if (!user) {
      alert('Vui lòng đăng nhập để deal giá');
      navigate('/login');
      return;
    }
    
    if (isOwner) {
      alert('Bạn không thể mua sản phẩm của chính mình');
      return;
    }
    
    setShowPurchaseRequest(true);
  };

  const handlePurchaseSuccess = () => {
    setShowPurchaseRequest(false);
    alert('Gửi yêu cầu deal giá thành công! Người bán sẽ xem xét và phản hồi sớm.');
  };

  // MỚI THÊM: Xử lý Mua Ngay
  const handleBuyNow = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để mua hàng');
      navigate('/login');
      return;
    }
    
    if (isOwner) {
      alert('Bạn không thể mua sản phẩm của chính mình');
      return;
    }

    setBuyLoading(true);
    try {
      const response = await createDirectOrder(product._id);
      // Giả sử API trả về order object ở response.data hoặc chính là response
      const newOrder = response.data || response; 
      navigate(`/orders/${newOrder._id}/pay`);
    } catch (err) {
      alert(err.message || 'Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setBuyLoading(false);
    }
  };

  const handleReportProduct = () => {
    if (!user) {
      alert('Vui lòng đăng nhập để báo cáo sản phẩm');
      navigate('/login');
      return;
    }
    
    if (isOwner) {
      alert('Bạn không thể báo cáo sản phẩm của chính mình');
      return;
    }
    
    setShowReportModal(true);
  };

  const handleReportSuccess = () => {
    setShowReportModal(false);
    alert('Báo cáo đã được gửi thành công! Chúng tôi sẽ xem xét và xử lý trong thời gian sớm nhất.');
  };

  const handleStartChat = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để chat với người bán');
      navigate('/login');
      return;
    }
    
    if (isOwner) {
      alert('Bạn không thể chat với chính mình');
      return;
    }
    
    try {
      const conversation = await chatService.createConversation(
        product.seller._id, 
        product._id
      );
      navigate(`/chat/${conversation._id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      // If conversation already exists, try to navigate to chat anyway
      if (error.message && error.message.includes('đã tồn tại')) {
        navigate('/chat');
      } else {
        alert('Không thể tạo cuộc trò chuyện. Vui lòng thử lại.');
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffTime = Math.abs(now - postDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    
    return postDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffTime = Math.abs(now - postDate);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return formatDate(date);
  };

  const getConditionText = (condition) => {
    const conditions = {
      'new': 'Mới',
      'like-new': 'Như mới',
      'good': 'Tốt',
      'fair': 'Khá',
      'poor': 'Cũ'
    };
    return conditions[condition] || condition;
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/')} className="btn-back">
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const isOwner = user && product.seller && user._id === product.seller._id;

  return (
    <div className="product-detail-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span className="separator">›</span>
        <Link to="/products">Sản phẩm</Link>
        <span className="separator">›</span>
        <Link to={`/products?category=${product.category?.slug}`}>
          {product.category?.name}
        </Link>
        <span className="separator">›</span>
        <span className="current">{product.title}</span>
      </div>

      <div className="product-detail-layout">
        {/* Left Column - Images & Description */}
        <div className="product-left">
          {/* Image Gallery */}
          <div className="product-gallery">
            <div className="main-image">
              <img 
                src={product.images[selectedImage] || '/images/placeholder.png'} 
                alt={product.title}
              />
              <button 
                className="favorite-btn"
                onClick={handleToggleFavorite}
                title={isFavorite ? 'Bỏ lưu' : 'Lưu tin'}
              >
                {isFavorite ? '❤️' : '🤍'}
              </button>
            </div>
            {product.images.length > 1 && (
              <div className="image-thumbnails">
                {product.images.map((image, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={image} alt={`${product.title} ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Description */}
          <div className="product-description-card">
            <h2>Chi tiết sản phẩm</h2>
            <div className="description-content">
              {product.description.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>

          {/* Product Specifications */}
          <div className="product-specs-card">
            <h2>Thôngত্তি chi tiết</h2>
            <div className="specs-list">
              <div className="spec-item">
                <span className="spec-label">Danh mục</span>
                <span className="spec-value">{product.category?.icon} {product.category?.name}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Tình trạng</span>
                <span className="spec-value">{getConditionText(product.condition)}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Khu vực</span>
                <span className="spec-value">
                  {product.location?.ward && `${product.location.ward}, `}
                  {product.location?.district}, {product.location?.city}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Mã tin</span>
                <span className="spec-value">#{product._id?.slice(-8)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Price & Actions */}
        <div className="product-right">
          {/* Price Card */}
          <div className="price-card">
            <div className="product-price">{formatPrice(product.price)}</div>
            <h1 className="product-title">{product.title}</h1>
            
            <div className="product-meta-info">
              <span className="meta-location">
                📍 {product.location?.district}, {product.location?.city}
              </span>
              <span className="meta-time">
                🕐 {getTimeAgo(product.createdAt)}
              </span>
            </div>

            {/* Action Buttons */}
            {!isOwner && (
              <div className="action-buttons">
                <button 
                  className="btn btn-chat"
                  onClick={handleStartChat}
                >
                  <span className="btn-icon">💬</span>
                  Chat
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={handlePurchaseRequest}
                  style={{ flex: 1 }}
                >
                  Deal giá
                </button>
                <button 
                  className="btn btn-buy"
                  onClick={handleBuyNow}
                  disabled={buyLoading}
                >
                  <span className="btn-icon">🛒</span>
                  {buyLoading ? 'Đang xử lý...' : 'Mua ngay'}
                </button>
              </div>
            )}

            {isOwner && (
              <div className="owner-actions">
                <Link to={`/product/${id}/edit`} className="btn btn-edit">
                  ✏️ Chỉnh sửa tin
                </Link>
                <button 
                  onClick={() => setShowDeleteModal(true)} 
                  className="btn btn-delete"
                >
                  🗑️ Xóa tin
                </button>
              </div>
            )}
          </div>

          {/* Seller Card */}
          <div className="seller-card">
            <h3>Thông tin người bán</h3>
            <div className="seller-info">
              <div className="seller-avatar">
                {product.seller?.avatar ? (
                  <img src={product.seller.avatar} alt={product.seller.fullName} />
                ) : (
                  <div className="avatar-placeholder">
                    {product.seller?.fullName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="seller-details">
                <div className="seller-name">
                  {product.seller?.fullName}
                  {product.seller?.isVerified && (
                    <span className="verified-badge" title="Đã xác thực">✓</span>
                  )}
                </div>
                <div className="seller-stats">
                  <div className="stat-item">
                    <span className="stat-icon">👤</span>
                    <span>Thành viên từ {new Date(product.seller?.createdAt).getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>
            <Link to={`/user/${product.seller?._id}`} className="btn btn-view-profile">
              Xem trang cá nhân
            </Link>
          </div>

          {/* Safety Tips */}
          <div className="safety-tips-card">
            <h3>💡 Lưu ý an toàn</h3>
            <ul className="tips-list">
              <li>Không chuyển tiền trước khi nhận hàng</li>
              <li>Kiểm tra sản phẩm kỹ trước khi thanh toán</li>
              <li>Gặp mặt tại nơi công cộng, đông người</li>
              <li>Báo cáo tin đăng nếu phát hiện gian lận</li>
            </ul>
          </div>

          {/* Report Button */}
          {!isOwner && (
            <button 
              className="btn btn-report"
              onClick={handleReportProduct}
            >
              🚩 Báo cáo tin đăng này
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Xác nhận xóa</h3>
            <p>Bạn có chắc chắn muốn xóa sản phẩm này?</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">
                Hủy
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Request Modal */}
      {showPurchaseRequest && (
        <PurchaseRequest
          product={product}
          onClose={() => setShowPurchaseRequest(false)}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {/* Report Product Modal */}
      {showReportModal && (
        <ReportProduct
          product={product}
          onSuccess={handleReportSuccess}
          onCancel={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};

export default ProductDetail;