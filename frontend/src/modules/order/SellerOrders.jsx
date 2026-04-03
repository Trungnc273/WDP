import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrdersAsSeller, confirmOrderBySeller } from '../../services/order.service';
import { getImageUrl } from '../../utils/imageHelper';
import './SellerOrders.css';

const SellerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending'); // pending, confirmed, completed
  const [actionLoading, setActionLoading] = useState({});

  const getOrderStatus = (order) => {
    return order.status;
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    filterOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrdersAsSeller();
      
      const ordersList = response?.orders || response?.data?.orders || [];
      const resultOrders = Array.isArray(ordersList) ? ordersList : [];
      
      setOrders(resultOrders);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đơn hàng');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (filter === 'pending_shipment') {
      // Chờ giao: includes paid orders waiting for shipping.
      // Also displaying awaiting_payment or awaiting_seller_confirmation if we want the seller to know the order exists but isn't paid yet.
      // But the requirement says "thay vào đó là chờ giao", so we focus on 'paid'. We can include 'awaiting_payment', 'awaiting_seller_confirmation' as well, but state them as 'Chờ lấy hàng' or 'Chờ thanh toán'.
      filtered = orders.filter(order => ['awaiting_seller_confirmation', 'awaiting_payment', 'paid'].includes(getOrderStatus(order)));
    } else if (filter === 'shipping') {
      filtered = orders.filter(order => getOrderStatus(order) === 'shipped');
    } else if (filter === 'completed') {
      filtered = orders.filter(order =>
        ['delivered', 'completed', 'cancelled', 'disputed'].includes(getOrderStatus(order))
      );
    }

    setFilteredOrders(filtered);
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

  const getStatusBadge = (status) => {
    let statusText = '';
    let statusClass = '';

    if (status === 'awaiting_seller_confirmation' || status === 'awaiting_payment') {
      statusText = 'Chưa thanh toán (Chờ mua)';
      statusClass = 'status-awaiting-payment';
    } else if (status === 'paid') {
      statusText = 'Đã thanh toán (Chờ giao)';
      statusClass = 'status-paid';
    } else if (status === 'shipped') {
      statusText = 'Đang giao hàng';
      statusClass = 'status-shipping';
    } else if (status === 'delivered') {
      statusText = 'Đã giao (Chờ nhận)';
      statusClass = 'status-shipping';
    } else if (status === 'completed') {
      statusText = 'Hoàn thành';
      statusClass = 'status-completed';
    } else if (status === 'cancelled') {
      statusText = 'Đã hủy';
      statusClass = 'status-cancelled';
    } else if (status === 'disputed') {
      statusText = 'Tranh chấp';
      statusClass = 'status-disputed';
    }

    return { text: statusText, class: statusClass };
  };

  // confirmOrder is removed since approval is automatic or completely bypassed

  const handleViewDetails = (orderId) => {
    navigate(`/order-detail/${orderId}`);
  };

  if (loading) {
    return (
      <div className="seller-orders-container loading-container">
        <div className="spinner"></div>
        <p>Đang tải danh sách đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="seller-orders-container">
      <div className="seller-orders-header">
        <h1>Đơn Hàng Của Tôi</h1>
        <p className="seller-orders-subtitle">Quản lý các đơn hàng từ khách hàng</p>
      </div>

      <div className="seller-orders-filters">
        <button
          className={`filter-btn ${filter === 'pending_shipment' ? 'active' : ''}`}
          onClick={() => setFilter('pending_shipment')}
        >
          <i className="fas fa-hourglass-half"></i>
          Chờ giao
          <span className="filter-count">
            {orders.filter(o => ['awaiting_seller_confirmation', 'awaiting_payment', 'paid'].includes(getOrderStatus(o))).length}
          </span>
        </button>

        <button
          className={`filter-btn ${filter === 'shipping' ? 'active' : ''}`}
          onClick={() => setFilter('shipping')}
        >
          <i className="fas fa-truck"></i>
          Đang giao
          <span className="filter-count">
            {orders.filter(o => getOrderStatus(o) === 'shipped').length}
          </span>
        </button>

        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          <i className="fas fa-box"></i>
          Hoàn thành
          <span className="filter-count">
            {orders.filter(o => ['delivered', 'completed', 'cancelled', 'disputed'].includes(getOrderStatus(o))).length}
          </span>
        </button>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          {error}
          <button onClick={fetchOrders} className="retry-btn">Thử lại</button>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <h3>Không có đơn hàng</h3>
          <p>
            {filter === 'pending_shipment' && 'Bạn không có đơn hàng nào chờ giao'}
            {filter === 'shipping' && 'Bạn không có đơn hàng nào đang giao'}
            {filter === 'completed' && 'Bạn không có đơn hàng nào ở trạng thái hoàn thành'}
          </p>
        </div>
      ) : (
        <div className="seller-orders-list">
          {filteredOrders.map(order => {
            const normalizedStatus = getOrderStatus(order);
            const statusBadge = getStatusBadge(normalizedStatus, order.confirmedBySeller);
            const productImage = order.productId?.images?.[0]
              ? getImageUrl(order.productId.images[0])
              : '/images/placeholders/product-placeholder.png';
            const buyerAvatar = order.buyerId?.avatar
              ? getImageUrl(order.buyerId.avatar)
              : '/images/placeholders/avatar-placeholder.svg';

            return (
              <div key={order._id} className="order-card">
                <div className="order-card-left">
                  <img 
                    src={productImage} 
                    alt={order.productId?.name || 'Sản phẩm'} 
                    className="order-product-image"
                    onError={(e) => e.target.src = '/images/placeholders/product-placeholder.png'}
                  />
                </div>

                <div className="order-product-info">
                  <h3 className="order-product-name">
                    {order.productId?.title || order.productId?.name || 'N/A'}
                  </h3>
                  <p className="order-product-price">
                    {formatPrice(order.agreedPrice)}
                  </p>
                </div>

                <div className="order-buyer-info">
                  <img
                    src={buyerAvatar}
                    alt={order.buyerId?.username || 'Khách hàng'}
                    className="order-buyer-avatar"
                    onError={(e) => e.target.src = '/images/placeholders/avatar-placeholder.svg'}
                  />
                  <div className="order-buyer-details">
                    <p className="order-buyer-name">
                      {order.buyerId?.fullName || order.buyerId?.username || 'N/A'}
                    </p>
                    <p className="order-date">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="order-card-right">
                  <div className={`order-status-badge ${statusBadge.class}`}>
                    {statusBadge.text}
                  </div>
                  <button
                    className="btn-view-details"
                    onClick={() => handleViewDetails(order._id)}
                    title="Xem chi tiết đơn hàng"
                  >
                    <i className="fas fa-arrow-right"></i>
                    Chi tiết
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerOrders;
