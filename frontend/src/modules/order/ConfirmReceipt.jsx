import React, { useState } from 'react';
import { confirmReceipt } from '../../services/order.service';
import { createReview } from '../../services/review.service';
import { uploadEvidenceMedia } from '../../services/report.service';
import { getImageUrl } from '../../utils/imageHelper';
import './ConfirmReceipt.css';

const ConfirmReceipt = ({ order, onClose, onSuccess }) => {
  const productImageSrc = getImageUrl(order.listing?.images?.[0]) || '/images/placeholder.png';
  const sellerAvatarSrc = getImageUrl(order.seller?.avatar) || '/images/placeholders/avatar-placeholder.svg';

  const highlightOptions = {
    positive: ['Đúng mô tả', 'Đóng gói cẩn thận', 'Giao tiếp tốt', 'Giao hàng nhanh', 'Sản phẩm chất lượng'],
    neutral: ['Tạm ổn', 'Đúng giá', 'Cần cải thiện đóng gói', 'Phản hồi chậm', 'Giao hàng lâu'],
    negative: ['Sai mô tả', 'Sản phẩm lỗi', 'Đóng gói sơ sài', 'Phản hồi kém', 'Trải nghiệm chưa tốt']
  };

  const [formData, setFormData] = useState({
    rating: 5,
    review: '',
    satisfied: true
  });
  const [selectedHighlights, setSelectedHighlights] = useState([]);
  const [reviewEvidenceFiles, setReviewEvidenceFiles] = useState([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const reviewTone = formData.rating >= 4 ? 'positive' : formData.rating === 3 ? 'neutral' : 'negative';
  const currentHighlightOptions = highlightOptions[reviewTone];

  const buildReviewComment = () => {
    const trimmedReview = formData.review.trim();
    const highlightText = selectedHighlights.length ? `Điểm nổi bật: ${selectedHighlights.join(', ')}.` : '';

    if (highlightText && trimmedReview) {
      return `${highlightText}\n${trimmedReview}`;
    }

    return highlightText || trimmedReview;
  };

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
      rating,
      satisfied: rating >= 4
    }));
    setSelectedHighlights([]);
    if (errors.rating || errors.review) {
      setErrors(prev => ({
        ...prev,
        rating: '',
        review: ''
      }));
    }
  };

  const handleSatisfiedChange = (satisfied) => {
    setFormData(prev => ({
      ...prev,
      satisfied,
      rating: satisfied ? Math.max(prev.rating, 4) : Math.min(prev.rating, 3)
    }));
    setSelectedHighlights([]);
  };

  const handleHighlightToggle = (highlight) => {
    setSelectedHighlights(prev => (
      prev.includes(highlight)
        ? prev.filter(item => item !== highlight)
        : [...prev, highlight].slice(0, 3)
    ));
  };

  const validateForm = () => {
    const newErrors = {};
    const finalReviewComment = buildReviewComment();

    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = 'Vui lòng chọn đánh giá từ 1 đến 5 sao';
    }

    if (finalReviewComment.length > 500) {
      newErrors.review = 'Nhận xét không được quá 500 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isVideoEvidence = (url = '') => /\.(mp4)$/i.test(url);

  const handleReviewEvidenceUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = Math.max(0, 5 - reviewEvidenceFiles.length);
    if (remainingSlots <= 0) {
      setErrors((prev) => ({
        ...prev,
        evidence: 'Tối đa 5 tệp bằng chứng cho mỗi đánh giá'
      }));
      e.target.value = '';
      return;
    }

    setUploadingEvidence(true);
    setErrors((prev) => ({ ...prev, evidence: '' }));
    try {
      const uploadedPaths = await uploadEvidenceMedia(files.slice(0, remainingSlots));
      setReviewEvidenceFiles((prev) => [...prev, ...uploadedPaths].slice(0, 5));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        evidence: error.message || 'Không thể upload bằng chứng đánh giá'
      }));
    } finally {
      setUploadingEvidence(false);
      e.target.value = '';
    }
  };

  const removeReviewEvidence = (index) => {
    setReviewEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
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
      await confirmReceipt(order._id);

      let reviewCreated = false;
      let reviewError = '';

      try {
        await createReview(order._id, formData.rating, buildReviewComment(), reviewEvidenceFiles);
        reviewCreated = true;
      } catch (reviewSubmitError) {
        reviewError = reviewSubmitError.response?.data?.message || reviewSubmitError.message || 'Không thể gửi đánh giá';
      }
      
      if (onSuccess) {
        onSuccess({ reviewCreated, reviewError });
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
        <span className="star-button__icon">
          <i className="fas fa-star"></i>
        </span>
        <span className="star-button__value">{star}</span>
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
                <span className="value">#{order.orderCode || order._id.slice(-8).toUpperCase()}</span>
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
          <div className="review-stage-card">
            <div className="review-stage-card__header">
              <div>
                <h4>Đánh giá trải nghiệm mua hàng</h4>
                <p>Hãy chia sẻ cảm nhận thực tế để người mua khác tham khảo dễ hơn.</p>
              </div>
              <div className="review-order-chip">#{order.orderCode || order._id.slice(-8).toUpperCase()}</div>
            </div>

            <div className="review-product-card">
              <img
                src={productImageSrc}
                alt={order.listing?.title}
                className="review-product-card__image"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/placeholder.png';
                }}
              />
              <div className="review-product-card__content">
                <div className="review-product-card__title">{order.listing?.title}</div>
                <div className="review-product-card__meta">
                  <span className="price-pill">Giá đơn: {formatPrice(order.agreedPrice || order.totalAmount || 0)}</span>
                  <span className="tracking-pill">Mã vận đơn: {order.shipping?.trackingNumber || 'Chưa có'}</span>
                </div>
              </div>

              <div className="review-seller-card">
                <img
                  src={sellerAvatarSrc}
                  alt={order.seller?.fullName}
                  className="review-seller-card__avatar"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/placeholders/avatar-placeholder.svg';
                  }}
                />
                <div>
                  <div className="review-seller-card__label">Người bán</div>
                  <div className="review-seller-card__name">{order.seller?.fullName}</div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>
                Mức độ hài lòng <span className="required">*</span>
              </label>
              <div className="satisfaction-grid">
                <button
                  type="button"
                  className={`satisfaction-card ${formData.satisfied ? 'active' : ''}`}
                  onClick={() => handleSatisfiedChange(true)}
                >
                  <span className="satisfaction-card__icon">👍</span>
                  <span className="satisfaction-card__title">Hài lòng</span>
                  <span className="satisfaction-card__desc">Sản phẩm và trải nghiệm đúng kỳ vọng</span>
                </button>
                <button
                  type="button"
                  className={`satisfaction-card ${!formData.satisfied ? 'active' : ''}`}
                  onClick={() => handleSatisfiedChange(false)}
                >
                  <span className="satisfaction-card__icon">👎</span>
                  <span className="satisfaction-card__title">Chưa hài lòng</span>
                  <span className="satisfaction-card__desc">Có điểm chưa ổn trong giao dịch hoặc sản phẩm</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>
                Đánh giá người bán <span className="required">*</span>
              </label>
              <div className="rating-section">
                <div className="stars-container">{renderStars()}</div>
                <div className="rating-text rating-text--highlight">{getRatingText(formData.rating)}</div>
              </div>
              {errors.rating && (
                <span className="error-message">{errors.rating}</span>
              )}
            </div>

            <div className="form-group">
              <label>Điểm nổi bật</label>
              <div className="highlight-chips">
                {currentHighlightOptions.map((highlight) => (
                  <button
                    key={highlight}
                    type="button"
                    className={`highlight-chip ${selectedHighlights.includes(highlight) ? 'active' : ''}`}
                    onClick={() => handleHighlightToggle(highlight)}
                  >
                    {highlight}
                  </button>
                ))}
              </div>
              <div className="form-helper-text">Chọn tối đa 3 điểm nổi bật để review ngắn gọn và dễ đọc hơn.</div>
            </div>

            <div className="form-group">
              <label htmlFor="review">
                Nhận xét chi tiết (tùy chọn)
              </label>
              <textarea
                id="review"
                name="review"
                value={formData.review}
                onChange={handleInputChange}
                placeholder={formData.satisfied
                  ? 'Ví dụ: Người bán phản hồi nhanh, sản phẩm đúng như mô tả và đóng gói rất cẩn thận.'
                  : 'Ví dụ: Sản phẩm chưa đúng kỳ vọng ở điểm nào, người bán xử lý ra sao, bạn mong muốn cải thiện điều gì.'}
                rows="4"
                className={errors.review ? 'error' : ''}
              />
              {errors.review && <span className="error-message">{errors.review}</span>}
              <div className="character-count">
                {buildReviewComment().length}/500 ký tự
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="review-evidence">Ảnh/Video minh chứng (tùy chọn)</label>
              <input
                id="review-evidence"
                type="file"
                accept=".png,.jpg,.jpeg,.mp4,image/png,image/jpeg,video/mp4"
                multiple
                onChange={handleReviewEvidenceUpload}
                disabled={loading || uploadingEvidence || reviewEvidenceFiles.length >= 5}
                className="review-evidence-input"
              />
              <div className="form-helper-text">
                Chuẩn tốt nhất: MP4 (H.264). Ảnh bắt buộc PNG/JPEG/JPG. Tối đa 5 tệp.
              </div>
              <div className="form-helper-text">
                Giới hạn mỗi tệp: ≤ 100MB, video ≤ 3 phút, 720p-1080p.
              </div>
              <div className="form-helper-text">
                Video bắt buộc là quay mở hộp liên tục, không chỉnh sửa.
              </div>
              {uploadingEvidence && <div className="form-helper-text">Đang upload tệp...</div>}
              {errors.evidence && <span className="error-message">{errors.evidence}</span>}

              {reviewEvidenceFiles.length > 0 && (
                <div className="review-evidence-grid">
                  {reviewEvidenceFiles.map((file, index) => (
                    <div key={`${file}-${index}`} className="review-evidence-item">
                      {isVideoEvidence(file) ? (
                        <video src={getImageUrl(file)} controls className="review-evidence-media" />
                      ) : (
                        <img src={getImageUrl(file)} alt={`review-evidence-${index}`} className="review-evidence-media" />
                      )}
                      <button
                        type="button"
                        className="review-evidence-remove"
                        onClick={() => removeReviewEvidence(index)}
                        disabled={loading}
                        aria-label="Xóa tệp bằng chứng"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
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