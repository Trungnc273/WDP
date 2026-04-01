import React, { useState, useEffect } from 'react';
import { getReviews, getRatingStats } from '../../services/review.service';
import { getImageUrl } from '../../utils/imageHelper';
import './ReviewList.css';

const ReviewList = ({ userId, showStats = true }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRating, setSelectedRating] = useState('');

  useEffect(() => {
    fetchReviews();
    if (showStats) {
      fetchStats();
    }
  }, [userId, currentPage, selectedRating]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const filters = selectedRating ? { rating: selectedRating } : {};
      const pagination = { page: currentPage, limit: 10 };
      
      const response = await getReviews(userId, filters, pagination);
      setReviews(response.data.reviews);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      setError('Không thể tải đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getRatingStats(userId);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching rating stats:', error);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rating ? 'filled' : ''}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isVideoEvidence = (url = '') => /\.(mp4)$/i.test(url);

  const extractReviewMediaFiles = (review) => {
    const candidates = [
      review?.evidenceFiles,
      review?.evidenceImages,
      review?.media,
      review?.attachments,
      review?.data?.evidenceFiles,
      review?.data?.evidenceImages
    ];

    const merged = candidates
      .filter(Array.isArray)
      .flat()
      .map((item) => String(item || '').trim())
      .filter(Boolean);

    return Array.from(new Set(merged));
  };



  if (loading && currentPage === 1) {
    return <div className="loading">Đang tải đánh giá...</div>;
  }

  return (
    <div className="review-list">
      {showStats && stats && (
        <div className="rating-summary">
          <div className="overall-rating">
            <div className="rating-score">
              <span className="score">{stats.averageRating.toFixed(1)}</span>
              <div className="stars">
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <span className="total-reviews">
                ({stats.totalReviews} đánh giá)
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="review-filters">
        <select 
          value={selectedRating} 
          onChange={(e) => {
            setSelectedRating(e.target.value);
            setCurrentPage(1);
          }}
          className="rating-filter"
        >
          <option value="">Tất cả đánh giá</option>
          <option value="5">5 sao</option>
          <option value="4">4 sao</option>
          <option value="3">3 sao</option>
          <option value="2">2 sao</option>
          <option value="1">1 sao</option>
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="reviews">
        {reviews.length === 0 ? (
          <div className="no-reviews">
            {selectedRating ? 
              `Không có đánh giá ${selectedRating} sao` : 
              'Chưa có đánh giá nào'
            }
          </div>
        ) : (
          reviews.map(review => (
            <div key={review._id} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <img 
                    src={review.reviewerId?.avatar || '/default-avatar.png'} 
                    alt={review.reviewerId?.fullName}
                    className="reviewer-avatar"
                  />
                  <div className="reviewer-details">
                    <span className="reviewer-name">
                      {review.reviewerId?.fullName}
                    </span>
                    <div className="review-rating">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </div>
                <span className="review-date">
                  {formatDate(review.createdAt)}
                </span>
              </div>

              {review.comment && (
                <div className="review-comment">
                  {review.comment}
                </div>
              )}

              {extractReviewMediaFiles(review).length > 0 && (
                <div className="review-evidence-grid">
                  {extractReviewMediaFiles(review).map((file, index) => (
                    <div key={`${file}-${index}`} className="review-evidence-item">
                      {isVideoEvidence(file) ? (
                        <video src={getImageUrl(file)} controls className="review-evidence-media" />
                      ) : (
                        <img src={getImageUrl(file)} alt={`review-evidence-${index}`} className="review-evidence-media" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {review.productId && (
                <div className="reviewed-product">
                  <img 
                    src={getImageUrl(review.productId.images?.[0]) || '/images/placeholder.png'} 
                    alt={review.productId.title}
                    className="product-thumb"
                  />
                  <span className="product-title">
                    {review.productId.title}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="page-btn"
          >
            Trước
          </button>
          
          <span className="page-info">
            Trang {currentPage} / {totalPages}
          </span>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;