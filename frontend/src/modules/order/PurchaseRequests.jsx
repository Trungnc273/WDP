import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getReceivedPurchaseRequests, acceptPurchaseRequest, rejectPurchaseRequest } from '../../services/order.service';
import { getImageUrl } from '../../utils/imageHelper';
import './PurchaseRequests.css';

const PurchaseRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getReceivedPurchaseRequests();
      const rawRequests = Array.isArray(data)
        ? data
        : data?.data?.requests || data?.requests || [];

      const normalizedRequests = rawRequests.map((request) => ({
        ...request,
        listing: request.listing || request.listingId || null,
        buyer: request.buyer || request.buyerId || null,
        seller: request.seller || request.sellerId || null
      }));

      setRequests(normalizedRequests);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách yêu cầu');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, action) => {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    
    try {
      if (action === 'accept') {
        await acceptPurchaseRequest(requestId);
      } else {
        await rejectPurchaseRequest(requestId);
      }
      
      // Refresh the list
      await fetchRequests();
      
      setShowConfirmModal(null);
      
      const message = action === 'accept' 
        ? 'Đã chấp nhận yêu cầu mua hàng thành công!'
        : 'Đã từ chối yêu cầu mua hàng!';
      alert(message);
      
    } catch (err) {
      alert(err.message || `Không thể ${action === 'accept' ? 'chấp nhận' : 'từ chối'} yêu cầu`);
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Chờ xử lý',
      'accepted': 'Đã chấp nhận',
      'rejected': 'Đã từ chối'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      'pending': 'status-pending',
      'accepted': 'status-accepted',
      'rejected': 'status-rejected'
    };
    return classMap[status] || '';
  };

  if (loading) {
    return (
      <div className="purchase-requests-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="purchase-requests-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchRequests} className="btn btn-primary">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="purchase-requests-container">
      <div className="page-header">
        <h1>Yêu cầu mua hàng</h1>
        <p>Quản lý các yêu cầu mua hàng từ khách hàng</p>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>Chưa có yêu cầu mua hàng nào</h3>
          <p>Khi có khách hàng quan tâm đến sản phẩm của bạn, yêu cầu sẽ hiển thị ở đây.</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <div className="product-info">
                  <div className="product-image">
                    <img 
                      src={getImageUrl(request.listing?.images?.[0]) || '/placeholder-image.jpg'} 
                      alt={request.listing?.title}
                    />
                  </div>
                  <div className="product-details">
                    <h3>{request.listing?.title}</h3>
                    <p className="product-price">
                      Giá niêm yết: {formatPrice(request.listing?.price)}
                    </p>
                  </div>
                </div>
                <div className={`request-status ${getStatusClass(request.status)}`}>
                  {getStatusText(request.status)}
                </div>
              </div>

              <div className="buyer-info">
                <div className="buyer-avatar">
                  {request.buyer?.avatar ? (
                    <img src={getImageUrl(request.buyer.avatar)} alt={request.buyer.fullName} />
                  ) : (
                    <div className="avatar-placeholder">
                      {request.buyer?.fullName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="buyer-details">
                  <div className="buyer-name">
                    {request.buyer?.fullName}
                    {request.buyer?.isVerified && (
                      <span className="verified-badge" title="Đã xác thực">✓</span>
                    )}
                  </div>
                  <div className="request-date">
                    Gửi yêu cầu: {formatDate(request.createdAt)}
                  </div>
                </div>
              </div>

              <div className="request-content">
                <div className="price-offer">
                  <span className="label">Giá đề nghị:</span>
                  <span className="price">{formatPrice(request.agreedPrice)}</span>
                  {request.agreedPrice !== request.listing?.price && (
                    <span className="price-diff">
                      ({request.agreedPrice < request.listing?.price ? '-' : '+'}
                      {formatPrice(Math.abs(request.agreedPrice - request.listing?.price))})
                    </span>
                  )}
                </div>
                
                <div className="request-message">
                  <span className="label">Tin nhắn:</span>
                  <p>{request.message}</p>
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="request-actions">
                  <button
                    className="btn btn-danger"
                    onClick={() => setShowConfirmModal({ id: request._id, action: 'reject' })}
                    disabled={actionLoading[request._id]}
                  >
                    {actionLoading[request._id] ? 'Đang xử lý...' : 'Từ chối'}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowConfirmModal({ id: request._id, action: 'accept' })}
                    disabled={actionLoading[request._id]}
                  >
                    {actionLoading[request._id] ? 'Đang xử lý...' : 'Chấp nhận'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {showConfirmModal.action === 'accept' ? 'Chấp nhận yêu cầu' : 'Từ chối yêu cầu'}
            </h3>
            <p>
              {showConfirmModal.action === 'accept' 
                ? 'Bạn có chắc chắn muốn chấp nhận yêu cầu mua hàng này? Một đơn hàng sẽ được tạo và khách hàng có thể thanh toán.'
                : 'Bạn có chắc chắn muốn từ chối yêu cầu mua hàng này?'
              }
            </p>
            <div className="modal-actions">
              <button 
                onClick={() => setShowConfirmModal(null)} 
                className="btn btn-secondary"
                disabled={actionLoading[showConfirmModal.id]}
              >
                Hủy
              </button>
              <button 
                onClick={() => handleAction(showConfirmModal.id, showConfirmModal.action)}
                className={`btn ${showConfirmModal.action === 'accept' ? 'btn-primary' : 'btn-danger'}`}
                disabled={actionLoading[showConfirmModal.id]}
              >
                {actionLoading[showConfirmModal.id] ? 'Đang xử lý...' : 
                  (showConfirmModal.action === 'accept' ? 'Chấp nhận' : 'Từ chối')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequests;