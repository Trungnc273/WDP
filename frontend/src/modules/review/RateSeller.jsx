import React, { useState } from 'react';
import { createReview } from '../../services/review.service';
import { getImageUrl } from '../../utils/imageHelper';
import './RateSeller.css';

const RateSeller = ({ order, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Vui lòng chọn số sao đánh giá');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createReview(order._id, rating, comment);
      onSuccess && onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className={`star ${i <= (hoveredRating || rating) ? 'active' : ''}`}
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(0)}
        >
          ★
        </button>
      );
    }
    return stars;
  };

  const getRatingText = (rating) => {
    const texts = {
      1: 'Rất không hài lòng',
      2: 'Không hài lòng',
      3: 'Bình thường',
      4: 'Hài lòng',
      5: 'Rất hài lòng'
    };
    return texts[rating] || '';
  };

  return (
    <div className="rate-seller-modal">
      <div className="rate-seller-content">
        <div className="rate-seller-header">
          <h3>Đánh giá người bán</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="order-info">
          <div className="product-info">
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
              <h4>{order.listing?.title}</h4>
              <p className="price">{order.agreedPrice?.toLocaleString('vi-VN')} VNĐ</p>
            </div>
          </div>
          
          <div className="seller-info">
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

        <form onSubmit={handleSubmit} className="rating-form">
          <div className="rating-section">
            <label>Đánh giá của bạn:</label>
            <div className="stars-container">
              {renderStars()}
              <span className="rating-text">
                {getRatingText(hoveredRating || rating)}
              </span>
            </div>
          </div>

          <div className="comment-section">
            <label htmlFor="comment">Nhận xét (tùy chọn):</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về người bán này..."
              rows="4"
              maxLength="500"
            />
            <div className="char-count">{comment.length}/500</div>
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
              disabled={loading || rating === 0}
            >
              {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RateSeller;