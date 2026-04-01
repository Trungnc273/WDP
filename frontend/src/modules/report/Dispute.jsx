import React, { useState } from 'react';
import { createDispute, uploadEvidenceMedia } from '../../services/report.service';
import { getImageUrl } from '../../utils/imageHelper';
import './Dispute.css';

const Dispute = ({ order, onSuccess, onCancel, initialReason = '' }) => {
  const [reason, setReason] = useState(initialReason);
  const [description, setDescription] = useState('');
  const [evidenceImages, setEvidenceImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');

  const reasonOptions = [
    { value: 'not_as_described', label: 'Sản phẩm không đúng mô tả' },
    { value: 'damaged', label: 'Sản phẩm bị hỏng/hư hại' },
    { value: 'not_received', label: 'Không nhận được hàng' },
    { value: 'counterfeit', label: 'Hàng giả, hàng nhái' },
    { value: 'return_request', label: 'Yêu cầu hoàn hàng' },
    { value: 'other', label: 'Khác' }
  ];

  React.useEffect(() => {
    setReason(initialReason || '');
  }, [initialReason]);

  const isVideoEvidence = (url = '') => /\.(mp4|mov|webm|avi|mkv)$/i.test(url);

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
      setError('Vui lòng cung cấp ít nhất 1 tệp bằng chứng (ảnh hoặc video)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createDispute(order._id, reason, description.trim(), evidenceImages);
      onSuccess && onSuccess();
    } catch (error) {
      setError(error.message || 'Có lỗi xảy ra khi tạo khiếu nại');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const availableSlots = 5 - evidenceImages.length;

    if (!files.length || availableSlots <= 0) return;

    setUploadingImages(true);
    setError('');

    try {
      const uploadedPaths = await uploadEvidenceMedia(files.slice(0, availableSlots));
      setEvidenceImages(prev => [...prev, ...uploadedPaths].slice(0, 5));
    } catch (uploadError) {
      setError(uploadError.message || 'Không thể upload bằng chứng');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
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
                src={getImageUrl(order?.listing?.images?.[0]) || '/images/placeholders/product-placeholder.svg'} 
                alt={order.listing?.title}
                className="product-image"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/images/placeholders/product-placeholder.svg';
                }}
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
                src={getImageUrl(order?.seller?.avatar) || '/images/placeholders/avatar-placeholder.svg'} 
                alt={order.seller?.fullName}
                className="seller-avatar"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/images/placeholders/avatar-placeholder.svg';
                }}
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
            <label htmlFor="evidence">Bằng chứng * (ảnh/video)</label>
            <input
              type="file"
              id="evidence"
              accept=".png,.jpg,.jpeg,.mp4,image/png,image/jpeg,video/mp4"
              multiple
              onChange={handleImageUpload}
              disabled={evidenceImages.length >= 5 || loading || uploadingImages}
            />
            <div className="upload-note">
              Bắt buộc ít nhất 1 tệp, tối đa 5 tệp. Chỉ nhận ảnh PNG/JPG/JPEG và video MP4 (H.264), ≤ 100MB, ≤ 3 phút, 720p-1080p.
            </div>
            <div className="upload-note">
              Video cần là bản quay mở hộp liên tục, không chỉnh sửa.
            </div>
            {uploadingImages && <div className="upload-note">Đang upload bằng chứng...</div>}
            
            {evidenceImages.length > 0 && (
              <div className="evidence-preview">
                {evidenceImages.map((url, index) => (
                  <div key={index} className="evidence-item">
                    {isVideoEvidence(url) ? (
                      <video src={getImageUrl(url)} controls className="evidence-video" />
                    ) : (
                      <img src={getImageUrl(url)} alt={`Bằng chứng ${index + 1}`} />
                    )}
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
              disabled={loading || uploadingImages || !reason || !description.trim() || evidenceImages.length === 0}
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