import React, { useState } from 'react';
import './ShippingForm.css';

const ShippingForm = ({ orderId, onSubmit, onCancel, initialData = {} }) => {
  const [formData, setFormData] = useState({
    provider: initialData.provider || '',
    trackingNumber: initialData.trackingNumber || '',
    estimatedDelivery: initialData.estimatedDelivery || '',
    notes: initialData.notes || '',
    shippingAddress: {
      recipientName: initialData.shippingAddress?.recipientName || '',
      phone: initialData.shippingAddress?.phone || '',
      address: initialData.shippingAddress?.address || '',
      city: initialData.shippingAddress?.city || '',
      district: initialData.shippingAddress?.district || '',
      ward: initialData.shippingAddress?.ward || ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shippingProviders = [
    { value: 'ghn', label: 'Giao Hàng Nhanh (GHN)' },
    { value: 'ghtk', label: 'Giao Hàng Tiết Kiệm (GHTK)' },
    { value: 'viettel_post', label: 'Viettel Post' },
    { value: 'vnpost', label: 'VNPost' },
    { value: 'j&t', label: 'J&T Express' },
    { value: 'ninja_van', label: 'Ninja Van' },
    { value: 'other', label: 'Khác' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('shippingAddress.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    if (!formData.provider) {
      setError('Vui lòng chọn đơn vị vận chuyển');
      return false;
    }
    
    if (!formData.shippingAddress.recipientName) {
      setError('Vui lòng nhập tên người nhận');
      return false;
    }
    
    if (!formData.shippingAddress.phone) {
      setError('Vui lòng nhập số điện thoại người nhận');
      return false;
    }
    
    if (!/^[0-9]{10,11}$/.test(formData.shippingAddress.phone)) {
      setError('Số điện thoại không hợp lệ');
      return false;
    }
    
    if (!formData.shippingAddress.address) {
      setError('Vui lòng nhập địa chỉ giao hàng');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submitData = {
        orderId,
        ...formData,
        estimatedDelivery: formData.estimatedDelivery ? new Date(formData.estimatedDelivery).toISOString() : undefined
      };
      
      await onSubmit(submitData);
    } catch (error) {
      setError(error.message || 'Có lỗi xảy ra khi tạo đơn vận chuyển');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shipping-form-overlay">
      <div className="shipping-form-modal">
        <div className="shipping-form-header">
          <h2>Thông tin vận chuyển</h2>
          <button 
            className="close-button"
            onClick={onCancel}
            disabled={loading}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="shipping-form">
          {/* Shipping Provider */}
          <div className="form-group">
            <label htmlFor="provider">Đơn vị vận chuyển *</label>
            <select
              id="provider"
              name="provider"
              value={formData.provider}
              onChange={handleInputChange}
              required
            >
              <option value="">Chọn đơn vị vận chuyển</option>
              {shippingProviders.map(provider => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tracking Number */}
          <div className="form-group">
            <label htmlFor="trackingNumber">Mã vận đơn</label>
            <input
              type="text"
              id="trackingNumber"
              name="trackingNumber"
              value={formData.trackingNumber}
              onChange={handleInputChange}
              placeholder="Nhập mã vận đơn (nếu có)"
            />
          </div>

          {/* Estimated Delivery */}
          <div className="form-group">
            <label htmlFor="estimatedDelivery">Ngày giao dự kiến</label>
            <input
              type="date"
              id="estimatedDelivery"
              name="estimatedDelivery"
              value={formData.estimatedDelivery}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Shipping Address */}
          <div className="form-section">
            <h3>Địa chỉ giao hàng</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="recipientName">Tên người nhận *</label>
                <input
                  type="text"
                  id="recipientName"
                  name="shippingAddress.recipientName"
                  value={formData.shippingAddress.recipientName}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập tên người nhận"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Số điện thoại *</label>
                <input
                  type="tel"
                  id="phone"
                  name="shippingAddress.phone"
                  value={formData.shippingAddress.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Địa chỉ chi tiết *</label>
              <input
                type="text"
                id="address"
                name="shippingAddress.address"
                value={formData.shippingAddress.address}
                onChange={handleInputChange}
                required
                placeholder="Số nhà, tên đường"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ward">Phường/Xã</label>
                <input
                  type="text"
                  id="ward"
                  name="shippingAddress.ward"
                  value={formData.shippingAddress.ward}
                  onChange={handleInputChange}
                  placeholder="Phường/Xã"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="district">Quận/Huyện</label>
                <input
                  type="text"
                  id="district"
                  name="shippingAddress.district"
                  value={formData.shippingAddress.district}
                  onChange={handleInputChange}
                  placeholder="Quận/Huyện"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="city">Tỉnh/Thành phố</label>
                <input
                  type="text"
                  id="city"
                  name="shippingAddress.city"
                  value={formData.shippingAddress.city}
                  onChange={handleInputChange}
                  placeholder="Tỉnh/Thành phố"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes">Ghi chú</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              placeholder="Ghi chú thêm về việc giao hàng (tùy chọn)"
              maxLength="500"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={onCancel}
              disabled={loading}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Tạo đơn vận chuyển'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShippingForm;