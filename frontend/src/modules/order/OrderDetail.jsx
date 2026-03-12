import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getOrderById } from '../../services/order.service';
import { canReviewOrder, getReviewByOrderId } from '../../services/review.service';
import { getDisputeByOrderId, addSellerResponse, addBuyerFollowUp, confirmSellerReturn, uploadEvidenceMedia } from '../../services/report.service';
import { getImageUrl } from '../../utils/imageHelper';
import ShipOrder from './ShipOrder';
import ConfirmReceipt from './ConfirmReceipt';
import RateSeller from '../review/RateSeller';
import Dispute from '../report/Dispute';
import './OrderDetail.css';

const AVATAR_PLACEHOLDER = '/images/placeholders/avatar-placeholder.svg';

const UserAvatar = ({ avatar, fullName }) => {
  const [imgError, setImgError] = useState(false);
  const src = (!avatar || imgError) ? AVATAR_PLACEHOLDER : getImageUrl(avatar);

  return (
    <img
      src={src}
      alt={fullName || 'Người dùng'}
      onError={() => setImgError(true)}
    />
  );
};

const conditionLabels = {
  new: 'Mới',
  like_new: 'Như mới',
  good: 'Tốt',
  fair: 'Khá',
  poor: 'Kém'
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeMode, setDisputeMode] = useState('normal');
  const [canReview, setCanReview] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [dispute, setDispute] = useState(null);
  const [showSellerResponseModal, setShowSellerResponseModal] = useState(false);
  const [showBuyerFollowUpModal, setShowBuyerFollowUpModal] = useState(false);
  const [showConfirmReturnModal, setShowConfirmReturnModal] = useState(false);
  const [sellerResponseText, setSellerResponseText] = useState('');
  const [sellerEvidenceImages, setSellerEvidenceImages] = useState([]);
  const [buyerFollowUpText, setBuyerFollowUpText] = useState('');
  const [buyerFollowUpEvidence, setBuyerFollowUpEvidence] = useState([]);
  const [sellerResponseLoading, setSellerResponseLoading] = useState(false);
  const [buyerFollowUpLoading, setBuyerFollowUpLoading] = useState(false);
  const [confirmReturnLoading, setConfirmReturnLoading] = useState(false);
  const [sellerResponseError, setSellerResponseError] = useState('');
  const [buyerFollowUpError, setBuyerFollowUpError] = useState('');

  const isVideoEvidence = (url = '') => /\.(mp4|mov|webm|avi|mkv)$/i.test(url);

  const renderEvidencePreview = (files = []) => {
    if (!files.length) return null;

    return (
      <div className="evidence-preview-grid">
        {files.map((file, index) => (
          <div key={`${file}-${index}`} className="evidence-preview-item">
            {isVideoEvidence(file) ? (
              <video src={getImageUrl(file)} controls className="evidence-preview-media" />
            ) : (
              <img src={getImageUrl(file)} alt={`evidence-${index}`} className="evidence-preview-media" />
            )}
          </div>
        ))}
      </div>
    );
  };

  const orderStatuses = {
    'pending': 'Chờ thanh toán',
    'paid': 'Đã thanh toán',
    'shipped': 'Đã giao hàng',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy',
    'disputed': 'Tranh chấp'
  };

  const statusColors = {
    'pending': 'status-pending',
    'paid': 'status-paid',
    'shipped': 'status-shipped',
    'completed': 'status-completed',
    'cancelled': 'status-cancelled',
    'disputed': 'status-disputed'
  };

  const disputeReasonLabels = {
    not_as_described: 'Không đúng mô tả',
    damaged: 'Sản phẩm bị hỏng/hư hại',
    not_received: 'Không nhận được hàng',
    counterfeit: 'Hàng giả/hàng nhái',
    return_request: 'Yêu cầu hoàn hàng',
    other: 'Lý do khác'
  };

  const disputeResolutionLabels = {
    refund: 'Hoàn tiền cho người mua',
    release: 'Nhả tiền cho người bán'
  };

  const translateCancellationReason = (reason = '') => {
    if (!reason) return '';

    const normalized = String(reason).trim();
    const map = {
      'Dispute resolved: refund to buyer': 'Tranh chấp đã xử lý: Hoàn tiền cho người mua',
      'Dispute resolved: release to seller': 'Tranh chấp đã xử lý: Nhả tiền cho người bán',
      'Buyer confirmed receipt': 'Người mua đã xác nhận nhận hàng',
      'Auto-release after 10 days': 'Tự động nhả tiền sau 10 ngày',
      'Hủy bởi Moderator. Lý do:': 'Hủy bởi quản trị viên. Lý do:'
    };

    if (normalized.startsWith('Hủy bởi Moderator. Lý do:')) {
      return normalized.replace('Hủy bởi Moderator. Lý do:', 'Hủy bởi quản trị viên. Lý do:');
    }

    return map[normalized] || normalized;
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (order && isBuyer()) {
      checkReviewStatus();
    }
    if (order) {
      fetchDispute();
    }
  }, [order]);

  useEffect(() => {
    if (!order || !user) return;
    if (!isBuyer() || order.status !== 'shipped') return;

    const params = new URLSearchParams(location.search);
    const action = params.get('action');

    if (action === 'dispute') {
      setDisputeMode('normal');
      setShowDisputeModal(true);
    }

    if (action === 'return') {
      setDisputeMode('return');
      setShowDisputeModal(true);
    }
  }, [order, user, location.search]);

  useEffect(() => {
    if (!order || !user || !dispute) return;
    if (!isBuyer() || order.status !== 'disputed') return;

    const params = new URLSearchParams(location.search);
    const action = params.get('action');

    if (action === 'followup' && dispute.status !== 'resolved') {
      setShowBuyerFollowUpModal(true);
    }
  }, [order, user, dispute, location.search]);

  useEffect(() => {
    if (!order || !user || !dispute) return;
    if (!isSeller() || order.status !== 'disputed') return;

    const params = new URLSearchParams(location.search);
    const action = params.get('action');

    if (action === 'seller-evidence' && dispute.status !== 'resolved' && dispute.reason !== 'return_request') {
      setShowSellerResponseModal(true);
    }
  }, [order, user, dispute, location.search]);

  const fetchDispute = async () => {
    try {
      const response = await getDisputeByOrderId(order._id);
      setDispute(response.data);
    } catch (e) {
      // Dispute not yet created or no access
    }
  };

  const handleSellerResponseSubmit = async () => {
    if (!sellerResponseText.trim()) {
      setSellerResponseError('Vui lòng nhập phản hồi');
      return;
    }
    setSellerResponseLoading(true);
    setSellerResponseError('');
    try {
      await addSellerResponse(dispute._id, sellerResponseText.trim(), sellerEvidenceImages);
      setShowSellerResponseModal(false);
      setSellerResponseText('');
      setSellerEvidenceImages([]);
      fetchDispute();
      alert('Đã gửi phản hồi khiếu nại thành công.');
    } catch (e) {
      setSellerResponseError(e.message || 'Có lỗi xảy ra');
    } finally {
      setSellerResponseLoading(false);
    }
  };

  const handleSellerEvidenceUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      const paths = await uploadEvidenceMedia(files.slice(0, 5 - sellerEvidenceImages.length));
      setSellerEvidenceImages(prev => [...prev, ...paths].slice(0, 5));
    } catch (err) {
      setSellerResponseError(err.message || 'Không thể upload bằng chứng');
    }
    e.target.value = '';
  };

  const handleBuyerFollowUpUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      const remainingSlots = Math.max(0, 5 - buyerFollowUpEvidence.length);
      const paths = await uploadEvidenceMedia(files.slice(0, remainingSlots));
      setBuyerFollowUpEvidence(prev => [...prev, ...paths].slice(0, 5));
    } catch (err) {
      setBuyerFollowUpError(err.message || 'Không thể upload bằng chứng');
    }

    e.target.value = '';
  };

  const handleBuyerFollowUpSubmit = async () => {
    if (!buyerFollowUpText.trim() && buyerFollowUpEvidence.length === 0) {
      setBuyerFollowUpError('Vui lòng nhập ghi chú hoặc tải lên ít nhất 1 bằng chứng');
      return;
    }

    setBuyerFollowUpLoading(true);
    setBuyerFollowUpError('');
    try {
      await addBuyerFollowUp(dispute._id, buyerFollowUpText.trim(), buyerFollowUpEvidence);
      setShowBuyerFollowUpModal(false);
      setBuyerFollowUpText('');
      setBuyerFollowUpEvidence([]);
      await fetchDispute();
      alert('Đã gửi bổ sung bằng chứng cho moderator.');
    } catch (e) {
      setBuyerFollowUpError(e.message || 'Có lỗi xảy ra');
    } finally {
      setBuyerFollowUpLoading(false);
    }
  };

  const handleConfirmReturn = async () => {
    setConfirmReturnLoading(true);
    try {
      await confirmSellerReturn(dispute._id);
      setShowConfirmReturnModal(false);
      fetchDispute();
      alert('Đã xác nhận nhận lại hàng. Moderator sẽ tiến hành hoàn tiền cho người mua.');
    } catch (e) {
      alert(e.message || 'Có lỗi xảy ra');
    } finally {
      setConfirmReturnLoading(false);
    }
  };

  const checkReviewStatus = async () => {
    try {
      // Kiem tra nguoi dung co the danh gia khong
      const canReviewResponse = await canReviewOrder(order._id);
      setCanReview(canReviewResponse.data.canReview);
      
      // Kiem tra da ton tai danh gia hay chua
      const existingReviewResponse = await getReviewByOrderId(order._id);
      setExistingReview(existingReviewResponse.data);
    } catch (error) {
      console.error('Error checking review status:', error);
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await getOrderById(id);
      setOrder(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleShipSuccess = () => {
    setShowShipModal(false);
    fetchOrder(); // Tai lai du lieu don hang
    alert('Xác nhận giao hàng thành công!');
  };

  const handleReceiptSuccess = () => {
    setShowReceiptModal(false);
    fetchOrder(); // Tai lai du lieu don hang
    checkReviewStatus(); // Kiem tra da co the danh gia chua
    alert('Xác nhận nhận hàng thành công! Tiền đã được chuyển cho người bán.');
  };

  const handleRatingSuccess = () => {
    setShowRatingModal(false);
    checkReviewStatus(); // Tai lai trang thai danh gia
    alert('Đánh giá thành công! Cảm ơn bạn đã chia sẻ trải nghiệm.');
  };

  const handleDisputeSuccess = () => {
    setShowDisputeModal(false);
    fetchOrder(); // Refresh order data
    if (disputeMode === 'return') {
      alert('Yêu cầu hoàn hàng đã được tạo thành công. Moderator sẽ liên hệ và hướng dẫn các bước tiếp theo.');
      return;
    }
    alert('Khiếu nại đã được tạo thành công. Chúng tôi sẽ xem xét và phản hồi trong 3-7 ngày làm việc.');
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNormalizedUserId = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    return value._id || value.id || value.userId || null;
  };

  const getStatusTimeline = () => {
    const timeline = [
      {
        key: 'created',
        label: 'Đơn hàng được tạo',
        date: order.createdAt,
        completed: true,
        variant: 'normal'
      },
      {
        key: 'pending-payment',
        label: 'Chờ thanh toán',
        date: order.createdAt,
        completed: true,
        variant: 'normal'
      },
      {
        key: 'paid',
        label: 'Đã thanh toán',
        date: order.paidAt,
        completed: !!order.paidAt,
        variant: 'normal'
      },
      {
        key: 'shipped',
        label: 'Đã giao hàng',
        date: order.shippedAt,
        completed: !!order.shippedAt,
        variant: 'normal'
      }
    ];

    // Dispute history events are injected directly into order timeline.
    if (order.status === 'disputed' || dispute) {
      timeline.push({
        key: 'dispute-created',
        label: dispute?.reason === 'return_request' ? 'Đã tạo yêu cầu hoàn hàng' : 'Đã tạo khiếu nại',
        date: dispute?.createdAt,
        completed: true,
        variant: 'dispute'
      });

      timeline.push({
        key: 'dispute-investigating',
        label: 'Quản trị viên tiếp nhận và điều tra',
        date: dispute?.investigatingAt,
        completed: dispute?.status === 'investigating' || dispute?.status === 'resolved',
        isCurrent: dispute?.status === 'pending',
        variant: 'dispute'
      });

      timeline.push({
        key: 'seller-evidence',
        label: 'Người bán bổ sung phản hồi/bằng chứng',
        date: dispute?.sellerResponse ? dispute?.updatedAt : null,
        completed: !!(dispute?.sellerResponse || dispute?.sellerEvidenceImages?.length),
        variant: 'dispute'
      });

      timeline.push({
        key: 'buyer-followup',
        label: 'Người mua bổ sung bằng chứng',
        date: dispute?.buyerFollowUpUpdatedAt,
        completed: !!(dispute?.buyerFollowUpNote || dispute?.buyerAdditionalEvidenceImages?.length),
        variant: 'dispute'
      });

      if (dispute?.reason === 'return_request') {
        timeline.push({
          key: 'seller-confirm-return',
          label: 'Người bán xác nhận đã nhận lại hàng',
          date: dispute?.sellerConfirmedReturnAt,
          completed: !!dispute?.sellerConfirmedReturnAt,
          variant: 'dispute'
        });
      }

      timeline.push({
        key: 'dispute-resolved',
        label: 'Khiếu nại đã được xử lý',
        date: dispute?.resolvedAt,
        completed: dispute?.status === 'resolved',
        isCurrent: dispute?.status === 'investigating',
        variant: 'dispute'
      });
    }

    if (order.status === 'cancelled') {
      timeline.push({
        key: 'cancelled',
        label: `Đơn hàng đã hủy${order.cancellationReason ? `: ${translateCancellationReason(order.cancellationReason)}` : ''}`,
        date: order.cancelledAt,
        completed: true,
        variant: 'cancelled',
        isCurrent: true
      });
    } else {
      timeline.push({
        key: 'completed',
        label: 'Hoàn thành',
        date: order.completedAt,
        completed: order.status === 'completed',
        isCurrent: order.status === 'shipped' || order.status === 'disputed',
        variant: 'normal'
      });
    }

    return timeline;
  };

  const canUserAccess = () => {
    if (!user || !order) return false;
    const currentUserId = getNormalizedUserId(user);
    return getNormalizedUserId(order.buyer) === currentUserId || getNormalizedUserId(order.seller) === currentUserId;
  };

  const isBuyer = () => {
    return user && order && getNormalizedUserId(order.buyer) === getNormalizedUserId(user);
  };

  const isSeller = () => {
    return user && order && getNormalizedUserId(order.seller) === getNormalizedUserId(user);
  };

  const getActionButtons = () => {
    if (!order || !user) return null;

    const buttons = [];

    // Chat button (always available)
    buttons.push(
      <button
        key="chat"
        className="btn btn-outline"
        onClick={() => navigate('/chat')}
      >
        <i className="fas fa-comment"></i>
        Chat
      </button>
    );

    if (isBuyer()) {
      switch (order.status) {
        case 'pending':
          buttons.push(
            <button
              key="pay"
              className="btn btn-primary"
              onClick={() => navigate(`/orders/${order._id}/pay`)}
            >
              <i className="fas fa-credit-card"></i>
              Thanh toán
            </button>
          );
          break;
        case 'shipped':
          buttons.push(
            <button
              key="confirm-receipt"
              className="btn btn-success"
              onClick={() => setShowReceiptModal(true)}
            >
              <i className="fas fa-check-circle"></i>
              Xác nhận nhận hàng
            </button>
          );
          // Add dispute button for shipped orders
          buttons.push(
            <button
              key="dispute"
              className="btn btn-danger"
              onClick={() => {
                setDisputeMode('normal');
                setShowDisputeModal(true);
              }}
            >
              <i className="fas fa-exclamation-triangle"></i>
              Khiếu nại
            </button>
          );
          buttons.push(
            <button
              key="return-request"
              className="btn btn-warning"
              onClick={() => {
                setDisputeMode('return');
                setShowDisputeModal(true);
              }}
            >
              <i className="fas fa-undo"></i>
              Yêu cầu hoàn hàng
            </button>
          );
          break;
        case 'completed':
          // Add rating button if user can review and hasn't reviewed yet
          if (canReview && !existingReview) {
            buttons.push(
              <button
                key="rate"
                className="btn btn-warning"
                onClick={() => setShowRatingModal(true)}
              >
                <i className="fas fa-star"></i>
                Đánh giá người bán
              </button>
            );
          }
          break;
        case 'disputed':
          // Buyer can ONLY provide follow-up evidence after moderator has moved to 'investigating'
          if (dispute && dispute.status === 'investigating') {
            buttons.push(
              <button
                key="buyer-follow-up"
                className="btn btn-warning"
                onClick={() => setShowBuyerFollowUpModal(true)}
              >
                <i className="fas fa-paperclip"></i>
                Bổ sung bằng chứng
              </button>
            );
          }
          break;
        default:
          break;
      }
    }

    if (isSeller()) {
      switch (order.status) {
        case 'paid':
          buttons.push(
            <button
              key="ship"
              className="btn btn-primary"
              onClick={() => setShowShipModal(true)}
            >
              <i className="fas fa-shipping-fast"></i>
              Xác nhận giao hàng
            </button>
          );
          break;
        case 'disputed':
          // Seller can ONLY provide evidence when moderator has moved to 'investigating' status
          // (before this, the seller must wait for moderator to approve)
          if (dispute && dispute.status === 'investigating' && dispute.reason !== 'return_request') {
            buttons.push(
              <button
                key="seller-response"
                className="btn btn-warning"
                onClick={() => setShowSellerResponseModal(true)}
              >
                <i className="fas fa-reply"></i>
                Cung cấp bằng chứng cho mod
              </button>
            );
          }
          // Th3: return request — seller confirms item was returned
          if (dispute && dispute.reason === 'return_request' && dispute.status === 'investigating' && !dispute.sellerConfirmedReturnAt) {
            buttons.push(
              <button
                key="confirm-return"
                className="btn btn-success"
                onClick={() => setShowConfirmReturnModal(true)}
              >
                <i className="fas fa-check-circle"></i>
                Xác nhận nhận lại hàng
              </button>
            );
          }
          break;
        default:
          break;
      }
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="order-detail-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-detail-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/orders')} className="btn btn-primary">
          Quay lại danh sách đơn hàng
        </button>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  if (!canUserAccess()) {
    return (
      <div className="order-detail-container">
        <div className="error-message">Bạn không có quyền truy cập đơn hàng này</div>
        <button onClick={() => navigate('/orders')} className="btn btn-primary">
          Quay lại danh sách đơn hàng
        </button>
      </div>
    );
  }

  const timelineSteps = getStatusTimeline();

  return (
    <div className="order-detail-container">
      <div className="page-header">
        <button onClick={() => navigate('/orders')} className="back-button">
          <i className="fas fa-arrow-left"></i>
          Quay lại
        </button>
        <div className="header-info">
          <h1>Chi tiết đơn hàng</h1>
          <div className="order-id">#{order._id.slice(-8).toUpperCase()}</div>
        </div>
        <div className={`order-status ${statusColors[order.status]}`}>
          {orderStatuses[order.status]}
        </div>
      </div>

      <div className="order-detail-content">
        {/* Product Information */}
        <div className="detail-card">
          <h2>Thông tin sản phẩm</h2>
          <div className="product-info">
            <div className="product-image">
              <img 
                src={getImageUrl(order.listing?.images?.[0]) || '/placeholder-image.jpg'} 
                alt={order.listing?.title}
              />
            </div>
            <div className="product-details">
              <h3>{order.listing?.title}</h3>
              <p className="product-description">{order.listing?.description}</p>
              <div className="product-meta">
                <div className="meta-item">
                  <span className="label">Tình trạng:</span>
                  <span className="value condition-badge">
                    {conditionLabels[order.listing?.condition] || order.listing?.condition || '—'}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="label">Danh mục:</span>
                  <span className="value">{order.listing?.category?.name || 'Chưa phân loại'}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Khu vực:</span>
                  <span className="value">
                    {[order.listing?.location?.district, order.listing?.location?.city].filter(Boolean).join(', ') || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Information */}
        <div className="detail-card">
          <h2>Thông tin đơn hàng</h2>
          <div className="order-info-grid">
            <div className="info-item user-card-item">
              <span className="user-card-role">Người mua</span>
              <div className="user-card-avatar">
                <UserAvatar avatar={order.buyer?.avatar} fullName={order.buyer?.fullName} />
              </div>
              <span className="user-card-name">{order.buyer?.fullName}</span>
            </div>

            <div className="info-item user-card-item">
              <span className="user-card-role">Người bán</span>
              <div className="user-card-avatar">
                <UserAvatar avatar={order.seller?.avatar} fullName={order.seller?.fullName} />
              </div>
              <span className="user-card-name">{order.seller?.fullName}</span>
            </div>
            
            <div className="info-item">
              <span className="label">Ngày tạo:</span>
              <span className="value">{formatDate(order.createdAt)}</span>
            </div>
            
            {order.paidAt && (
              <div className="info-item">
                <span className="label">Ngày thanh toán:</span>
                <span className="value">{formatDate(order.paidAt)}</span>
              </div>
            )}
            
            {order.shippedAt && (
              <div className="info-item">
                <span className="label">Ngày giao hàng:</span>
                <span className="value">{formatDate(order.shippedAt)}</span>
              </div>
            )}
            
            {order.completedAt && (
              <div className="info-item">
                <span className="label">Ngày hoàn thành:</span>
                <span className="value">{formatDate(order.completedAt)}</span>
              </div>
            )}

            {order.cancelledAt && (
              <div className="info-item">
                <span className="label">Ngày hủy:</span>
                <span className="value">{formatDate(order.cancelledAt)}</span>
              </div>
            )}

            {order.cancellationReason && (
              <div className="info-item">
                <span className="label">Lý do hủy:</span>
                <span className="value">{translateCancellationReason(order.cancellationReason)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="detail-card">
          <h2>Chi tiết thanh toán</h2>
          <div className="price-breakdown">
            <div className="price-item">
              <span className="label">Giá sản phẩm:</span>
              <span className="value">{formatPrice(order.agreedPrice)}</span>
            </div>
            <div className="price-item">
              <span className="label">Phí dịch vụ (5%):</span>
              <span className="value">{formatPrice(order.platformFee)}</span>
            </div>
            <div className="price-item total">
              <span className="label">Tổng cộng:</span>
              <span className="value">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Information */}
        {order.shipping && (
          <div className="detail-card">
            <h2>Thông tin vận chuyển</h2>
            <div className="shipping-info">
              <div className="info-item">
                <span className="label">Đơn vị vận chuyển:</span>
                <span className="value">{order.shipping.provider}</span>
              </div>
              <div className="info-item">
                <span className="label">Mã vận đơn:</span>
                <span className="value">{order.shipping.trackingNumber}</span>
              </div>
              {order.shipping.estimatedDelivery && (
                <div className="info-item">
                  <span className="label">Dự kiến giao hàng:</span>
                  <span className="value">{formatDate(order.shipping.estimatedDelivery)}</span>
                </div>
              )}
              {order.shipping.notes && (
                <div className="info-item">
                  <span className="label">Ghi chú:</span>
                  <span className="value">{order.shipping.notes}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Timeline */}
        <div className="detail-card">
          <h2>Trạng thái đơn hàng</h2>
          <div className="status-timeline">
            {timelineSteps.map((step, index) => (
              <div
                key={step.key}
                className={`timeline-step ${step.completed ? 'completed' : ''} ${step.isCurrent ? 'current' : ''} timeline-${step.variant || 'normal'}`}
              >
                <div className="timeline-marker">
                  <i
                    className={`fas ${step.variant === 'cancelled' ? 'fa-times' : step.completed ? 'fa-check' : 'fa-circle'}`}
                  ></i>
                </div>
                <div className="timeline-content">
                  <div className="timeline-label">{step.label}</div>
                  {step.date && (
                    <div className="timeline-date">{formatDate(step.date)}</div>
                  )}
                </div>
                {index < timelineSteps.length - 1 && (
                  <div className={`timeline-line ${step.completed ? 'completed' : ''}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Existing Review Display */}
        {existingReview && (
          <div className="detail-card">
            <h2>Đánh giá của bạn</h2>
            <div className="existing-review">
              <div className="review-rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} className={`star ${star <= existingReview.rating ? 'filled' : ''}`}>
                    ★
                  </span>
                ))}
                <span className="rating-text">({existingReview.rating}/5)</span>
              </div>
              {existingReview.comment && (
                <div className="review-comment">
                  "{existingReview.comment}"
                </div>
              )}
              <div className="review-date">
                Đánh giá vào {formatDate(existingReview.createdAt)}
              </div>
            </div>
          </div>
        )}

        {dispute && (
          <div className="detail-card">
            <h2>Thông tin tranh chấp</h2>
            <div className="dispute-summary">
              <div className="dispute-summary-row">
                <span className="label">Lý do:</span>
                <span className="value">{disputeReasonLabels[dispute.reason] || dispute.reason}</span>
              </div>
              <div className="dispute-summary-row">
                <span className="label">Trạng thái:</span>
                <span className="value">{dispute.status === 'pending' ? 'Chờ xử lý' : dispute.status === 'investigating' ? 'Đang điều tra' : 'Đã xử lý'}</span>
              </div>
              <div className="dispute-summary-row full-width">
                <span className="label">Mô tả ban đầu:</span>
                <span className="value">{dispute.description}</span>
              </div>
              {dispute.moderatorNotes && (
                <div className="dispute-summary-row full-width">
                  <span className="label">Ghi chú moderator:</span>
                  <span className="value">{dispute.moderatorNotes}</span>
                </div>
              )}
              {dispute.resolution && (
                <div className="dispute-summary-row full-width">
                  <span className="label">Kết quả xử lý:</span>
                  <span className="value">{disputeResolutionLabels[dispute.resolution] || dispute.resolution}</span>
                </div>
              )}
              <div className="dispute-summary-row full-width">
                <span className="label">Bằng chứng ban đầu:</span>
                <div className="value">{renderEvidencePreview(dispute.evidenceImages || []) || 'Chưa có'}</div>
              </div>
              {dispute.sellerResponse && (
                <div className="dispute-summary-row full-width">
                  <span className="label">Phản hồi người bán:</span>
                  <span className="value">{dispute.sellerResponse}</span>
                </div>
              )}
              {!!dispute.sellerEvidenceImages?.length && (
                <div className="dispute-summary-row full-width">
                  <span className="label">Bằng chứng người bán:</span>
                  <div className="value">{renderEvidencePreview(dispute.sellerEvidenceImages)}</div>
                </div>
              )}
              {(dispute.buyerFollowUpNote || dispute.buyerAdditionalEvidenceImages?.length) && (
                <>
                  {dispute.buyerFollowUpNote && (
                    <div className="dispute-summary-row full-width">
                      <span className="label">Bổ sung từ người mua:</span>
                      <span className="value">{dispute.buyerFollowUpNote}</span>
                    </div>
                  )}
                  {!!dispute.buyerAdditionalEvidenceImages?.length && (
                    <div className="dispute-summary-row full-width">
                      <span className="label">Bằng chứng bổ sung:</span>
                      <div className="value">{renderEvidencePreview(dispute.buyerAdditionalEvidenceImages)}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="order-actions">
        {getActionButtons()}
      </div>

      {/* Modals */}
      {showShipModal && (
        <ShipOrder
          order={order}
          onClose={() => setShowShipModal(false)}
          onSuccess={handleShipSuccess}
        />
      )}

      {showReceiptModal && (
        <ConfirmReceipt
          order={order}
          onClose={() => setShowReceiptModal(false)}
          onSuccess={handleReceiptSuccess}
        />
      )}

      {showRatingModal && (
        <RateSeller
          order={order}
          onSuccess={handleRatingSuccess}
          onCancel={() => setShowRatingModal(false)}
        />
      )}

      {showDisputeModal && (
        <Dispute
          order={order}
          initialReason={disputeMode === 'return' ? 'return_request' : ''}
          onSuccess={handleDisputeSuccess}
          onCancel={() => setShowDisputeModal(false)}
        />
      )}

      {/* Seller Response Modal (Th2) */}
      {showSellerResponseModal && (
        <div className="dispute-modal">
          <div className="dispute-content">
            <div className="dispute-header">
              <h3>Phản hồi khiếu nại</h3>
              <button className="close-btn" onClick={() => setShowSellerResponseModal(false)}>×</button>
            </div>
            <div className="dispute-form">
              {sellerResponseError && <div className="error-message">{sellerResponseError}</div>}
              <div className="form-group">
                <label>Phản hồi của bạn *</label>
                <textarea
                  value={sellerResponseText}
                  onChange={(e) => setSellerResponseText(e.target.value)}
                  placeholder="Mô tả phản hồi của bạn về khiếu nại này..."
                  rows="5"
                  maxLength="1000"
                />
              </div>
              <div className="form-group">
                <label>Bằng chứng (ảnh/video, tối đa 5)</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleSellerEvidenceUpload}
                  disabled={sellerEvidenceImages.length >= 5}
                />
                {sellerEvidenceImages.length > 0 && (
                  <div className="image-preview">
                    {sellerEvidenceImages.map((file, i) => (
                      isVideoEvidence(file) ? (
                        <video
                          key={i}
                          src={getImageUrl(file)}
                          controls
                          style={{ width: 80, height: 80, objectFit: 'cover', marginRight: 8, background: '#000' }}
                        />
                      ) : (
                        <img key={i} src={getImageUrl(file)} alt={`evidence-${i}`} style={{ width: 80, height: 80, objectFit: 'cover', marginRight: 8 }} />
                      )
                    ))}
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setShowSellerResponseModal(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleSellerResponseSubmit} disabled={sellerResponseLoading}>
                  {sellerResponseLoading ? 'Đang gửi...' : 'Gửi phản hồi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBuyerFollowUpModal && dispute && (
        <div className="dispute-modal">
          <div className="dispute-content">
            <div className="dispute-header">
              <h3>Bổ sung bằng chứng cho khiếu nại</h3>
              <button className="close-btn" onClick={() => setShowBuyerFollowUpModal(false)}>×</button>
            </div>
            <div className="dispute-form">
              {buyerFollowUpError && <div className="error-message">{buyerFollowUpError}</div>}
              <div className="form-group">
                <label>Ghi chú bổ sung</label>
                <textarea
                  value={buyerFollowUpText}
                  onChange={(e) => setBuyerFollowUpText(e.target.value)}
                  placeholder="Mô tả thêm tình trạng hàng, lý do khiếu nại hoặc thông tin bạn muốn moderator xem xét..."
                  rows="5"
                  maxLength="1000"
                />
              </div>
              <div className="form-group">
                <label>Bằng chứng bổ sung (ảnh/video, tối đa 5)</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleBuyerFollowUpUpload}
                  disabled={buyerFollowUpEvidence.length >= 5}
                />
                {renderEvidencePreview(buyerFollowUpEvidence)}
              </div>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setShowBuyerFollowUpModal(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleBuyerFollowUpSubmit} disabled={buyerFollowUpLoading}>
                  {buyerFollowUpLoading ? 'Đang gửi...' : 'Gửi cho moderator'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Return Modal (Th3) */}
      {showConfirmReturnModal && (
        <div className="dispute-modal">
          <div className="dispute-content">
            <div className="dispute-header">
              <h3>Xác nhận nhận lại hàng</h3>
              <button className="close-btn" onClick={() => setShowConfirmReturnModal(false)}>×</button>
            </div>
            <div className="dispute-form">
              <p>Bạn xác nhận đã nhận lại hàng từ người mua? Moderator sẽ tiến hành hoàn tiền cho người mua sau khi bạn xác nhận.</p>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setShowConfirmReturnModal(false)}>Hủy</button>
                <button className="btn btn-success" onClick={handleConfirmReturn} disabled={confirmReturnLoading}>
                  {confirmReturnLoading ? 'Đang xử lý...' : 'Xác nhận đã nhận lại hàng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;