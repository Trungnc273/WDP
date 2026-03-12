import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getOrdersAsBuyer, getOrdersAsSeller, confirmReceipt, confirmOrderBySeller } from '../../services/order.service';
import { getImageUrl } from '../../utils/imageHelper';
import Dispute from '../report/Dispute';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('buying');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [disputeMode, setDisputeMode] = useState('normal');
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  });

  const orderStatuses = {
    'awaiting_seller_confirmation': 'Chờ xác nhận',
    'awaiting_payment': 'Chờ thanh toán',
    'pending': 'Chờ thanh toán',
    'paid': 'Đã thanh toán',
    'shipped': 'Đã giao hàng',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy',
    'disputed': 'Tranh chấp'
  };

  const statusColors = {
    'awaiting_seller_confirmation': 'status-waiting',
    'awaiting_payment': 'status-pending',
    'pending': 'status-pending',
    'paid': 'status-paid',
    'shipped': 'status-shipped',
    'completed': 'status-completed',
    'cancelled': 'status-cancelled',
    'disputed': 'status-disputed'
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab, filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.status && { status: filters.status })
      };

      const response = activeTab === 'buying' 
        ? await getOrdersAsBuyer(params)
        : await getOrdersAsSeller(params);
      
      setOrders(response.data.orders || []);
      setPagination({
        currentPage: response.data.currentPage || 1,
        totalPages: response.data.totalPages || 1,
        totalOrders: response.data.totalOrders || 0
      });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilters(prev => ({ ...prev, page: 1, status: '' }));
  };

  const handleStatusFilter = (status) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleOrderClick = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  const handleConfirmReceipt = async (order) => {
    const accepted = window.confirm('Bạn xác nhận đã nhận được hàng và muốn hoàn tất đơn này?');
    if (!accepted) return;

    try {
      setConfirmingOrderId(order._id);
      await confirmReceipt(order._id);
      await fetchOrders();
      alert('Xác nhận nhận hàng thành công. Tiền đã được chuyển cho người bán.');
    } catch (err) {
      alert(err.message || 'Không thể xác nhận nhận hàng');
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const handleConfirmOrderBySeller = async (order) => {
    const accepted = window.confirm('Bạn xác nhận đơn hàng này và chuyển cho người mua thanh toán?');
    if (!accepted) return;

    try {
      setConfirmingOrderId(order._id);
      await confirmOrderBySeller(order._id);
      await fetchOrders();
      alert('Đã xác nhận đơn hàng. Người mua sẽ tiến hành thanh toán.');
    } catch (err) {
      alert(err.message || 'Không thể xác nhận đơn hàng');
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const openDisputeModal = (order, mode = 'normal') => {
    setSelectedOrder(order);
    setDisputeMode(mode);
    setShowDisputeModal(true);
  };

  const handleDisputeSuccess = async () => {
    setShowDisputeModal(false);
    setSelectedOrder(null);
    await fetchOrders();

    if (disputeMode === 'return') {
      alert('Yêu cầu hoàn hàng đã được tạo thành công. Bạn có thể theo dõi xử lý trong chi tiết đơn hàng.');
      return;
    }

    alert('Khiếu nại đã được tạo thành công. Bạn có thể theo dõi xử lý trong chi tiết đơn hàng.');
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

  const getActionButton = (order) => {
    const isBuyer = activeTab === 'buying';
    
    if (isBuyer) {
      switch (order.status) {
        case 'pending':
          return (
            <button 
              className="btn btn-primary btn-sm btn-pay"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/${order._id}/pay`);
              }}
            >
              <i className="fas fa-credit-card"></i>
              Thanh toán
            </button>
          );
        case 'shipped':
          return (
            <>
              <button 
                className="btn btn-success btn-sm"
                disabled={confirmingOrderId === order._id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmReceipt(order);
                }}
              >
                {confirmingOrderId === order._id ? 'Đang xử lý...' : 'Xác nhận nhận hàng'}
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openDisputeModal(order, 'normal');
                }}
              >
                Khiếu nại
              </button>
              <button
                className="btn btn-warning btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openDisputeModal(order, 'return');
                }}
              >
                Hoàn hàng
              </button>
            </>
          );
        case 'disputed':
          return (
            <button
              className="btn btn-warning btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/${order._id}?action=followup`);
              }}
            >
              Bổ sung bằng chứng
            </button>
          );
        default:
          return null;
      }
    } else {
      switch (order.status) {
        case 'awaiting_seller_confirmation':
          return (
            <button
              className="btn btn-success btn-sm"
              disabled={confirmingOrderId === order._id}
              onClick={(e) => {
                e.stopPropagation();
                handleConfirmOrderBySeller(order);
              }}
            >
              {confirmingOrderId === order._id ? 'Đang xử lý...' : 'Xác nhận đơn'}
            </button>
          );
        case 'paid':
          return (
            <button 
              className="btn btn-primary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                // Xu ly giao hang
              }}
            >
              Xác nhận giao hàng
            </button>
          );
        case 'disputed':
          return (
            <button
              className="btn btn-warning btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/${order._id}?action=seller-evidence`);
              }}
            >
              Xử lý tranh chấp
            </button>
          );
        default:
          return null;
      }
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="orders-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="page-header">
        <h1>Đơn hàng của tôi</h1>
        <p>Quản lý và theo dõi các đơn hàng</p>
      </div>

      {/* Tabs */}
      <div className="order-tabs">
        <button
          className={`tab-button ${activeTab === 'buying' ? 'active' : ''}`}
          onClick={() => handleTabChange('buying')}
        >
          <i className="fas fa-shopping-cart"></i>
          Đang mua ({activeTab === 'buying' ? pagination.totalOrders : '...'})
        </button>
        <button
          className={`tab-button ${activeTab === 'selling' ? 'active' : ''}`}
          onClick={() => handleTabChange('selling')}
        >
          <i className="fas fa-store"></i>
          Đang bán ({activeTab === 'selling' ? pagination.totalOrders : '...'})
        </button>
      </div>

      {/* Filters */}
      <div className="order-filters">
        <div className="filter-group">
          <label>Trạng thái:</label>
          <select
            value={filters.status}
            onChange={(e) => handleStatusFilter(e.target.value)}
          >
            <option value="">Tất cả</option>
            {Object.entries(orderStatuses).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={fetchOrders} className="btn btn-primary btn-sm">
            Thử lại
          </button>
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-box-open"></i>
          </div>
          <h3>Chưa có đơn hàng nào</h3>
          <p>
            {activeTab === 'buying' 
              ? 'Bạn chưa có đơn hàng mua nào. Hãy khám phá các sản phẩm và đặt hàng ngay!'
              : 'Bạn chưa có đơn hàng bán nào. Hãy đăng sản phẩm để bắt đầu bán hàng!'
            }
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate(activeTab === 'buying' ? '/' : '/product/create')}
          >
            {activeTab === 'buying' ? 'Khám phá sản phẩm' : 'Đăng sản phẩm'}
          </button>
        </div>
      ) : (
        <>
          <div className="orders-list">
            {orders.map((order) => (
              <div
                key={order._id}
                className="order-card"
                onClick={() => handleOrderClick(order._id)}
              >
                <div className="order-header">
                  <div className="order-id">
                    <span className="label">Mã đơn hàng:</span>
                    <span className="value">#{order._id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className={`order-status ${statusColors[order.status] || ''}`}>
                    {orderStatuses[order.status] || order.status}
                  </div>
                </div>

                <div className="order-content">
                  <div className="product-info">
                    <div className="product-image">
                      <img
                        src={getImageUrl(order.listing?.images?.[0]) || '/placeholder-image.jpg'}
                        alt={order.listing?.title}
                        onError={(e) => { e.target.src = '/images/placeholders/product-placeholder.png'; }}
                      />
                    </div>
                    <div className="product-details">
                      <h4>{order.listing?.title}</h4>
                      <p className="product-price">
                        Giá: {formatPrice(order.agreedPrice)}
                      </p>
                      <p className="order-total">
                        Tổng tiền: {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="order-info">
                    <div className="user-info">
                      <span className="label">
                        {activeTab === 'buying' ? 'Người bán:' : 'Người mua:'}
                      </span>
                      <span className="value">
                        {activeTab === 'buying'
                          ? order.seller?.fullName
                          : order.buyer?.fullName
                        }
                      </span>
                    </div>
                    <div className="order-date">
                      <span className="label">Ngày tạo:</span>
                      <span className="value">{formatDate(order.createdAt)}</span>
                    </div>
                    {order.shippedAt && (
                      <div className="ship-date">
                        <span className="label">Ngày giao:</span>
                        <span className="value">{formatDate(order.shippedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="order-actions">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/chat');
                    }}
                  >
                    <i className="fas fa-comment"></i>
                    Chat
                  </button>
                  {getActionButton(order)}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOrderClick(order._id);
                    }}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
                Trước
              </button>
              
              <div className="pagination-info">
                Trang {pagination.currentPage} / {pagination.totalPages}
                <span className="total-count">
                  ({pagination.totalOrders} đơn hàng)
                </span>
              </div>
              
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Sau
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}

      {loading && orders.length > 0 && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            Đang tải...
          </div>
        </div>
      )}

      {showDisputeModal && selectedOrder && (
        <Dispute
          order={selectedOrder}
          initialReason={disputeMode === 'return' ? 'return_request' : ''}
          onSuccess={handleDisputeSuccess}
          onCancel={() => {
            setShowDisputeModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default Orders;