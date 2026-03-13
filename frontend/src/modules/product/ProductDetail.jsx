import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import productService from '../../services/product.service';
import chatService from '../../services/chat.service';
import favoriteService from '../../services/favorite.service';
import { getImageUrl, getUserAvatarUrl, handleImageError } from '../../utils/imageHelper';
import PurchaseRequest from '../order/PurchaseRequest';
import ReportProduct from '../report/ReportProduct';
import ReportUser from '../report/ReportUser';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPurchaseRequest, setShowPurchaseRequest] = useState(false);
  const [isQuickBuy, setIsQuickBuy] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showUserReportModal, setShowUserReportModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const getCurrentUserId = () => user?._id || user?.userId || null;
  const getSellerId = (productData) => productData?.seller?._id || productData?.sellerId?._id || productData?.sellerId || null;
  const hasPurchaseProfile = () => {
    const phone = String(user?.phone || '').trim();
    const address = String(user?.address || '').trim();
    return Boolean(phone && address);
  };

  const requirePurchaseProfile = () => {
    if (hasPurchaseProfile()) {
      return true;
    }

    alert('Vui lòng cập nhật số điện thoại và địa chỉ trong hồ sơ trước khi mua hàng');
    navigate('/profile');
    return false;
  };

  useEffect(() => {
    fetchProduct();
    if (user) {
      checkIfFavorited();
    }
  }, [id, user]);

  useEffect(() => {
    if (!product) return;
    const params = new URLSearchParams(location.search);
    if (params.get('openPurchase') !== '1') return;
    if (!user) return;

    const sellerId = getSellerId(product);
    const isOwnerProduct = !!(sellerId && getCurrentUserId() && sellerId.toString() === getCurrentUserId().toString());
    if (!isOwnerProduct && requirePurchaseProfile()) {
      setIsQuickBuy(true);
      setShowPurchaseRequest(true);
    }
  }, [location.search, product, user]);

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

  const handlePurchaseRequest = (quickBuy = false) => {
    if (!user) {
      alert('Vui lòng đăng nhập để mua hàng');
      navigate('/login');
      return;
    }
    
    if (isOwner) {
      alert('Bạn không thể mua sản phẩm của chính mình');
      return;
    }

    if (!requirePurchaseProfile()) {
      return;
    }
    
    setIsQuickBuy(quickBuy);
    setShowPurchaseRequest(true);
  };

  const handlePurchaseSuccess = () => {
    setShowPurchaseRequest(false);
    alert('Gửi yêu cầu mua hàng thành công! Người bán sẽ xem xét và phản hồi sớm.');
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

  const handleReportUser = () => {
    if (!user) {
      alert('Vui lòng đăng nhập để báo cáo người dùng');
      navigate('/login');
      return;
    }

    if (isOwner) {
      alert('Bạn không thể báo cáo chính mình');
      return;
    }

    setShowUserReportModal(true);
  };

  const handleUserReportSuccess = () => {
    setShowUserReportModal(false);
    alert('Báo cáo người dùng đã được gửi thành công!');
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
      const sellerId = getSellerId(product);
      if (!sellerId) {
        alert('Không xác định được người bán cho sản phẩm này. Vui lòng tải lại trang.');
        return;
      }

      const conversation = await chatService.createConversation(
        sellerId,
        product._id
      );
      navigate(`/chat/${conversation._id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      const backendMessage = error?.response?.data?.message || error?.message;

      // Fallback: neu tao conversation that bai, thu chuyen den conversation da ton tai cua san pham/nguoi ban nay.
      try {
        const sellerId = getSellerId(product)?.toString();
        const result = await chatService.getConversations(1, 50);
        const matched = (result?.conversations || []).find((conv) => {
          const convSellerId = (conv.seller?._id || conv.sellerId?._id || conv.sellerId || '').toString();
          const convProductId = (conv.product?._id || conv.productId?._id || conv.productId || '').toString();
          return convSellerId === sellerId && convProductId === product._id?.toString();
        });

        if (matched?._id) {
          navigate(`/chat/${matched._id}`);
          return;
        }
      } catch (fallbackError) {
        console.error('Error finding existing conversation:', fallbackError);
      }

      alert(backendMessage || 'Không thể tạo cuộc trò chuyện. Vui lòng thử lại.');
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

  const sellerId = getSellerId(product);
  const isOwner = !!(sellerId && getCurrentUserId() && sellerId.toString() === getCurrentUserId().toString());
  const sellerCreatedAt = product?.seller?.createdAt;
  const sellerJoinYear = sellerCreatedAt ? new Date(sellerCreatedAt).getFullYear() : null;

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
                src={getImageUrl(product.images?.[selectedImage]) || '/images/placeholder.png'} 
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
                    <img src={getImageUrl(image) || '/images/placeholder.png'} alt={`${product.title} ${index + 1}`} />
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
            <h2>Thông tin chi tiết</h2>
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
                  Chat với người bán
                </button>
                <button 
                  className="btn btn-buy"
                  onClick={() => handlePurchaseRequest(true)}
                >
                  <span className="btn-icon">🛒</span>
                  Mua ngay
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
                  <img
                    src={getUserAvatarUrl(product.seller)}
                    alt={product.seller.fullName}
                    onError={(event) => handleImageError(event, 'avatar')}
                  />
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
                    <span>
                      {sellerJoinYear && !Number.isNaN(sellerJoinYear)
                        ? `Thành viên từ ${sellerJoinYear}`
                        : 'Thành viên ReFlow'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Link to={`/user/${sellerId || ''}`} className="btn btn-view-profile">
              Xem trang cá nhân
            </Link>
            {!isOwner && (
              <button type="button" className="btn btn-report-user" onClick={handleReportUser}>
                Báo cáo người dùng
              </button>
            )}
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
          isQuickBuy={isQuickBuy}
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

      {showUserReportModal && product?.seller && (
        <ReportUser
          reportedUser={product.seller}
          onSuccess={handleUserReportSuccess}
          onCancel={() => setShowUserReportModal(false)}
        />
      )}
    </div>
  );
};

export default ProductDetail;
