import React, { useState } from 'react';
import { createUserReport, uploadEvidenceImages } from '../../services/report.service';
import { getImageUrl } from '../../utils/imageHelper';
import './ReportProduct.css';

const ReportUser = ({ reportedUser, onSuccess, onCancel }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceImages, setEvidenceImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');

  const reasonOptions = [
    { value: 'scam', label: 'Lừa đảo' },
    { value: 'inappropriate', label: 'Hành vi không phù hợp' },
    { value: 'spam', label: 'Spam / làm phiền' },
    { value: 'counterfeit', label: 'Bán hàng giả / sai sự thật' },
    { value: 'other', label: 'Khác' }
  ];

  const isVideoEvidence = (url = '') => /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(url);

  const handleSubmit = async (event) => {
    event.preventDefault();

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
      await createUserReport(reportedUser._id, reason, description.trim(), evidenceImages);
      onSuccess && onSuccess();
    } catch (submitError) {
      setError(submitError.message || 'Có lỗi xảy ra khi gửi báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    const availableSlots = 5 - evidenceImages.length;

    if (!files.length || availableSlots <= 0) return;

    setUploadingImages(true);
    setError('');

    try {
      const uploadedPaths = await uploadEvidenceImages(files.slice(0, availableSlots));
      setEvidenceImages((prev) => [...prev, ...uploadedPaths].slice(0, 5));
    } catch (uploadError) {
      setError(uploadError.message || 'Không thể upload ảnh bằng chứng');
    } finally {
      setUploadingImages(false);
      event.target.value = '';
    }
  };

  const removeImage = (index) => {
    setEvidenceImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className="report-modal">
      <div className="report-content">
        <div className="report-header">
          <h3>Báo cáo người dùng</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="product-info">
          <img
            src={getImageUrl(reportedUser?.avatar) || '/images/placeholders/avatar-placeholder.svg'}
            alt={reportedUser?.fullName}
            className="product-image"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = '/images/placeholders/avatar-placeholder.svg';
            }}
          />
          <div className="product-details">
            <h4>{reportedUser?.fullName || 'Người dùng'}</h4>
            <p className="seller">Vai trò: Thành viên ReFlow</p>
            <p className="seller">Đánh giá: {Number(reportedUser?.rating || 0).toFixed(1)}/5</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-group">
            <label htmlFor="user-report-reason">Lý do báo cáo *</label>
            <select
              id="user-report-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
            >
              <option value="">Chọn lý do</option>
              {reasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="user-report-description">Mô tả chi tiết *</label>
            <textarea
              id="user-report-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Vui lòng mô tả rõ hành vi vi phạm của người dùng này..."
              rows="4"
              maxLength="1000"
              required
            />
            <div className="char-count">{description.length}/1000</div>
          </div>

          <div className="form-group">
            <label htmlFor="user-report-evidence">Bằng chứng (ảnh/video, tùy chọn)</label>
            <input
              type="file"
              id="user-report-evidence"
              accept="image/*,video/*"
              multiple
              onChange={handleImageUpload}
              disabled={evidenceImages.length >= 5 || loading || uploadingImages}
            />
            <div className="upload-note">Tối đa 5 tệp (ảnh hoặc video). Bằng chứng rõ ràng sẽ giúp xử lý nhanh hơn.</div>
            {uploadingImages && <div className="upload-note">Đang upload bằng chứng...</div>}

            {evidenceImages.length > 0 && (
              <div className="evidence-preview">
                {evidenceImages.map((url, index) => (
                  <div key={`${url}-${index}`} className="evidence-item">
                    {isVideoEvidence(url) ? (
                      <video src={getImageUrl(url)} controls />
                    ) : (
                      <img src={getImageUrl(url)} alt={`Bằng chứng ${index + 1}`} />
                    )}
                    <button type="button" className="remove-image" onClick={() => removeImage(index)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel} disabled={loading}>
              Hủy
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || uploadingImages || !reason || !description.trim()}
            >
              {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportUser;