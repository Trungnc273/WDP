import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getOrderById, cancelOrder } from "../../services/order.service"; // Modified
import {
  canReviewOrder,
  getReviewByOrderId,
} from "../../services/review.service";
import ShipOrder from "./ShipOrder";
import ConfirmReceipt from "./ConfirmReceipt";
import RateSeller from "../review/RateSeller";
import Dispute from "../report/Dispute";
import "./OrderDetail.css";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  // Thêm state cho Hủy đơn
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const orderStatuses = {
    pending: "Chờ thanh toán",
    paid: "Đã thanh toán",
    shipped: "Đã giao hàng",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    disputed: "Tranh chấp",
  };

  const statusColors = {
    pending: "status-pending",
    paid: "status-paid",
    shipped: "status-shipped",
    completed: "status-completed",
    cancelled: "status-cancelled",
    disputed: "status-disputed",
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (order && isBuyer()) {
      checkReviewStatus();
    }
  }, [order]);

  const checkReviewStatus = async () => {
    try {
      // Check if user can review
      const canReviewResponse = await canReviewOrder(order._id);
      setCanReview(canReviewResponse.data.canReview);

      // Check if review already exists
      const existingReviewResponse = await getReviewByOrderId(order._id);
      setExistingReview(existingReviewResponse.data);
    } catch (error) {
      console.error("Error checking review status:", error);
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await getOrderById(id);
      setOrder(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || "Không thể tải thông tin đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleShipSuccess = () => {
    setShowShipModal(false);
    fetchOrder(); // Refresh order data
    alert("Xác nhận giao hàng thành công!");
  };

  const handleReceiptSuccess = () => {
    setShowReceiptModal(false);
    fetchOrder(); // Refresh order data
    checkReviewStatus(); // Check if user can now review
    alert("Xác nhận nhận hàng thành công! Tiền đã được chuyển cho người bán.");
  };

  const handleRatingSuccess = () => {
    setShowRatingModal(false);
    checkReviewStatus(); // Refresh review status
    alert("Đánh giá thành công! Cảm ơn bạn đã chia sẻ trải nghiệm.");
  };

  const handleDisputeSuccess = () => {
    setShowDisputeModal(false);
    fetchOrder(); // Refresh order data
    alert(
      "Khiếu nại đã được tạo thành công. Chúng tôi sẽ xem xét và phản hồi trong 3-7 ngày làm việc.",
    );
  };

  // MỚI THÊM: Logic Hủy đơn
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert("Vui lòng nhập lý do hủy đơn");
      return;
    }

    setCancelLoading(true);
    try {
      await cancelOrder(order._id, cancelReason);
      alert("Hủy đơn hàng thành công");
      setShowCancelModal(false);
      fetchOrder(); // Load lại data mới
    } catch (error) {
      alert(error.message || "Không thể hủy đơn hàng");
    } finally {
      setCancelLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusTimeline = () => {
    const timeline = [
      {
        key: "created",
        label: "Đơn hàng được tạo",
        date: order.createdAt,
        completed: true,
      },
      {
        key: "paid",
        label: "Đã thanh toán",
        date: order.paidAt,
        completed: ["paid", "shipped", "completed"].includes(order.status),
      },
      {
        key: "shipped",
        label: "Đã giao hàng",
        date: order.shippedAt,
        completed: ["shipped", "completed"].includes(order.status),
      },
      {
        key: "completed",
        label: "Hoàn thành",
        date: order.completedAt,
        completed: order.status === "completed",
      },
    ];

    return timeline;
  };

  const canUserAccess = () => {
    if (!user || !order) return false;
    return order.buyer._id === user._id || order.seller._id === user._id;
  };

  const isBuyer = () => {
    return user && order && order.buyer._id === user._id;
  };

  const isSeller = () => {
    return user && order && order.seller._id === user._id;
  };

  const getActionButtons = () => {
    if (!order || !user) return null;

    const buttons = [];

    // Chat button (always available)
    buttons.push(
      <button
        key="chat"
        className="btn btn-outline"
        onClick={() => navigate("/chat")}
      >
        <i className="fas fa-comment"></i>
        Chat
      </button>,
    );

    if (isBuyer()) {
      switch (order.status) {
        case "pending":
          buttons.push(
            <button
              key="pay"
              className="btn btn-primary"
              onClick={() => navigate(`/orders/${order._id}/pay`)}
            >
              <i className="fas fa-credit-card"></i>
              Thanh toán
            </button>,
            <button
              key="cancel"
              className="btn btn-danger btn-outline"
              onClick={() => setShowCancelModal(true)}
              style={{ marginLeft: '10px' }}
            >
              <i className="fas fa-times"></i>
              Hủy đơn
            </button>
          );
          break;
        case "shipped":
          buttons.push(
            <button
              key="confirm-receipt"
              className="btn btn-success"
              onClick={() => setShowReceiptModal(true)}
            >
              <i className="fas fa-check-circle"></i>
              Xác nhận nhận hàng
            </button>,
          );
          // Add dispute button for shipped orders
          buttons.push(
            <button
              key="dispute"
              className="btn btn-danger"
              onClick={() => setShowDisputeModal(true)}
            >
              <i className="fas fa-exclamation-triangle"></i>
              Khiếu nại
            </button>,
          );
          break;
        case "completed":
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
              </button>,
            );
          }
          break;
      }
    }

    if (isSeller()) {
      switch (order.status) {
        case "paid":
          buttons.push(
            <button
              key="ship"
              className="btn btn-primary"
              onClick={() => setShowShipModal(true)}
            >
              <i className="fas fa-shipping-fast"></i>
              Xác nhận giao hàng
            </button>,
          );
          break;
        // Cho phép seller hủy nếu người mua chậm thanh toán (pending)
        case "pending":
          buttons.push(
            <button
              key="cancel"
              className="btn btn-danger btn-outline"
              onClick={() => setShowCancelModal(true)}
              style={{ marginLeft: '10px' }}
            >
              <i className="fas fa-times"></i>
              Hủy đơn
            </button>
          );
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
        <button onClick={() => navigate("/orders")} className="btn btn-primary">
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
        <div className="error-message">
          Bạn không có quyền truy cập đơn hàng này
        </div>
        <button onClick={() => navigate("/orders")} className="btn btn-primary">
          Quay lại danh sách đơn hàng
        </button>
      </div>
    );
  }

  return (
    <div className="order-detail-container">
      <div className="page-header">
        <button onClick={() => navigate("/orders")} className="back-button">
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
                src={order.listing?.images?.[0] || "/placeholder-image.jpg"}
                alt={order.listing?.title}
              />
            </div>
            <div className="product-details">
              <h3>{order.listing?.title}</h3>
              <p className="product-description">
                {order.listing?.description}
              </p>
              <div className="product-meta">
                <div className="meta-item">
                  <span className="label">Tình trạng:</span>
                  <span className="value">{order.listing?.condition}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Danh mục:</span>
                  <span className="value">{order.listing?.category?.name}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Khu vực:</span>
                  <span className="value">
                    {order.listing?.location?.district},{" "}
                    {order.listing?.location?.city}
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
            <div className="info-item">
              <span className="label">Người mua:</span>
              <div className="user-info">
                <div className="user-avatar">
                  {order.buyer?.avatar ? (
                    <img src={order.buyer.avatar} alt={order.buyer.fullName} />
                  ) : (
                    <div className="avatar-placeholder">
                      {order.buyer?.fullName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="user-name">{order.buyer?.fullName}</span>
              </div>
            </div>

            <div className="info-item">
              <span className="label">Người bán:</span>
              <div className="user-info">
                <div className="user-avatar">
                  {order.seller?.avatar ? (
                    <img
                      src={order.seller.avatar}
                      alt={order.seller.fullName}
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {order.seller?.fullName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="user-name">{order.seller?.fullName}</span>
              </div>
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
            
            {order.status === 'cancelled' && order.cancellationReason && (
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">Lý do hủy:</span>
                <span className="value" style={{ color: '#dc3545' }}>{order.cancellationReason}</span>
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
                  <span className="value">
                    {formatDate(order.shipping.estimatedDelivery)}
                  </span>
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
            {getStatusTimeline().map((step, index) => (
              <div
                key={step.key}
                className={`timeline-step ${step.completed ? "completed" : ""}`}
              >
                <div className="timeline-marker">
                  <i
                    className={`fas ${step.completed ? "fa-check" : "fa-circle"}`}
                  ></i>
                </div>
                <div className="timeline-content">
                  <div className="timeline-label">{step.label}</div>
                  {step.date && (
                    <div className="timeline-date">{formatDate(step.date)}</div>
                  )}
                </div>
                {index < getStatusTimeline().length - 1 && (
                  <div
                    className={`timeline-line ${step.completed ? "completed" : ""}`}
                  ></div>
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
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${star <= existingReview.rating ? "filled" : ""}`}
                  >
                    ★
                  </span>
                ))}
                <span className="rating-text">({existingReview.rating}/5)</span>
              </div>
              {existingReview.comment && (
                <div className="review-comment">"{existingReview.comment}"</div>
              )}
              <div className="review-date">
                Đánh giá vào {formatDate(existingReview.createdAt)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="order-actions">{getActionButtons()}</div>

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
          onSuccess={handleDisputeSuccess}
          onCancel={() => setShowDisputeModal(false)}
        />
      )}
      
      {/* Modal Hủy Đơn */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)} style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Hủy đơn hàng</h3>
            <p style={{ marginBottom: '16px' }}>Bạn có chắc chắn muốn hủy đơn hàng này không? Vui lòng cho biết lý do.</p>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <textarea 
                rows="3" 
                placeholder="Nhập lý do hủy đơn (Vd: Tôi đổi ý, Đặt nhầm...)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
              />
            </div>

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowCancelModal(false)}
                disabled={cancelLoading}
                style={{ padding: '8px 16px', border: '1px solid #ccc', background: 'transparent', borderRadius: '4px', cursor: 'pointer' }}
              >
                Đóng
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleCancelOrder}
                disabled={cancelLoading || !cancelReason.trim()}
                style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: cancelReason.trim() ? 'pointer' : 'not-allowed', opacity: cancelReason.trim() ? 1 : 0.6 }}
              >
                {cancelLoading ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;