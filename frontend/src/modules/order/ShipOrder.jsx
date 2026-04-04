import React, { useState } from 'react';
import { confirmShipment } from '../../services/order.service';
import LocationSelector from '../../components/LocationSelector';
import { useAuth } from '../../hooks/useAuth';
import './ShipOrder.css';

const ShipOrder = ({ order, onClose, onSuccess }) => {
  const { user } = useAuth();
  const getDisplayOrderCode = () => order?.orderCode || order?._id?.slice(-8)?.toUpperCase() || 'N/A';
  
  // Ưu tiên lấy địa chỉ từ bài đăng (listing), fallback sang profile người bán
  const listing = order?.listing || order?.productId || {};
  const listingLoc = listing?.location || {};
  
  const defaultRecipientName = String(user?.fullName || order?.seller?.fullName || '').trim();
  const defaultShippingPhone = String(user?.phone || order?.seller?.phone || '').trim();
  
  // Xây dựng địa chỉ mặc định từ địa chỉ đăng bán (listing)
  const listingLocParts = [listing?.specificAddress, listingLoc.ward, listingLoc.district, listingLoc.city].filter(Boolean);
  let defaultShippingAddress = listingLocParts.length > 0
    ? listingLocParts.join(', ')
    : String(user?.address || '').trim();
  
  // Nếu listing không có địa chỉ, dùng profile của người bán
  if (!defaultShippingAddress) {
    const userLoc = user?.location || {};
    const userParts = [user?.specificAddress, userLoc.ward, userLoc.district, userLoc.city].filter(Boolean);
    defaultShippingAddress = userParts.length > 0 ? userParts.join(', ') : '';
  }

  // Pre-fill location codes từ listing để mở đúng dropdown khi tùy chỉnh
  const defaultShippingLocation = {
    city: listingLoc.city || '',
    district: listingLoc.district || '',
    ward: listingLoc.ward || '',
    provinceCode: listingLoc.provinceCode || null,
    districtCode: listingLoc.districtCode || null,
    wardCode: listingLoc.wardCode || null
  };

  const buildTrackingNumber = (provider) => {
    const normalizedProvider = String(provider || 'sys').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'SYS';
    const code = getDisplayOrderCode().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const orderSuffix = code.slice(-6) || Math.random().toString(36).slice(2, 8).toUpperCase();
    const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${normalizedProvider}-${orderSuffix}-${randomSuffix}`;
  };

  const [formData, setFormData] = useState({
    trackingNumber: buildTrackingNumber('ghn'),
    shippingProvider: 'ghn',
    estimatedDelivery: '',
    notes: '',
    shippingRecipientName: defaultRecipientName,
    shippingPhone: defaultShippingPhone,
    shippingAddress: defaultShippingAddress,
    shippingLocation: defaultShippingLocation,
    shippingSpecificAddress: listing?.specificAddress || '',
    useCustomShippingAddress: false
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
      [name]: value,
      ...(name === 'shippingProvider' ? { trackingNumber: buildTrackingNumber(value) } : {})
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleLocationChange = (locationData) => {
    setFormData(prev => ({
      ...prev,
      shippingLocation: locationData
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.trackingNumber.trim()) {
      newErrors.trackingNumber = 'Vui lòng nhập mã vận đơn';
    }

    if (!formData.shippingProvider) {
      newErrors.shippingProvider = 'Vui lòng chọn đơn vị vận chuyển';
    }

    if (!formData.shippingRecipientName.trim()) {
      newErrors.shippingRecipientName = 'Vui lòng nhập người nhận hàng';
    }

    if (!formData.shippingPhone.trim()) {
      newErrors.shippingPhone = 'Vui lòng nhập số điện thoại nhận hàng';
    }

    if (formData.useCustomShippingAddress) {
      if (!formData.shippingLocation.city || !formData.shippingLocation.district || !formData.shippingLocation.ward) {
        newErrors.shippingLocation = 'Vui lòng chọn đầy đủ cấp độ Khu vực';
      }
      if (!formData.shippingSpecificAddress.trim()) {
        newErrors.shippingSpecificAddress = 'Vui lòng nhập Địa chỉ cụ thể';
      }
    } else {
      if (!formData.shippingAddress.trim()) {
        newErrors.shippingAddress = 'Địa chỉ thiếu. Vui lòng bật Tùy chỉnh để thêm địa chỉ giao hàng.';
      }
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
      let finalAddress = formData.shippingAddress;
      if (formData.useCustomShippingAddress) {
        const loc = formData.shippingLocation;
        const parts = [formData.shippingSpecificAddress, loc.ward, loc.district, loc.city].filter(Boolean);
        finalAddress = parts.join(', ');
      }

      const shipmentData = {
        trackingNumber: formData.trackingNumber.trim(),
        shippingProvider: formData.shippingProvider,
        estimatedDelivery: formData.estimatedDelivery,
        notes: formData.notes.trim(),
        shippingRecipientName: formData.shippingRecipientName.trim(),
        shippingPhone: formData.shippingPhone.trim(),
        shippingAddress: finalAddress.trim()
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

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      awaiting_seller_confirmation: 'Chờ người bán xác nhận',
      awaiting_payment: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      shipped: 'Đang giao hàng',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      disputed: 'Đang tranh chấp'
    };
    return labels[status] || status || 'N/A';
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
                <span className="value">#{getDisplayOrderCode()}</span>
              </div>
              <div className="detail-item">
                <span className="label">Sản phẩm:</span>
                <span className="value">{order.listing?.title}</span>
              </div>
              <div className="detail-item">
                <span className="label">Trạng thái:</span>
                <span className="value">{getStatusLabel(order.status)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Giá trị:</span>
                <span className="value">{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Người mua:</span>
                <span className="value">{order.buyer?.fullName}</span>
              </div>
              <div className="detail-item">
                <span className="label">SĐT người mua:</span>
                <span className="value">{order.buyer?.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className="detail-item detail-item--full">
                <span className="label">Địa chỉ giao đến:</span>
                <span className="value">{order.shippingAddress || order.buyer?.address || 'Chưa cập nhật'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Ngày tạo đơn:</span>
                <span className="value">{formatDateTime(order.createdAt)}</span>
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
              readOnly
              placeholder="Mã vận đơn sẽ được hệ thống tự tạo"
              className={errors.trackingNumber ? 'error' : ''}
            />
            {errors.trackingNumber && (
              <span className="error-message">{errors.trackingNumber}</span>
            )}
            <div className="form-hint">
              Mã vận đơn được tạo ngẫu nhiên theo đơn hàng và sẽ gửi cho người mua để theo dõi
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

          <div className="shipping-address-panel">
            <div className="shipping-address-panel__header">
              <div>
                <h4>Thông tin điểm lấy hàng (Pickup)</h4>
                <p>Mặc định lấy từ địa chỉ bài đăng. Bạn có thể tùy chỉnh nếu giao từ nơi khác.</p>
              </div>
              <label className="shipping-toggle">
                <input
                  type="checkbox"
                  name="useCustomShippingAddress"
                  checked={formData.useCustomShippingAddress}
                  onChange={(e) => {
                    const useCustomShippingAddress = e.target.checked;
                    setFormData((prev) => ({
                      ...prev,
                      useCustomShippingAddress,
                      shippingRecipientName: useCustomShippingAddress ? prev.shippingRecipientName : defaultRecipientName,
                      shippingPhone: useCustomShippingAddress ? prev.shippingPhone : defaultShippingPhone,
                      shippingAddress: useCustomShippingAddress ? prev.shippingAddress : defaultShippingAddress
                    }));
                  }}
                />
                <span>Tùy chỉnh điểm lấy hàng</span>
              </label>
            </div>

            {!formData.useCustomShippingAddress && (
              <div className="shipping-default-preview">
                <div className="detail-item">
                  <span className="label">Người gửi hàng</span>
                  <span className="value">{formData.shippingRecipientName || 'Chưa cập nhật'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Số điện thoại</span>
                  <span className="value">{formData.shippingPhone || 'Chưa cập nhật'}</span>
                </div>
                <div className="detail-item detail-item--full">
                  <span className="label">Địa chỉ lấy hàng</span>
                  <span className="value">{formData.shippingAddress || 'Chưa cập nhật'}</span>
                </div>
              </div>
            )}

            {formData.useCustomShippingAddress && (
              <div className="shipping-custom-grid">
                <div className="form-group">
                  <label htmlFor="shippingRecipientName">
                    Họ tên người gửi <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="shippingRecipientName"
                    name="shippingRecipientName"
                    value={formData.shippingRecipientName}
                    onChange={handleInputChange}
                    placeholder="Nhập tên người gửi"
                    className={errors.shippingRecipientName ? 'error' : ''}
                  />
                  {errors.shippingRecipientName && (
                    <span className="error-message">{errors.shippingRecipientName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="shippingPhone">
                    Số điện thoại gửi hàng <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="shippingPhone"
                    name="shippingPhone"
                    value={formData.shippingPhone}
                    onChange={handleInputChange}
                    placeholder="Nhập số điện thoại gửi hàng"
                    className={errors.shippingPhone ? 'error' : ''}
                  />
                  {errors.shippingPhone && (
                    <span className="error-message">{errors.shippingPhone}</span>
                  )}
                </div>

                <div className="form-group shipping-custom-grid__full">
                  <label>Khu vực lấy hàng <span className="required">*</span></label>
                  <LocationSelector
                    value={formData.shippingLocation}
                    onChange={handleLocationChange}
                    errors={{}}
                  />
                  {errors.shippingLocation && (
                    <span className="error-message">{errors.shippingLocation}</span>
                  )}
                </div>

                <div className="form-group shipping-custom-grid__full">
                  <label htmlFor="shippingSpecificAddress">
                    Địa chỉ cụ thể (Số nhà, tên đường...) <span className="required">*</span>
                  </label>
                  <textarea
                    id="shippingSpecificAddress"
                    name="shippingSpecificAddress"
                    value={formData.shippingSpecificAddress}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: Số 10 Ngõ 20, đường X..."
                    rows="2"
                    className={errors.shippingSpecificAddress ? 'error' : ''}
                  />
                  {errors.shippingSpecificAddress && (
                    <span className="error-message">{errors.shippingSpecificAddress}</span>
                  )}
                </div>
              </div>
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