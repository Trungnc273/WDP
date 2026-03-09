import React, { useState } from 'react';
import { createProductReport } from '../../services/report.service';
import './ReportProduct.css';

const ReportProduct = ({ product, onSuccess, onCancel }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceImages, setEvidenceImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reasonOptions = [
    { value: 'counterfeit', label: 'Hàng giả, hàng nhái' },
    { value: 'inappropriate', label: 'Nội dung không phù hợp' },
    { value: 'scam', label: 'Lừa đảo' },
    { value: 'spam', label: 'Spam' },
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

    setLoading(true);
    setError('');

    try {
      await createProductReport(product._id, reason, description.trim(), evidenceImages);
      onSuccess && onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi gửi báo cáo');
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
    <div className="report-modal">
      <div className="report-content">
        <div className="report-header">
          <h3>Báo cáo sản phẩm</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="product-info">
          <img 
            src={product.images?.[0] || '/placeholder-image.jpg'} 
            alt={product.title}
            className="product-image"
          />
          <div className="product-details">
            <h4>{product.title}</h4>
            <p className="price">{product.price?.toLocaleString('vi-VN')} VNĐ</p>
            <p className="seller">Người bán: {product.seller?.fullName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-group">
            <label htmlFor="reason">Lý do báo cáo *</label>
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
            <label htmlFor="description">Mô tả chi tiết *</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải với sản phẩm này..."
              rows="4"
              maxLength="1000"
              required
            />
            <div className="char-count">{description.length}/1000</div>
          </div>

          <div className="form-group">
            <label htmlFor="evidence">Ảnh bằng chứng (tùy chọn)</label>
            <input
              type="file"
              id="evidence"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={evidenceImages.length >= 5}
            />
            <div className="upload-note">
              Tối đa 5 ảnh. Ảnh bằng chứng sẽ giúp chúng tôi xử lý báo cáo nhanh hơn.
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
              disabled={loading || !reason || !description.trim()}
            >
              {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportProduct;