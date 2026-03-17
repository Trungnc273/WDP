import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getModeratorDisputeById, 
  resolveModeratorDispute 
} from '../../../services/moderator.service';
import '../AdminModules.css';

const AdminDisputeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dispute, setDispute] = useState(null);
  const [message, setMessage] = useState('');
  const [resolving, setResolving] = useState(false);

  const reasonLabel = {
    not_as_described: 'Không đúng mô tả',
    damaged: 'Sản phẩm bị hỏng/hư hại',
    not_received: 'Không nhận được hàng',
    counterfeit: 'Hàng giả/hàng nhái',
    return_request: 'Yêu cầu hoàn hàng',
    other: 'Lý do khác'
  };

  const viMessage = (raw = '') => {
    const input = String(raw || '').trim();
    const map = {
      'Dispute resolved: refund to buyer': 'Tranh chấp đã xử lý: Hoàn tiền cho người mua',
      'Dispute resolved: release to seller': 'Tranh chấp đã xử lý: Nhả tiền cho người bán'
    };
    return map[input] || input;
  };

  const fetchDisputeDetail = async () => {
    setLoading(true);
    try {
      const data = await getModeratorDisputeById(id);
      setDispute(data);
      setMessage('');
    } catch (error) {
      setMessage(viMessage(error.message) || 'Không thể tải chi tiết tranh chấp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDisputeDetail();
    }
  }, [id]);

  const handleResolve = async (resolution) => {
    setResolving(true);
    try {
      await resolveModeratorDispute(id, resolution);
      setMessage(`Đã giải quyết tranh chấp: ${resolution === 'refund_buyer' ? 'Hoàn tiền cho người mua' : 'Nhả tiền cho người bán'}`);
      fetchDisputeDetail();
    } catch (error) {
      setMessage(viMessage(error.message) || 'Không thể giải quyết tranh chấp');
    } finally {
      setResolving(false);
    }
  };

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

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'Chờ xử lý',
      investigating: 'Đang điều tra',
      resolved: 'Đã xử lý'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const statusClassMap = {
      pending: 'status-orange',
      investigating: 'status-blue',
      resolved: 'status-green'
    };
    return statusClassMap[status] || 'status-blue';
  };

  if (loading) {
    return (
      <div className="admin-module">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          Đang tải...
        </div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="admin-module">
        <div className="alert alert-error">
          Không tìm thấy tranh chấp
        </div>
      </div>
    );
  }

  return (
    <div className="admin-module">
      <div className="admin-module__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/admin/disputes')}
          >
            <i className="fas fa-arrow-left"></i>
            Quay lại
          </button>
          <div>
            <h1>Chi tiết tranh chấp #{String(dispute._id).slice(-8).toUpperCase()}</h1>
            <p>Xem xét và giải quyết tranh chấp</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Đã giải quyết') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div className="admin-module__content">
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Status and Basic Info */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '16px' }}>Thông tin cơ bản</h3>
            <div className="review-details-grid">
              <div className="detail-item">
                <label>Trạng thái</label>
                <span className={`status ${getStatusClass(dispute.status)}`}>
                  {getStatusLabel(dispute.status)}
                </span>
              </div>
              <div className="detail-item">
                <label>Lý do tranh chấp</label>
                <span style={{ color: '#cf1322' }}>
                  {reasonLabel[dispute.reason] || viMessage(dispute.reason)}
                </span>
              </div>
              <div className="detail-item">
                <label>Ngày tạo</label>
                <span>{formatDateTime(dispute.createdAt)}</span>
              </div>
              <div className="detail-item">
                <label>Cập nhật lần cuối</label>
                <span>{formatDateTime(dispute.updatedAt)}</span>
              </div>
              <div className="detail-item full-width">
                <label>Mô tả chi tiết</label>
                <span>{dispute.description || 'Không có mô tả'}</span>
              </div>
            </div>
          </div>

          {/* Order Information */}
          {dispute.orderId && (
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '16px' }}>Thông tin đơn hàng</h3>
              <div className="review-details-grid">
                <div className="detail-item">
                  <label>Mã đơn hàng</label>
                  <span>{dispute.orderId.orderCode || String(dispute.orderId._id).slice(-8).toUpperCase()}</span>
                </div>
                <div className="detail-item">
                  <label>Tổng tiền</label>
                  <span className="currency">{formatCurrency(dispute.orderId.totalToPay)}</span>
                </div>
                <div className="detail-item">
                  <label>Trạng thái đơn hàng</label>
                  <span>{dispute.orderId.status}</span>
                </div>
                <div className="detail-item">
                  <label>Mã vận đơn</label>
                  <span>{dispute.orderId.trackingNumber || 'Chưa có'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Parties Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Buyer Info */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '16px' }}>Người mua</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>Tên</label>
                  <div>{dispute.buyerId?.fullName || 'N/A'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>Email</label>
                  <div>{dispute.buyerId?.email || 'N/A'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>Số điện thoại</label>
                  <div>{dispute.buyerId?.phone || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '16px' }}>Người bán</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>Tên</label>
                  <div>{dispute.sellerId?.fullName || 'N/A'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>Email</label>
                  <div>{dispute.sellerId?.email || 'N/A'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>Số điện thoại</label>
                  <div>{dispute.sellerId?.phone || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Resolution Actions */}
          {dispute.status !== 'resolved' && (
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '16px' }}>Giải quyết tranh chấp</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleResolve('refund_buyer')}
                  disabled={resolving}
                  style={{ background: '#52c41a' }}
                >
                  {resolving ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-undo"></i>
                  )}
                  Hoàn tiền cho người mua
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleResolve('release_seller')}
                  disabled={resolving}
                  style={{ background: '#1890ff' }}
                >
                  {resolving ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-check"></i>
                  )}
                  Nhả tiền cho người bán
                </button>
              </div>
              <div style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
                Chọn cách giải quyết phù hợp dựa trên bằng chứng và thông tin tranh chấp
              </div>
            </div>
          )}

          {/* Resolution Result */}
          {dispute.status === 'resolved' && dispute.resolution && (
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '16px' }}>Kết quả giải quyết</h3>
              <div className="alert alert-success">
                <strong>{viMessage(dispute.resolution.message)}</strong>
                <div style={{ marginTop: '8px', fontSize: '14px' }}>
                  Giải quyết lúc: {formatDateTime(dispute.resolution.resolvedAt)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDisputeDetail;