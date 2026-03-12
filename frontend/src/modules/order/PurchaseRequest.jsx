import React, { useState } from 'react';
import { createPurchaseRequest } from '../../services/order.service';
import { getImageUrl } from '../../utils/imageHelper';
import './PurchaseRequest.css';

const PurchaseRequest = ({ product, onClose, onSuccess, isQuickBuy = false }) => {
  const [formData, setFormData] = useState({
    message: isQuickBuy ? 'Mua ngay' : '',
    agreedPrice: product?.price || 0
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'agreedPrice' ? Number(value) : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Skip message validation for quick buy
    if (!isQuickBuy) {
      if (!formData.message.trim()) {
        newErrors.message = 'Vui lòng nhập tin nhắn';
      } else if (formData.message.trim().length < 10) {
        newErrors.message = 'Tin nhắn phải có ít nhất 10 ký tự';
      } else if (formData.message.trim().length > 500) {
        newErrors.message = 'Tin nhắn không được quá 500 ký tự';
      }
    }

    // For quick buy, agreedPrice is fixed
    if (!isQuickBuy) {
      if (!formData.agreedPrice || formData.agreedPrice <= 0) {
        newErrors.agreedPrice = 'Vui lòng nhập giá đề nghị hợp lệ';
      } else if (formData.agreedPrice < product.price) {
        newErrors.agreedPrice = 'Giá đề nghị phải bằng hoặc cao hơn giá sản phẩm';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const requestData = {
        listingId: product._id,
        message: formData.message.trim(),
        agreedPrice: formData.agreedPrice
      };

      await createPurchaseRequest(requestData);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating purchase request:', error);
      setErrors({
        submit: error.message || 'Có lỗi xảy ra khi gửi yêu cầu'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <div className="purchase-request-modal">
      <div className="purchase-request-overlay" onClick={onClose}></div>
      <div className="purchase-request-content">
        <div className="purchase-request-header">
          <h3>Gửi yêu cầu mua hàng</h3>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="product-info">
          <div className="product-image">
            <img 
              src={getImageUrl(product?.images?.[0]) || '/placeholder-image.jpg'} 
              alt={product?.title}
            />
          </div>
          <div className="product-details">
            <h4>{product?.title}</h4>
            <p className="product-price">
              Giá niêm yết: <span>{formatPrice(product?.price)} VND</span>
            </p>
            <p className="seller-info">
              Người bán: <span>{product?.seller?.fullName}</span>
            </p>
          </div>
        </div>

        <div className="price-summary">
          <div className="price-row">
            <span className="price-label">Giá sản phẩm:</span>
            <span className="price-value">{formatPrice(product?.price)} VND</span>
          </div>
          <div className="price-row">
            <span className="price-label">Hoa hồng nền tảng (5%):</span>
            <span className="price-value">{formatPrice(Math.round(product?.price * 0.05))} VND</span>
          </div>
          <div className="price-row total">
            <span className="price-label">Tổng tiền:</span>
            <span className="price-value">{formatPrice(Math.round(product?.price * 1.05))} VND</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="purchase-request-form">
          {!isQuickBuy && (
            <>
              <div className="form-group">
                <label htmlFor="message">
                  Tin nhắn cho người bán <span className="required">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  disabled={isQuickBuy}
                  placeholder="Xin chào, tôi muốn mua sản phẩm này. Có thể thương lượng giá được không?"
                  rows="4"
                  className={errors.message ? 'error' : ''}
                />
                {errors.message && <span className="error-message">{errors.message}</span>}
                <div className="character-count">
                  {formData.message.length}/500 ký tự
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="agreedPrice">
                  Giá đề nghị <span className="required">*</span>
                </label>
                <div className="price-input-wrapper">
                  <input
                    type="number"
                    id="agreedPrice"
                    name="agreedPrice"
                    value={formData.agreedPrice}
                    onChange={handleInputChange}
                    disabled={isQuickBuy}
                    min="0"
                    step="1000"
                    className={errors.agreedPrice ? 'error' : ''}
                  />
                  />
                  <span className="currency">VND</span>
                </div>
                {errors.agreedPrice && <span className="error-message">{errors.agreedPrice}</span>}
                <div className="price-suggestion">
                  Giá tối thiểu: {formatPrice(product?.price)} VND
                </div>
              </div>
            </>
          )}

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
                  {isQuickBuy ? 'Đang xác nhận...' : 'Đang gửi...'}
                </>
              ) : (
                <>
                  <i className={`fas fa-${isQuickBuy ? 'check' : 'paper-plane'}`}></i>
                  {isQuickBuy ? 'Xác nhận mua ngay' : 'Gửi yêu cầu'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseRequest;