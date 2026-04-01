import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getModeratorDisputeById,
  resolveModeratorDispute
} from '../../../services/moderator.service';
import { getImageUrl } from '../../../utils/imageHelper';
import '../AdminModules.css';

const AdminDisputeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [dispute, setDispute] = useState(null);
  const [message, setMessage] = useState('');
  const [resolving, setResolving] = useState(false);
  const [moderatorNotes, setModeratorNotes] = useState('');

  const reasonLabel = {
    not_as_described: 'Không đúng mô tả',
    damaged: 'Sản phẩm bị hỏng/hư hại',
    not_received: 'Không nhận được hàng',
    counterfeit: 'Hàng giả/hàng nhái',
    return_request: 'Yêu cầu hoàn hàng',
    other: 'Lý do khác'
  };

  const disputeStatusLabel = {
    pending: 'Chờ xử lý',
    investigating: 'Đang điều tra',
    resolved: 'Đã xử lý'
  };

  const orderStatusLabel = {
    pending: 'Chờ thanh toán',
    delivered: 'Đã giao hàng',
    awaiting_seller_confirmation: 'Chờ xác nhận',
    awaiting_payment: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    shipped: 'Đang giao',
    completed: 'Hoàn tất',
    cancelled: 'Đã hủy',
    disputed: 'Đang tranh chấp'
  };

  const resolutionLabel = {
    refund: 'Hoàn tiền cho người mua',
    release: 'Nhả tiền cho người bán'
  };

  const senderRoleLabel = {
    buyer: 'Người mua',
    seller: 'Người bán',
    moderator: 'Quản trị viên',
    system: 'Hệ thống'
  };

  const viMessage = (raw = '') => {
    const input = String(raw || '').trim();
    const map = {
      'Dispute resolved: refund to buyer': 'Tranh chấp đã xử lý: Hoàn tiền cho người mua',
      'Dispute resolved: release to seller': 'Tranh chấp đã xử lý: Nhả tiền cho người bán',
      'resolution phải là refund hoặc release': 'Kết quả xử lý chỉ được chọn Hoàn tiền hoặc Nhả tiền',
      'moderatorNotes tối thiểu 10 ký tự': 'Ghi chú xử lý tối thiểu 10 ký tự'
    };
    return map[input] || input;
  };

  const isVideoEvidence = (url = '') => /\.(mp4|mov|webm|avi|mkv)$/i.test(url);

  const fetchDisputeDetail = async () => {
    setLoading(true);
    try {
      const data = await getModeratorDisputeById(id);
      setDispute(data);
      setModeratorNotes(data?.moderatorNotes || '');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleResolve = async (resolution) => {
    const confirmText = resolution === 'refund'
      ? 'Xác nhận hoàn tiền cho người mua?'
      : 'Xác nhận nhả tiền cho người bán?';

    if (!window.confirm(confirmText)) {
      return;
    }

    setResolving(true);
    try {
      await resolveModeratorDispute(id, {
        resolution,
        moderatorNotes: moderatorNotes.trim()
      });

      setMessage(`Đã giải quyết tranh chấp: ${resolutionLabel[resolution]}`);
      await fetchDisputeDetail();
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

  const getStatusClass = (status) => {
    const statusClassMap = {
      pending: 'status-orange',
      investigating: 'status-blue',
      resolved: 'status-green'
    };
    return statusClassMap[status] || 'status-blue';
  };

  const disputeTimeline = (() => {
    if (!dispute) {
      return [];
    }

    const timeline = Array.isArray(dispute.disputeConversation)
      ? dispute.disputeConversation.map((event, index) => ({
          key: `conversation-${index}`,
          title: senderRoleLabel[event?.senderRole] || 'Cập nhật',
          content: event?.content || '',
          evidenceFiles: Array.isArray(event?.evidenceFiles) ? event.evidenceFiles : [],
          createdAt: event?.createdAt || null
        }))
      : [];

    if (!timeline.length) {
      timeline.push({
        key: 'initial',
        title: 'Người mua tạo khiếu nại',
        content: dispute.description || '',
        evidenceFiles: Array.isArray(dispute.evidenceImages) ? dispute.evidenceImages : [],
        createdAt: dispute.createdAt || null
      });

      if (dispute.sellerResponse || dispute.sellerEvidenceImages?.length) {
        timeline.push({
          key: 'seller-response',
          title: 'Người bán',
          content: dispute.sellerResponse || 'Người bán đã gửi bằng chứng',
          evidenceFiles: Array.isArray(dispute.sellerEvidenceImages) ? dispute.sellerEvidenceImages : [],
          createdAt: dispute.sellerResponseUpdatedAt || null
        });
      }

      if (dispute.buyerFollowUpNote || dispute.buyerAdditionalEvidenceImages?.length) {
        timeline.push({
          key: 'buyer-followup',
          title: 'Người mua',
          content: dispute.buyerFollowUpNote || 'Người mua bổ sung bằng chứng',
          evidenceFiles: Array.isArray(dispute.buyerAdditionalEvidenceImages) ? dispute.buyerAdditionalEvidenceImages : [],
          createdAt: dispute.buyerFollowUpUpdatedAt || null
        });
      }
    }

    if (dispute.resolution || dispute.status === 'resolved') {
      timeline.push({
        key: 'resolved',
        title: 'Quản trị viên chốt kết quả',
        content: resolutionLabel[dispute.resolution] || 'Đã xử lý tranh chấp',
        evidenceFiles: [],
        createdAt: dispute.resolvedAt || null
      });
    }

    return timeline.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
      return timeA - timeB;
    });
  })();

  const renderEvidence = (files = []) => {
    if (!files.length) {
      return null;
    }

    return (
      <div className="dispute-evidence-grid">
        {files.map((file, index) => {
          const src = getImageUrl(file);

          if (isVideoEvidence(file)) {
            return (
              <video key={`${file}-${index}`} controls className="dispute-evidence-video">
                <source src={src} />
              </video>
            );
          }

          return (
            <a
              key={`${file}-${index}`}
              href={src}
              target="_blank"
              rel="noreferrer"
              className="dispute-evidence-link"
            >
              <img src={src} alt={`Bằng chứng ${index + 1}`} className="dispute-evidence-image" />
            </a>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-module admin-dispute-detail">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          Đang tải...
        </div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="admin-module admin-dispute-detail">
        <div className="alert alert-error">
          Không tìm thấy tranh chấp
        </div>
      </div>
    );
  }

  return (
    <div className="admin-module admin-dispute-detail">
      <div className="admin-module__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/disputes')}>
            <i className="fas fa-arrow-left"></i>
            Quay lại
          </button>
          <div>
            <h1>Giải quyết tranh chấp #{String(dispute._id).slice(-8).toUpperCase()}</h1>
            <p>Đối soát thông tin, bằng chứng và đưa ra kết quả xử lý</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Đã giải quyết') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div className="admin-module__content">
        <div className="dispute-detail-layout">
          <div className="dispute-card">
            <h3>Thông tin cơ bản</h3>
            <div className="review-details-grid">
              <div className="detail-item">
                <label>Trạng thái</label>
                <span className={`status ${getStatusClass(dispute.status)}`}>
                  {disputeStatusLabel[dispute.status] || dispute.status}
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
                <label>Mô tả từ người mua</label>
                <span>{dispute.description || 'Không có mô tả'}</span>
              </div>
            </div>
          </div>

          {dispute.orderId && (
            <div className="dispute-card">
              <h3>Thông tin đơn hàng</h3>
              <div className="review-details-grid">
                <div className="detail-item">
                  <label>Mã đơn hàng</label>
                  <span>{dispute.orderId.orderCode || String(dispute.orderId._id || '').slice(-8).toUpperCase()}</span>
                </div>
                <div className="detail-item">
                  <label>Tổng tiền</label>
                  <span className="currency">{formatCurrency(dispute.orderId.totalToPay)}</span>
                </div>
                <div className="detail-item">
                  <label>Trạng thái đơn hàng</label>
                  <span>{orderStatusLabel[dispute.orderId.status] || dispute.orderId.status || 'Không xác định'}</span>
                </div>
                <div className="detail-item">
                  <label>Mã vận đơn</label>
                  <span>{dispute.orderId.trackingNumber || 'Chưa có'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="dispute-card dispute-card-full">
            <h3>Người tham gia</h3>
            <div className="dispute-parties-grid">
              <div className="dispute-party-box">
                <h4>Người mua</h4>
                <p><strong>Tên:</strong> {dispute.buyerId?.fullName || 'N/A'}</p>
                <p><strong>Email:</strong> {dispute.buyerId?.email || 'N/A'}</p>
                <p><strong>Số điện thoại:</strong> {dispute.buyerId?.phone || 'N/A'}</p>
              </div>

              <div className="dispute-party-box">
                <h4>Người bán</h4>
                <p><strong>Tên:</strong> {dispute.sellerId?.fullName || 'N/A'}</p>
                <p><strong>Email:</strong> {dispute.sellerId?.email || 'N/A'}</p>
                <p><strong>Số điện thoại:</strong> {dispute.sellerId?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="dispute-card dispute-card-full">
            <h3>Diễn biến và bằng chứng</h3>
            {disputeTimeline.length === 0 ? (
              <div className="no-data">Chưa có dữ liệu diễn biến</div>
            ) : (
              <div className="dispute-timeline">
                {disputeTimeline.map((event) => (
                  <div key={event.key} className="dispute-event">
                    <div className="dispute-event-head">
                      <span className="status status-blue">{event.title}</span>
                      <span className="dispute-event-time">{formatDateTime(event.createdAt)}</span>
                    </div>
                    <p className="dispute-event-content">{event.content || 'Không có nội dung'}</p>
                    {renderEvidence(event.evidenceFiles)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {dispute.status !== 'resolved' && (
            <div className="dispute-card dispute-card-full">
              <h3>Ra quyết định xử lý</h3>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Ghi chú xử lý (khuyến nghị)</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={moderatorNotes}
                  onChange={(e) => setModeratorNotes(e.target.value)}
                  placeholder="Nhập ghi chú để lưu vào hồ sơ xử lý tranh chấp"
                  maxLength={500}
                />
                <div className="char-count">{String(moderatorNotes || '').length}/500</div>
              </div>

              <div className="dispute-action-row">
                <button
                  className="btn btn-primary"
                  style={{ background: '#389e0d' }}
                  onClick={() => handleResolve('refund')}
                  disabled={resolving}
                >
                  <i className={`fas ${resolving ? 'fa-spinner fa-spin' : 'fa-undo'}`}></i>
                  Hoàn tiền cho người mua
                </button>

                <button
                  className="btn btn-primary"
                  style={{ background: '#1677ff' }}
                  onClick={() => handleResolve('release')}
                  disabled={resolving}
                >
                  <i className={`fas ${resolving ? 'fa-spinner fa-spin' : 'fa-check'}`}></i>
                  Nhả tiền cho người bán
                </button>
              </div>
            </div>
          )}

          {dispute.status === 'resolved' && (
            <div className="dispute-card dispute-card-full">
              <h3>Kết quả giải quyết</h3>
              <div className="alert alert-success" style={{ marginBottom: 0 }}>
                {resolutionLabel[dispute.resolution] || 'Tranh chấp đã được xử lý'}
                <div style={{ marginTop: '6px', fontSize: '13px' }}>
                  Hoàn tất lúc: {formatDateTime(dispute.resolvedAt)}
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
