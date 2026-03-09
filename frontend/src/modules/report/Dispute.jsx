import React, { useState } from 'react';
import { createDispute } from '../../services/report.service';
import './Dispute.css';

const Dispute = ({ order, onSuccess, onCancel }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceImages, setEvidenceImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reasonOptions = [
    { value: 'not_as_described', label: 'Sản phẩm không đúng mô tả' },
    { value: 'damaged', label: 'Sản phẩm bị hỏng/hư hại' },
    { value: 'not_received', label: 'Không nhận được hàng' },
    { value: 'counterfeit', label: 'Hàng giả, hàng nhái' },
    { value: 'other', label: 'Khác' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason || !description.trim()) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (description.trim().length < 10) {
      setError('Mô tả phải có ít nhất 10 ký tự');
      return;
    }

    if (evidenceImages.length === 0) {
      setError('Vui lòng cung cấp ít nhất 1 ảnh bằng chứng');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createDispute(order._id, reason, description.trim(), evidenceImages);
      onSuccess && onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tạo khiếu nại');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    // In a real app, you would upload these files and get URLs
    // For now, we'll just create placeholder URLs
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setEvidenceImages(prev => [...prev, ...imageUrls].slice(0, 5)); // Max 5 images
  };

  const removeImage = (index) => {
    setEvidenceImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="dispute-modal">
      <div className="dispute-content">
        <div className="dispute-header">
          <h3>Tạo khiếu nại</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="order-info">
          <div className="order-details">
            <h4>Thông tin đơn hàng</h4>
            <div className="order-item">
              <img 
                src={order.listing?.images?.[0] || '/placeholder-image.jpg'} 
                alt={order.listing?.title}
                className="product-image"
              />
              <div className="product-details">
                <h5>{order.listing?.title}</h5>
                <p className="price">{order.agreedPrice?.toLocaleString('vi-VN')} VNĐ</p>
                <p className="order-id">Mã đơn: {order._id}</p>
              </div>
            </div>
          </div>
          
          <div className="seller-info">
            <h4>Người bán</h4>
            <div className="seller-details">
              <img 
                src={order.seller?.avatar || '/default-avatar.png'} 
                alt={order.seller?.fullName}
                className="seller-avatar"
              />
              <span className="seller-name">{order.seller?.fullName}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="dispute-form">
          <div className="form-group">
            <label htmlFor="reason">Lý do khiếu nại *</label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="">Chọn lý do</option>
              {reasonOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Mô tả chi tiết vấn đề *</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải với đơn hàng này. Thông tin càng chi tiết sẽ giúp chúng tôi xử lý khiếu nại nhanh hơn."
              rows="5"
              maxLength="1000"
              required
            />
            <div className="char-count">{description.length}/1000</div>
          </div>

          <div className="form-group">
            <label htmlFor="evidence">Ảnh bằng chứng * (bắt buộc)</label>
            <input
              type="file"
              id="evidence"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={evidenceImages.length >= 5}
            />
            <div className="upload-note">
              Bắt buộc ít nhất 1 ảnh, tối đa 5 ảnh. Ảnh bằng chứng rất quan trọng để xử lý khiếu nại.
            </div>
            
            {evidenceImages.length > 0 && (
              <div className="evidence-preview">
                {evidenceImages.map((url, index) => (
                  <div key={index} className="evidence-item">
                    <img src={url} alt={`Bằng chứng ${index + 1}`} />
                    <button 
                      type="button" 
                      className="remove-image"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dispute-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <strong>Lưu ý quan trọng:</strong>
              <ul>
                <li>Khiếu nại chỉ được tạo cho đơn hàng đã được giao</li>
                <li>Vui lòng cung cấp bằng chứng rõ ràng và chính xác</li>
                <li>Khiếu nại sai sự thật có thể bị xử phạt</li>
                <li>Thời gian xử lý khiếu nại: 3-7 ngày làm việc</li>
              </ul>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={onCancel}
              disabled={loading}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading || !reason || !description.trim() || evidenceImages.length === 0}
            >
              {loading ? 'Đang gửi...' : 'Tạo khiếu nại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dispute;