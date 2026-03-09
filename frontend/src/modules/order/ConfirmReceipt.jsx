import React, { useState } from 'react';
import { confirmReceipt } from '../../services/order.service';
import './ConfirmReceipt.css';

const ConfirmReceipt = ({ order, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    rating: 5,
    review: '',
    satisfied: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'radio' ? value === 'true' : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = 'Vui lòng chọn đánh giá từ 1 đến 5 sao';
    }

    if (formData.review && formData.review.length > 500) {
      newErrors.review = 'Nhận xét không được quá 500 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const confirmAction = window.confirm(
      'Bạn có chắc chắn đã nhận được hàng và muốn xác nhận? Sau khi xác nhận, tiền sẽ được chuyển cho người bán và không thể hoàn tác.'
    );
    
    if (!confirmAction) return;

    setLoading(true);
    
    try {
      // Only send the order ID for confirmation
      await confirmReceipt(order._id);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error confirming receipt:', error);
      setErrors({
        submit: error.message || 'Có lỗi xảy ra khi xác nhận nhận hàng'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        className={`star-button ${star <= formData.rating ? 'active' : ''}`}
        onClick={() => handleRatingChange(star)}
      >
        <i className="fas fa-star"></i>
      </button>
    ));
  };

  const getRatingText = (rating) => {
    const ratingTexts = {
      1: 'Rất không hài lòng',
      2: 'Không hài lòng',
      3: 'Bình thường',
      4: 'Hài lòng',
      5: 'Rất hài lòng'
    };
    return ratingTexts[rating] || '';
  };

  return (
    <div className="confirm-receipt-modal">
      <div className="confirm-receipt-overlay" onClick={onClose}></div>
      <div className="confirm-receipt-content">
        <div className="confirm-receipt-header">
          <h3>Xác nhận nhận hàng</h3>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="order-summary">
          <div className="order-info">
            <h4>Thông tin đơn hàng</h4>
            <div className="order-details">
              <div className="detail-item">
                <span className="label">Mã đơn hàng:</span>
                <span className="value">#{order._id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="detail-item">
                <span className="label">Sản phẩm:</span>
                <span className="value">{order.listing?.title}</span>
              </div>
              <div className="detail-item">
                <span className="label">Người bán:</span>
                <span className="value">{order.seller?.fullName}</span>
              </div>
              <div className="detail-item">
                <span className="label">Ngày giao hàng:</span>
                <span className="value">
                  {order.shippedAt ? formatDate(order.shippedAt) : 'Chưa xác định'}
                </span>
              </div>
            </div>
          </div>

          {order.shipping && (
            <div className="shipping-info">
              <h4>Thông tin vận chuyển</h4>
              <div className="shipping-details">
                <div className="detail-item">
                  <span className="label">Đơn vị vận chuyển:</span>
                  <span className="value">{order.shipping.provider}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Mã vận đơn:</span>
                  <span className="value">{order.shipping.trackingNumber}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="confirm-receipt-form">
          <div className="form-group">
            <label>
              Bạn có hài lòng với sản phẩm? <span className="required">*</span>
            </label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="satisfied"
                  value="true"
                  checked={formData.satisfied === true}
                  onChange={handleInputChange}
                />
                <span className="radio-label">Có, tôi hài lòng</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="satisfied"
                  value="false"
                  checked={formData.satisfied === false}
                  onChange={handleInputChange}
                />
                <span className="radio-label">Không, tôi không hài lòng</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>
              Đánh giá người bán <span className="required">*</span>
            </label>
            <div className="rating-section">
              <div className="stars-container">
                {renderStars()}
              </div>
              <div className="rating-text">
                {getRatingText(formData.rating)}
              </div>
            </div>
            {errors.rating && (
              <span className="error-message">{errors.rating}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="review">
              Nhận xét về người bán (tùy chọn)
            </label>
            <textarea
              id="review"
              name="review"
              value={formData.review}
              onChange={handleInputChange}
              placeholder="Chia sẻ trải nghiệm của bạn về người bán và sản phẩm..."
              rows="4"
              className={errors.review ? 'error' : ''}
            />
            {errors.review && <span className="error-message">{errors.review}</span>}
            <div className="character-count">
              {formData.review.length}/500 ký tự
            </div>
          </div>

          {errors.submit && (
            <div className="error-message submit-error">
              {errors.submit}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle"></i>
                  Xác nhận nhận hàng
                </>
              )}
            </button>
          </div>
        </form>

        <div className="receipt-notice">
          <h5>Lưu ý quan trọng:</h5>
          <ul>
            <li>Sau khi xác nhận, tiền sẽ được chuyển ngay cho người bán</li>
            <li>Bạn không thể hoàn tác sau khi đã xác nhận nhận hàng</li>
            <li>Đánh giá của bạn sẽ giúp cộng đồng đưa ra quyết định mua hàng</li>
            <li>Nếu có vấn đề với sản phẩm, vui lòng liên hệ người bán trước khi xác nhận</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ConfirmReceipt;