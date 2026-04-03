import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getOrderById, payOrder } from '../../services/order.service';
import walletService from '../../services/wallet.service';
import sePayService, { postToSepay } from '../../services/sepay.service';
import { getImageUrl } from '../../utils/imageHelper';
import './OrderPayment.css';

const OrderPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [order, setOrder] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('sepay');

  const getUserId = (value) => value?._id || value?.id || value?.userId || value || null;

  useEffect(() => {
    fetchOrderAndBalance();
  }, [id]);

  const fetchOrderAndBalance = async () => {
    try {
      setLoading(true);
      const [orderData, balanceData] = await Promise.all([
        getOrderById(id),
        walletService.getBalance()
      ]);

      const normalizedOrder = orderData?.data || orderData;
      setOrder(normalizedOrder);
      setBalance(balanceData.balance);
      
      // Default payment method is sepay
      setPaymentMethod('sepay');
      
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (paymentMethod === 'wallet') {
      if (balance < order.totalAmount) {
        const confirmTopUp = window.confirm(
          'Số dư ví không đủ để thanh toán. Bạn có muốn nạp tiền không?'
        );
        if (confirmTopUp) {
          navigate('/wallet/topup');
        }
        return;
      }

      const confirmPayment = window.confirm(
        `Bạn có chắc chắn muốn thanh toán ${formatPrice(order.totalAmount)} cho đơn hàng này bằng Ví Reflow?`
      );
      
      if (!confirmPayment) return;

      setPaymentLoading(true);
      try {
        await payOrder(id);
        alert('Thanh toán thành công! Tiền đã được chuyển vào ký quỹ và sẽ được chuyển cho người bán khi bạn xác nhận đã nhận hàng.');
        navigate('/orders');
      } catch (err) {
        alert(err.message || 'Không thể thực hiện thanh toán');
      } finally {
        setPaymentLoading(false);
      }
    } else if (paymentMethod === 'sepay') {
      setPaymentLoading(true);
      try {
        const response = await sePayService.createOrderPayment(id, {
          amount: order.totalAmount,
          orderInfo: `Thanh toan don hang ${order.orderCode || id.slice(-8)}`
        });
        
        if (response.checkoutUrl && response.fields) {
          // SEPay requires a POST form submission (not GET redirect)
          postToSepay(response.checkoutUrl, response.fields);
        } else {
          throw new Error('Khong nhan duoc thong tin thanh toan tu SePay');
        }
      } catch (err) {
        alert(err.message || 'Loi khi tao giao dich thanh toan qua SePay');
        setPaymentLoading(false);
      }
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
        <button onClick={() => navigate('/orders')} className="btn btn-primary">
          Quay lại danh sách đơn hàng
        </button>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  // Kiem tra nguoi dung co phai nguoi mua khong
  if (!user || String(getUserId(order.buyer)) !== String(getUserId(user))) {
    return (
      <div className="order-payment-container">
        <div className="error-message">Bạn không có quyền truy cập trang này</div>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  // Kiem tra don hang da duoc thanh toan chua
  if (order.status !== 'awaiting_payment' && order.status !== 'pending') {
    return (
      <div className="order-payment-container">
        <div className="info-message">
          Đơn hàng này đã được thanh toán hoặc không thể thanh toán.
        </div>
        <button onClick={() => navigate(`/orders/${id}`)} className="btn btn-primary">
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
              <span className="value">#{order.orderCode || order._id.slice(-8).toUpperCase()}</span>
            </div>
            
            <div className="order-date">
              <span className="label">Ngày tạo:</span>
              <span className="value">{formatDate(order.createdAt)}</span>
            </div>
          </div>

          <div className="product-info">
            <div className="product-image">
              <img 
                src={getImageUrl(order.listing?.images?.[0]) || '/placeholder-image.jpg'} 
                alt={order.listing?.title}
              />
            </div>
            <div className="product-details">
              <h3>{order.listing?.title}</h3>
              <p className="product-condition">
                Tình trạng: {order.listing?.condition}
              </p>
              <p className="product-location">
                Khu vực: {order.listing?.location?.district}, {order.listing?.location?.city}
              </p>
            </div>
          </div>

          <div className="seller-info">
            <h4>Thông tin người bán</h4>
            <div className="seller-details">
              <div className="seller-avatar">
                {order.seller?.avatar ? (
                  <img
                    src={getImageUrl(order.seller.avatar)}
                    alt={order.seller.fullName}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/placeholders/avatar-placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {order.seller?.fullName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="seller-info-text">
                <div className="seller-name">
                  {order.seller?.fullName}
                </div>
                <div className="seller-contact">
                  {order.seller?.email}
                </div>
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
              <span className="label">Phí nền tảng (5%, trừ từ người bán):</span>
              <span className="value">{formatPrice(order.platformFee)}</span>
            </div>
            
            <div className="price-item total">
              <span className="label">Tổng cần thanh toán:</span>
              <span className="value">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          <div className="payment-method-selection" style={{ marginTop: '20px' }}>
            <h4>Chọn phương thức thanh toán</h4>
            <div className="payment-method" style={{ marginTop: '10px' }}>
              <div 
                className={`method-card active`}
                onClick={() => setPaymentMethod('sepay')}
              >
                <img
                  src="/images/sepay-logo.png"
                  alt="Bank Transfer"
                  className="method-logo"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/logo/logo.png';
                  }}
                />
                <div className="method-info">
                  <h4>Chuyển khoản Ngân hàng</h4>
                  <p>Xử lý tự động 24/7 qua mã QR</p>
                </div>
                <div className="method-check">✓</div>
              </div>
            </div>
          </div>

          <div className="wallet-info" style={{ marginTop: '20px' }}>
            <div className="sepay-info" style={{ padding: '12px', backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: '6px', color: '#0050b3' }}>
              <i className="fas fa-shield-alt" style={{ marginRight: '8px', color: '#1890ff' }}></i>
              <strong>Thanh toán An toàn:</strong> Hệ thống sẽ chuyển bạn đến Cổng giao dịch tự động. Đơn hàng sẽ được xác nhận 24/7 ngay sau khi bạn quét mã QR chuyển khoản thành công.
            </div>
          </div>

          <div className="payment-actions" style={{ marginTop: '20px' }}>
            <button 
              onClick={() => navigate('/orders')}
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
                  <i className="fas fa-qrcode"></i>
                  Quét mã QR thanh toán
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Notice */}
      <div className="payment-notice">
        <h4>Lưu ý quan trọng:</h4>
        <ul>
          <li>Tiền sẽ được giữ trong ký quỹ và chỉ chuyển cho người bán khi bạn xác nhận đã nhận hàng</li>
          <li>Nếu có tranh chấp, tiền sẽ được giữ cho đến khi giải quyết xong</li>
          <li>Sau 10 ngày kể từ khi người bán xác nhận giao hàng, tiền sẽ tự động được chuyển</li>
          <li>Bạn có thể liên hệ với người bán qua tính năng chat để thỏa thuận chi tiết</li>
        </ul>
      </div>
    </div>
  );
};

export default OrderPayment;
