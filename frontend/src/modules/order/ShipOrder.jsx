import React, { useState } from 'react';
import { confirmShipment } from '../../services/order.service';
import './ShipOrder.css';

const ShipOrder = ({ order, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    trackingNumber: '',
    shippingProvider: 'ghn',
    estimatedDelivery: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const shippingProviders = [
    { value: 'ghn', label: 'Giao Hàng Nhanh (GHN)' },
    { value: 'ghtk', label: 'Giao Hàng Tiết Kiệm (GHTK)' },
    { value: 'vnpost', label: 'Bưu điện Việt Nam' },
    { value: 'viettel', label: 'Viettel Post' },
    { value: 'jnt', label: 'J&T Express' },
    { value: 'other', label: 'Khác' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    if (!formData.trackingNumber.trim()) {
      newErrors.trackingNumber = 'Vui lòng nhập mã vận đơn';
    } else if (formData.trackingNumber.trim().length < 5) {
      newErrors.trackingNumber = 'Mã vận đơn phải có ít nhất 5 ký tự';
    }

    if (!formData.shippingProvider) {
      newErrors.shippingProvider = 'Vui lòng chọn đơn vị vận chuyển';
    }

    if (!formData.estimatedDelivery) {
      newErrors.estimatedDelivery = 'Vui lòng chọn ngày dự kiến giao hàng';
    } else {
      const selectedDate = new Date(formData.estimatedDelivery);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.estimatedDelivery = 'Ngày giao hàng không thể là ngày trong quá khứ';
      }
    }

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Ghi chú không được quá 500 ký tự';
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
      const shipmentData = {
        trackingNumber: formData.trackingNumber.trim(),
        shippingProvider: formData.shippingProvider,
        estimatedDelivery: formData.estimatedDelivery,
        notes: formData.notes.trim()
      };

      await confirmShipment(order._id, shipmentData);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error confirming shipment:', error);
      setErrors({
        submit: error.message || 'Có lỗi xảy ra khi xác nhận giao hàng'
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

  // Lay ngay nho nhat (hom nay)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  return (
    <div className="ship-order-modal">
      <div className="ship-order-overlay" onClick={onClose}></div>
      <div className="ship-order-content">
        <div className="ship-order-header">
          <h3>Xác nhận giao hàng</h3>
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
                <span className="label">Giá trị:</span>
                <span className="value">{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Người mua:</span>
                <span className="value">{order.buyer?.fullName}</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="ship-order-form">
          <div className="form-group">
            <label htmlFor="shippingProvider">
              Đơn vị vận chuyển <span className="required">*</span>
            </label>
            <select
              id="shippingProvider"
              name="shippingProvider"
              value={formData.shippingProvider}
              onChange={handleInputChange}
              className={errors.shippingProvider ? 'error' : ''}
            >
              <option value="">Chọn đơn vị vận chuyển</option>
              {shippingProviders.map(provider => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
            {errors.shippingProvider && (
              <span className="error-message">{errors.shippingProvider}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="trackingNumber">
              Mã vận đơn <span className="required">*</span>
            </label>
            <input
              type="text"
              id="trackingNumber"
              name="trackingNumber"
              value={formData.trackingNumber}
              onChange={handleInputChange}
              placeholder="Nhập mã vận đơn"
              className={errors.trackingNumber ? 'error' : ''}
            />
            {errors.trackingNumber && (
              <span className="error-message">{errors.trackingNumber}</span>
            )}
            <div className="form-hint">
              Mã vận đơn sẽ được gửi cho người mua để theo dõi
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="estimatedDelivery">
              Ngày dự kiến giao hàng <span className="required">*</span>
            </label>
            <input
              type="date"
              id="estimatedDelivery"
              name="estimatedDelivery"
              value={formData.estimatedDelivery}
              onChange={handleInputChange}
              min={minDate}
              className={errors.estimatedDelivery ? 'error' : ''}
            />
            {errors.estimatedDelivery && (
              <span className="error-message">{errors.estimatedDelivery}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="notes">
              Ghi chú thêm
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Ghi chú về việc giao hàng (tùy chọn)"
              rows="3"
              className={errors.notes ? 'error' : ''}
            />
            {errors.notes && <span className="error-message">{errors.notes}</span>}
            <div className="character-count">
              {formData.notes.length}/500 ký tự
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
                  <i className="fas fa-shipping-fast"></i>
                  Xác nhận giao hàng
                </>
              )}
            </button>
          </div>
        </form>

        <div className="shipping-notice">
          <h5>Lưu ý quan trọng:</h5>
          <ul>
            <li>Sau khi xác nhận giao hàng, người mua sẽ nhận được thông báo</li>
            <li>Tiền sẽ được giữ trong ký quỹ cho đến khi người mua xác nhận nhận hàng</li>
            <li>Nếu người mua không xác nhận trong 5 ngày, tiền sẽ tự động được chuyển cho bạn</li>
            <li>Vui lòng đảm bảo thông tin vận đơn chính xác để người mua có thể theo dõi</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ShipOrder;