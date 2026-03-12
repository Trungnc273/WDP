import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getOrderById, payOrder } from "../../services/order.service";
import walletService from "../../services/wallet.service";
import "./OrderPayment.css";

const OrderPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderAndBalance = async () => {
      try {
        setLoading(true);
        const [orderResponse, balanceData] = await Promise.all([
          getOrderById(id),
          walletService.getBalance(),
        ]);

        const actualOrder = orderResponse.data || orderResponse;

        setOrder(actualOrder);
        setBalance(balanceData.balance);
        setError(null);
      } catch (err) {
        setError(err.message || "Không thể tải thông tin đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndBalance();
  }, [id]);

  const handlePayment = async () => {
    if (balance < order.totalAmount) {
      const confirmTopUp = window.confirm(
        "Số dư ví không đủ để thanh toán. Bạn có muốn nạp tiền không?",
      );
      if (confirmTopUp) {
        navigate("/wallet/topup");
      }
      return;
    }

    const confirmPayment = window.confirm(
      `Bạn có chắc chắn muốn thanh toán ${formatPrice(order.totalAmount)} cho đơn hàng này?`,
    );

    if (!confirmPayment) return;

    setPaymentLoading(true);

    try {
      await payOrder(id);
      alert(
        "Thanh toán thành công! Tiền đã được chuyển vào ký quỹ và sẽ được chuyển cho người bán khi bạn xác nhận đã nhận hàng.",
      );
      navigate("/orders");
    } catch (err) {
      alert(err.message || "Không thể thực hiện thanh toán");
    } finally {
      setPaymentLoading(false);
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

  if (loading) {
    return (
      <div className="order-payment-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-payment-container">
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

  const currentBuyer = order.buyer || order.buyerId || {};
  const currentSeller = order.seller || order.sellerId || {};

  const getSafeId = (userObj) => {
    if (!userObj) return null;
    if (typeof userObj === "string") return userObj;
    return userObj._id || userObj.id || null;
  };

  const buyerIdStr = String(getSafeId(currentBuyer));
  const currentUserIdStr = String(user?._id || user?.id || user?.userId);

  // Check if user is the buyer (Đã khôi phục tính năng bảo mật an toàn)
  if (!user || buyerIdStr !== currentUserIdStr) {
    return (
      <div className="order-payment-container">
        <div className="error-message">
          Bạn không có quyền truy cập trang này
        </div>
        <button onClick={() => navigate("/")} className="btn btn-primary">
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  // Check if order is already paid
  if (order.status !== "pending") {
    return (
      <div className="order-payment-container">
        <div className="info-message">
          Đơn hàng này đã được thanh toán hoặc không thể thanh toán.
        </div>
        <button
          onClick={() => navigate(`/orders/${id}`)}
          className="btn btn-primary"
        >
          Xem chi tiết đơn hàng
        </button>
      </div>
    );
  }

  const isInsufficientBalance = balance < order.totalAmount;

  return (
    <div className="order-payment-container">
      <div className="page-header">
        <h1>Thanh toán đơn hàng</h1>
        <p>Xác nhận và thanh toán cho đơn hàng của bạn</p>
      </div>

      <div className="payment-content">
        {/* Order Information */}
        <div className="order-info-card">
          <h2>Thông tin đơn hàng</h2>

          <div className="order-details">
            <div className="order-id">
              <span className="label">Mã đơn hàng:</span>
              <span className="value">
                #{order._id?.slice(-8).toUpperCase()}
              </span>
            </div>

            <div className="order-date">
              <span className="label">Ngày tạo:</span>
              <span className="value">{formatDate(order.createdAt)}</span>
            </div>
          </div>

          <div className="product-info">
            <div className="product-image">
              <img
                src={order.listing?.images?.[0] || "/placeholder-image.jpg"}
                alt={order.listing?.title}
              />
            </div>
            <div className="product-details">
              <h3>{order.listing?.title}</h3>
              <p className="product-condition">
                Tình trạng: {order.listing?.condition}
              </p>
              <p className="product-location">
                Khu vực: {order.listing?.location?.district},{" "}
                {order.listing?.location?.city}
              </p>
            </div>
          </div>

          <div className="seller-info">
            <h4>Thông tin người bán</h4>
            <div className="seller-details">
              <div className="seller-avatar">
                {currentSeller?.avatar ? (
                  <img
                    src={currentSeller.avatar}
                    alt={currentSeller.fullName}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {currentSeller?.fullName?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div className="seller-info-text">
                <div className="seller-name">
                  {currentSeller?.fullName}
                  {currentSeller?.isVerified && (
                    <span className="verified-badge" title="Đã xác thực">
                      ✓
                    </span>
                  )}
                </div>
                <div className="seller-contact">{currentSeller?.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="payment-summary-card">
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
              <span className="label">Tổng cần thanh toán:</span>
              <span className="value">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          <div className="wallet-info">
            <h4>Thông tin ví</h4>
            <div className="balance-info">
              <span className="label">Số dư hiện tại:</span>
              <span
                className={`balance ${isInsufficientBalance ? "insufficient" : "sufficient"}`}
              >
                {formatPrice(balance)}
              </span>
            </div>

            {isInsufficientBalance && (
              <div className="insufficient-notice">
                <i className="fas fa-exclamation-triangle"></i>
                Số dư không đủ để thanh toán. Cần nạp thêm{" "}
                {formatPrice(order.totalAmount - balance)}
              </div>
            )}
          </div>

          <div className="payment-actions">
            {isInsufficientBalance ? (
              <>
                <button
                  onClick={() => navigate("/wallet/topup")}
                  className="btn btn-primary"
                >
                  <i className="fas fa-plus"></i>
                  Nạp tiền vào ví
                </button>
                <button
                  onClick={() => navigate("/orders")}
                  className="btn btn-secondary"
                >
                  Quay lại
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/orders")}
                  className="btn btn-secondary"
                  disabled={paymentLoading}
                >
                  Hủy
                </button>
                <button
                  onClick={handlePayment}
                  className="btn btn-primary"
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-credit-card"></i>
                      Thanh toán ngay
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment Notice */}
      <div className="payment-notice">
        <h4>Lưu ý quan trọng:</h4>
        <ul>
          <li>
            Tiền sẽ được giữ trong ký quỹ và chỉ chuyển cho người bán khi bạn
            xác nhận đã nhận hàng
          </li>
          <li>
            Nếu có tranh chấp, tiền sẽ được giữ cho đến khi giải quyết xong
          </li>
          <li>
            Sau 5 ngày kể từ khi người bán xác nhận giao hàng, tiền sẽ tự động
            được chuyển
          </li>
          <li>
            Bạn có thể liên hệ với người bán qua tính năng chat để thỏa thuận
            chi tiết
          </li>
        </ul>
      </div>
    </div>
  );
};

export default OrderPayment;
