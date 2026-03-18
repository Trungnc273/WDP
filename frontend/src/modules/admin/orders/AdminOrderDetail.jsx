import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  forceCancelModeratorOrder,
  getModeratorOrderById,
  updateModeratorOrderStatus
} from '../../../services/moderator.service';
import '../AdminModules.css';

const AdminOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [reason, setReason] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [nextStatus, setNextStatus] = useState(undefined);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const SHIP_ONLY_STATUS = 'shipped';

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

  const STATUS_LABEL = {
    awaiting_payment: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    shipped: 'Đang giao',
    completed: 'Hoàn tất',
    cancelled: 'Đã hủy',
    disputed: 'Đang tranh chấp'
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const fetchOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getModeratorOrderById(id);
      setOrder(data);
      const shipAllowed = (data?.allowedNextStatuses || []).includes(SHIP_ONLY_STATUS);
      setNextStatus(shipAllowed ? SHIP_ONLY_STATUS : undefined);
    } catch (err) {
      setError(err.message || 'Không tải được chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleForceCancel = async () => {
    if (!reason.trim()) {
      setMessage('Vui lòng nhập lý do hủy đơn');
      return;
    }

    try {
      await forceCancelModeratorOrder(id, reason);
      setMessage('Đã ép hủy đơn hàng thành công');
      fetchOrder();
      setReason('');
    } catch (err) {
      setMessage(err.message || 'Không thể hủy đơn');
    }
  };

  const handleUpdateStatus = async () => {
    if (!nextStatus) {
      setMessage('Không có trạng thái kế tiếp hợp lệ');
      return;
    }

    try {
      await updateModeratorOrderStatus(id, nextStatus, statusNote);
      setMessage('Đã cập nhật trạng thái đơn hàng thành công');
      setStatusNote('');
      fetchOrder();
    } catch (err) {
      setMessage(err.message || 'Không thể cập nhật trạng thái đơn');
    }
  };

  if (error) {
    return (
      <div className="admin-module">
        <div className="alert alert-error">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-module">
      <div className="admin-module__header">
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/admin/orders')}
        >
          <i className="fas fa-arrow-left"></i>
          Quay lại danh sách
        </button>
        <h1>Chi tiết đơn hàng: {order?.orderCode || order?._id?.slice(-8)?.toUpperCase() || ''}</h1>
      </div>

      {message && (
        <div className={`alert ${message.includes('thành công') ? 'alert-success' : 'alert-error'}`}>
          {message}
          <button onClick={() => setMessage('')} className="alert-close">×</button>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          Đang tải...
        </div>
      ) : order ? (
        <div className="admin-module__content">
          <div className="detail-grid">
            <div className="detail-section">
              <h3>Thông tin đơn hàng</h3>
              <div className="detail-item">
                <label>Mã đơn hàng:</label>
                <span>{order.orderCode || order._id?.slice(-8)?.toUpperCase() || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Mã vận đơn:</label>
                <span>{order.trackingNumber || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Sản phẩm:</label>
                <span>{order.productId?.title || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Tổng tiền:</label>
                <span className="currency">{formatCurrency(order.totalToPay)}</span>
              </div>
              <div className="detail-item">
                <label>Trạng thái:</label>
                <span className={`status status-${order.status}`}>
                  {STATUS_LABEL[order.status] || 'N/A'}
                </span>
              </div>
              <div className="detail-item">
                <label>Thanh toán:</label>
                <span>
                  {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 
                   order.paymentStatus === 'refunded' ? 'Đã hoàn tiền' : 'Chưa thanh toán'}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Thông tin người mua</h3>
              <div className="detail-item">
                <label>Họ tên:</label>
                <span>{order.buyerId?.fullName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Số điện thoại:</label>
                <span>{order.buyerId?.phone || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Địa chỉ:</label>
                <span>{order.buyerId?.address || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Thông tin người bán</h3>
              <div className="detail-item">
                <label>Họ tên:</label>
                <span>{order.sellerId?.fullName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Số điện thoại:</label>
                <span>{order.sellerId?.phone || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Địa chỉ:</label>
                <span>{order.sellerId?.address || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Thông tin giao hàng</h3>
              <div className="detail-item">
                <label>Người nhận:</label>
                <span>{order.shippingRecipientName || order.buyerId?.fullName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>SĐT nhận hàng:</label>
                <span>{order.shippingPhone || order.buyerId?.phone || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Địa chỉ giao hàng:</label>
                <span>{order.shippingAddress || order.buyerId?.address || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Đơn vị vận chuyển:</label>
                <span>{order.shippingProvider || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Ngày dự kiến giao:</label>
                <span>{formatDateTime(order.estimatedDelivery)}</span>
              </div>
              <div className="detail-item">
                <label>Ngày giao hàng:</label>
                <span>{formatDateTime(order.shippedAt)}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Thông tin thời gian</h3>
              <div className="detail-item">
                <label>Ngày tạo đơn:</label>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
              <div className="detail-item">
                <label>Ngày cập nhật:</label>
                <span>{formatDateTime(order.updatedAt)}</span>
              </div>
            </div>
          </div>

          <div className="admin-actions">
            <div className="action-section">
              <h3>Thao tác quản trị</h3>
              
              <div className="form-group">
                <label>Lý do hủy đơn:</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do hủy đơn (tối thiểu 10 ký tự)"
                  rows="3"
                />
              </div>

              <div className="action-buttons">
                <button
                  className="btn btn-danger"
                  onClick={handleForceCancel}
                  disabled={order.status === 'cancelled' || order.status === 'completed' || !reason.trim()}
                >
                  <i className="fas fa-ban"></i>
                  Ép hủy đơn hàng
                </button>

                {nextStatus && (
                  <button
                    className="btn btn-primary"
                    onClick={handleUpdateStatus}
                  >
                    <i className="fas fa-check"></i>
                    Cập nhật trạng thái
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminOrderDetail;