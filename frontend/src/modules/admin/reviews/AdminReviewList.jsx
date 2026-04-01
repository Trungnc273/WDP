import React, { useState, useEffect } from 'react';
import { getModeratorReviews, markBadModeratorReview } from '../../../services/moderator.service';
import { getImageUrl } from '../../../utils/imageHelper';
import '../AdminModules.css';

const AdminReviewList = () => {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [filters, setFilters] = useState({ status: '', keyword: '' });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [message, setMessage] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMarkBadModal, setShowMarkBadModal] = useState(false);
  const [moderatorNote, setModeratorNote] = useState('');
  const [markingReviewId, setMarkingReviewId] = useState('');

  const fetchReviews = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const result = await getModeratorReviews({
        page,
        limit: pageSize,
        status: filters.status || undefined
      });
      
      setReviews(result.items);
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.limit,
        total: result.pagination.total
      });
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Không thể tải đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({ status: '', keyword: '' });
    fetchReviews(1, pagination.pageSize);
  };

  useEffect(() => {
    fetchReviews(1, pagination.pageSize);
  }, [filters.status]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderRatingStars = (rating = 0) => {
    const rounded = Math.max(0, Math.min(5, Number(rating || 0)));
    return (
      <span style={{ color: '#f59e0b', letterSpacing: 2, fontSize: 16 }}>
        {'★'.repeat(rounded)}
        <span style={{ color: '#d1d5db' }}>{'★'.repeat(5 - rounded)}</span>
      </span>
    );
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

  const openDetailModal = (review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedReview(null);
  };

  const openMarkBadModal = (review) => {
    if (review?.moderatorAssessment?.isBad) {
      setMessage('Review này đã được đánh giá xấu trước đó');
      return;
    }
    setSelectedReview(review);
    setModeratorNote('Review phản ánh chất lượng phục vụ kém, cần xử lý tài khoản người bán');
    setShowMarkBadModal(true);
  };

  const closeMarkBadModal = () => {
    if (markingReviewId) return;
    setShowMarkBadModal(false);
    setSelectedReview(null);
    setModeratorNote('');
  };

  const submitMarkBad = async () => {
    const reviewId = selectedReview?._id;
    if (!reviewId) return;

    const normalizedNote = String(moderatorNote || '').trim();
    if (normalizedNote.length < 10) {
      setMessage('Vui lòng nhập nội dung gửi người bán tối thiểu 10 ký tự');
      return;
    }

    try {
      setMarkingReviewId(reviewId);
      const result = await markBadModeratorReview(reviewId, normalizedNote);
      const penalty = result?.sellerPenalty;
      const resultMessage = penalty?.shouldSuspendNow
        ? `Đã đánh giá xấu người bán. Mức xử lý: ${penalty?.suspensionLabel || 'đã khóa tài khoản'}`
        : `Đã đánh giá xấu người bán. Chưa khóa tài khoản, đang tích lũy mốc 3 lần.`;
      setMessage(resultMessage);
      setShowMarkBadModal(false);
      setSelectedReview(null);
      setModeratorNote('');
      fetchReviews(pagination.current, pagination.pageSize);
    } catch (error) {
      setMessage(error.message || 'Không thể đánh giá xấu review này');
    } finally {
      setMarkingReviewId('');
    }
  };

  const getNextPenaltyPreview = (review) => {
    const nextCount = Number(review?.reviewedUserId?.modBadReviewCount || 0) + 1;
    const nextLevel = Math.min(Math.floor(nextCount / 3), 3);
    const shouldSuspendNow = nextCount % 3 === 0;

    if (!shouldSuspendNow) {
      return {
        level: nextLevel,
        label: 'Chưa khóa tài khoản (đang tích lũy cảnh cáo)',
        milestone: 3 - (nextCount % 3)
      };
    }

    if (nextLevel === 1) return { level: 1, label: 'Khóa 24 giờ', milestone: 0 };
    if (nextLevel === 2) return { level: 2, label: 'Khóa 1 tuần', milestone: 0 };
    return { level: 3, label: 'Khóa 1 năm', milestone: 0 };
  };

  const filteredReviews = filters.keyword
    ? reviews.filter((r) => {
        const name = (r.reviewerId?.fullName || '').toLowerCase();
        const product = (r.productId?.title || '').toLowerCase();
        const comment = (r.comment || '').toLowerCase();
        const kw = filters.keyword.toLowerCase();
        return name.includes(kw) || product.includes(kw) || comment.includes(kw);
      })
    : reviews;

  return (
    <div className="admin-module">
      <div className="admin-module__header">
        <h1>Quản lý đánh giá</h1>
        <p>Theo dõi và xử lý đánh giá từ người dùng</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('thành công') || message.includes('Đã đánh giá') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div className="admin-module__filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Tìm theo tên, sản phẩm, nội dung..."
            value={filters.keyword}
            onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            className="filter-input"
          />
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="filter-select"
          >
            <option value="">Tất cả</option>
            <option value="reported">Bị báo cáo</option>
            <option value="active">Đang hiển thị</option>
            <option value="hidden">Đã ẩn</option>
          </select>

          <div className="filter-actions">
            <button 
              className="btn btn-primary"
              onClick={() => fetchReviews(1, pagination.pageSize)}
            >
              <i className="fas fa-search"></i>
              Lọc
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleResetFilters}
            >
              <i className="fas fa-redo"></i>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="admin-module__content">
        {loading ? (
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i>
            Đang tải...
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="reviews-table">
                <thead>
                  <tr>
                    <th style={{width: '140px'}}>Người dùng</th>
                    <th style={{width: '180px'}}>Sản phẩm</th>
                    <th style={{width: '120px', textAlign: 'right'}}>Giá đơn</th>
                    <th style={{width: '100px'}}>Điểm đánh giá</th>
                    <th style={{width: '200px'}}>Nội dung</th>
                    <th style={{width: '100px'}}>Trạng thái</th>
                    <th style={{width: '140px'}}>Đánh giá mod</th>
                    <th style={{width: '160px'}}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-data">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    filteredReviews.map((review) => (
                      <tr key={review._id}>
                        <td>
                          <div style={{fontWeight: '500'}}>
                            {review.reviewerId?.fullName || 'N/A'}
                          </div>
                        </td>
                        <td>
                          <div style={{
                            maxWidth: '180px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {review.productId?.title || 'N/A'}
                          </div>
                        </td>
                        <td style={{textAlign: 'right', fontWeight: '600', color: '#52c41a'}}>
                          {formatCurrency(review.orderId?.agreedAmount)}
                        </td>
                        <td>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#f59e0b',
                            fontWeight: '500'
                          }}>
                            <span>{review.rating || 0}</span>
                            <span style={{fontSize: '12px'}}>★</span>
                          </div>
                        </td>
                        <td>
                          <div style={{
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '13px'
                          }}>
                            {review.comment || '(Không có nội dung)'}
                          </div>
                        </td>
                        <td>
                          <span className={`status status-${review.status}`}>
                            {review.status === 'reported' ? 'Bị báo cáo' : 
                             review.status === 'hidden' ? 'Đã ẩn' : 'Bình thường'}
                          </span>
                        </td>
                        <td>
                          <span className={`status ${review?.moderatorAssessment?.isBad ? 'status-bad' : 'status-pending'}`}>
                            {review?.moderatorAssessment?.isBad 
                              ? `Đã đánh giá xấu (Mức ${review?.moderatorAssessment?.penaltyLevel || 1})`
                              : 'Chưa đánh giá'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => openDetailModal(review)}
                            >
                              <i className="fas fa-eye"></i>
                              Chi tiết
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => openMarkBadModal(review)}
                              disabled={review?.moderatorAssessment?.isBad || markingReviewId === review._id}
                            >
                              {markingReviewId === review._id ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <i className="fas fa-exclamation-triangle"></i>
                              )}
                              Đánh giá xấu
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination.total > pagination.pageSize && (
              <div className="pagination">
                <button
                  className="btn btn-sm"
                  onClick={() => fetchReviews(pagination.current - 1, pagination.pageSize)}
                  disabled={pagination.current === 1}
                >
                  Trước
                </button>
                
                <span className="page-info">
                  Trang {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize)}
                </span>
                
                <button
                  className="btn btn-sm"
                  onClick={() => fetchReviews(pagination.current + 1, pagination.pageSize)}
                  disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReview && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết đánh giá</h3>
              <button className="modal-close" onClick={closeDetailModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="review-detail">
                <div className="review-status-tags">
                  <span className={`status status-${selectedReview.status}`}>
                    {selectedReview.status === 'reported' ? 'Bị báo cáo' : 
                     selectedReview.status === 'hidden' ? 'Đã ẩn' : 'Bình thường'}
                  </span>
                  <span className={`status ${selectedReview?.moderatorAssessment?.isBad ? 'status-bad' : 'status-pending'}`}>
                    {selectedReview?.moderatorAssessment?.isBad
                      ? `Mod đã đánh giá xấu (Mức ${selectedReview?.moderatorAssessment?.penaltyLevel || 1})`
                      : 'Chưa có đánh giá xấu từ mod'}
                  </span>
                </div>

                <div className="review-product-info">
                  <h4>{selectedReview.productId?.title || 'Sản phẩm'}</h4>
                  <p>Người bán: <strong>{selectedReview.reviewedUserId?.fullName || 'N/A'}</strong></p>
                  <p>Giá đơn: <strong className="currency">{formatCurrency(selectedReview.orderId?.agreedAmount)}</strong></p>
                  <div className="rating-display">
                    {renderRatingStars(selectedReview.rating)}
                    <span>{selectedReview.rating || 0}/5 sao</span>
                  </div>
                </div>

                <div className="review-details-grid">
                  <div className="detail-item">
                    <label>Người đánh giá:</label>
                    <span>{selectedReview.reviewerId?.fullName || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Người được đánh giá:</label>
                    <span>{selectedReview.reviewedUserId?.fullName || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Số lần bị mod đánh xấu:</label>
                    <span>{selectedReview.reviewedUserId?.modBadReviewCount || 0}</span>
                  </div>
                  <div className="detail-item">
                    <label>Khóa tài khoản đến:</label>
                    <span>{formatDateTime(selectedReview.reviewedUserId?.suspendedUntil)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Ngày tạo:</label>
                    <span>{formatDateTime(selectedReview.createdAt)}</span>
                  </div>
                  {selectedReview?.moderatorAssessment?.isBad && (
                    <div className="detail-item full-width">
                      <label>Ghi chú moderator:</label>
                      <span>{selectedReview?.moderatorAssessment?.note || 'N/A'}</span>
                    </div>
                  )}
                  <div className="detail-item full-width">
                    <label>Nội dung:</label>
                    <span>{selectedReview.comment || '(Không có nội dung)'}</span>
                  </div>
                  {extractReviewMediaFiles(selectedReview).length > 0 && (
                    <div className="detail-item full-width">
                      <label>Ảnh/video đính kèm:</label>
                      <div className="review-evidence-grid">
                        {extractReviewMediaFiles(selectedReview).map((file, index) => (
                          <div key={`${file}-${index}`} className="review-evidence-item">
                            {isVideoEvidence(file) ? (
                              <video src={getImageUrl(file)} controls className="review-evidence-media" />
                            ) : (
                              <img src={getImageUrl(file)} alt={`review-evidence-${index}`} className="review-evidence-media" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDetailModal}>
                Đóng
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  closeDetailModal();
                  openMarkBadModal(selectedReview);
                }}
                disabled={selectedReview?.moderatorAssessment?.isBad}
              >
                <i className="fas fa-exclamation-triangle"></i>
                Đánh giá xấu người bán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Bad Modal */}
      {showMarkBadModal && selectedReview && (
        <div className="modal-overlay" onClick={closeMarkBadModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đánh giá xấu người bán</h3>
              <button className="modal-close" onClick={closeMarkBadModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="penalty-preview">
                <div className="alert alert-warning">
                  <strong>Xử lý tại mốc kế tiếp: {getNextPenaltyPreview(selectedReview).label}</strong>
                  <p>
                    {getNextPenaltyPreview(selectedReview).milestone > 0
                      ? `Lần đánh giá xấu thứ ${Number(selectedReview?.reviewedUserId?.modBadReviewCount || 0) + 1} cho người bán ${selectedReview?.reviewedUserId?.fullName || ''}. Cần thêm ${getNextPenaltyPreview(selectedReview).milestone} lần nữa để kích hoạt khóa.`
                      : `Lần đánh giá xấu thứ ${Number(selectedReview?.reviewedUserId?.modBadReviewCount || 0) + 1} cho người bán ${selectedReview?.reviewedUserId?.fullName || ''} sẽ kích hoạt khóa tài khoản.`}
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label>Nội dung gửi cho người bán</label>
                <textarea
                  rows={5}
                  maxLength={500}
                  value={moderatorNote}
                  onChange={(e) => setModeratorNote(e.target.value)}
                  placeholder="Nhập nội dung phản hồi để gửi trực tiếp cho người bán"
                  className="form-control"
                />
                <div className="char-count">
                  {String(moderatorNote || '').trim().length}/500
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeMarkBadModal}>
                Hủy
              </button>
              <button
                className="btn btn-danger"
                onClick={submitMarkBad}
                disabled={markingReviewId === selectedReview?._id}
              >
                {markingReviewId === selectedReview?._id ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-exclamation-triangle"></i>
                )}
                Gửi đánh giá xấu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewList;