import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getModeratorReportById, resolveModeratorReport } from '../../../services/moderator.service';
import { getImageUrl } from '../../../utils/imageHelper';
import '../AdminModules.css';

const AdminReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reply, setReply] = useState('');
  const [replyToReportedUser, setReplyToReportedUser] = useState('');
  const [decision, setDecision] = useState('warn_user');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getModeratorReportById(id);
      setReport(data);
      setReply(data?.moderatorReply || '');
      setReplyToReportedUser(data?.moderatorReplyToReportedUser || '');
      setDecision(data?.moderatorDecision || 'warn_user');
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleAction = async (status) => {
    try {
      await resolveModeratorReport(id, {
        status,
        moderatorDecision: decision,
        moderatorReply: reply,
        moderatorReplyToReportedUser: replyToReportedUser
      });
      setMessage('Đã xử lý báo cáo thành công');
      fetchDetail();
    } catch (err) {
      setMessage(err.message || 'Không thể xử lý báo cáo');
    }
  };

  const getWarningLevel = (warningCount, isSuspended, shouldLockAccount) => {
    if (isSuspended) {
      return { color: 'error', message: 'Tài khoản đang bị khóa do vi phạm từ báo cáo.' };
    }

    if (shouldLockAccount) {
      return { color: 'warning', message: `Đã đạt mốc ${warningCount} cảnh báo (mốc khóa 3/6/9).` };
    }

    if (warningCount === 0) {
      return { color: 'success', message: 'Người dùng chưa có cảnh báo nào.' };
    }

    const remain = 3 - (warningCount % 3);
    return {
      color: remain === 1 ? 'warning' : 'info',
      message: `${warningCount} cảnh báo, còn ${remain} lần tới mốc khóa tiếp theo.`
    };
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'Chờ xử lý',
      reviewing: 'Đang xem xét',
      resolved: 'Đã giải quyết',
      dismissed: 'Đã bỏ qua'
    };
    return statusMap[status] || status;
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

  const warningCount = Number(report?.reportedUserStats?.warningCount || 0);
  const totalReports = Number(report?.reportedUserStats?.totalReports || 0);
  const isSuspended = Boolean(report?.reportedUserStats?.isSuspended);
  const shouldLockAccount = Boolean(report?.reportedUserStats?.shouldLockAccount);
  const warningLevel = getWarningLevel(warningCount, isSuspended, shouldLockAccount);
  const productWarningActions = Number(report?.productStats?.warningActions || 0);
  const productTotalReports = Number(report?.productStats?.totalReports || 0);
  const productIsRemoved = Boolean(report?.productStats?.isRemoved);

  return (
    <div className="admin-module">
      <div className="admin-module__header">
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/admin/reports')}
        >
          <i className="fas fa-arrow-left"></i>
          Quay lại danh sách
        </button>
        <h1>Chi tiết báo cáo: {report?._id?.slice(-8)?.toUpperCase() || ''}</h1>
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
      ) : report ? (
        <div className="admin-module__content">
          <div className="detail-grid">
            <div className="detail-section">
              <h3>Thông tin báo cáo</h3>
              <div className="detail-item">
                <label>Người tố cáo:</label>
                <span>{report.reporterId?.fullName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Đối tượng bị tố cáo:</label>
                <span>{report.reportedUserId?.fullName || report.productId?.title || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Sản phẩm liên quan:</label>
                <span>
                  {report.productId?._id ? (
                    <a href={`/product/${report.productId._id}`} target="_blank" rel="noopener noreferrer">
                      {report.productId.title}
                    </a>
                  ) : 'N/A'}
                </span>
              </div>
              <div className="detail-item">
                <label>Lý do:</label>
                <span className="reason-text">{report.reason}</span>
              </div>
              <div className="detail-item">
                <label>Chi tiết:</label>
                <span>{report.description}</span>
              </div>
              <div className="detail-item">
                <label>Trạng thái:</label>
                <span className={`status status-${report.status}`}>
                  {getStatusLabel(report.status)}
                </span>
              </div>
            </div>

            {report.reportType === 'user' && (
              <div className="detail-section">
                <h3>Thông tin vi phạm người dùng</h3>
                <div className="detail-item">
                  <label>Số lần bị cảnh báo:</label>
                  <span className={`violation-badge violation-${isSuspended ? 'red' : shouldLockAccount ? 'orange' : warningCount > 0 ? 'gold' : 'green'}`}>
                    {warningCount} lần
                  </span>
                </div>
                <div className="detail-item">
                  <label>Số lần bị báo cáo:</label>
                  <span className={`violation-badge violation-${totalReports >= 6 ? 'red' : totalReports >= 3 ? 'orange' : totalReports >= 1 ? 'gold' : 'default'}`}>
                    {totalReports} lần
                  </span>
                </div>
                <div className={`alert alert-${warningLevel.color}`}>
                  <i className="fas fa-info-circle"></i>
                  <div>
                    <strong>{warningLevel.message}</strong>
                    <p>
                      {isSuspended || shouldLockAccount
                        ? 'Mốc khóa áp dụng theo chu kỳ 3/6/9 cảnh báo với mức khóa tăng dần 24h, 1 tuần, 1 năm.'
                        : 'Mốc khóa tài khoản: 3/6/9 cảnh báo.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {report.reportType === 'product' && (
              <div className="detail-section">
                <h3>Thông tin vi phạm sản phẩm</h3>
                <div className="detail-item">
                  <label>Mức vi phạm sản phẩm:</label>
                  <div className="violation-badges">
                    <span className={`violation-badge violation-${productWarningActions >= 3 ? 'red' : productWarningActions >= 1 ? 'gold' : 'green'}`}>
                      {productWarningActions} cảnh báo
                    </span>
                    <span className={`violation-badge violation-${productTotalReports >= 6 ? 'red' : productTotalReports >= 3 ? 'orange' : productTotalReports >= 1 ? 'gold' : 'default'}`}>
                      {productTotalReports} lần bị báo
                    </span>
                    {productIsRemoved && (
                      <span className="violation-badge violation-red">Bài đã bị gỡ</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="detail-section">
              <h3>Ảnh bằng chứng</h3>
              {report.evidenceImages?.length ? (
                <div className="evidence-images">
                  {report.evidenceImages.slice(0, 4).map((imageUrl, index) => (
                    <img
                      key={`${imageUrl}-${index}`}
                      src={getImageUrl(imageUrl)}
                      alt={`Bằng chứng ${index + 1}`}
                      className="evidence-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/84x84?text=Error';
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p>Không có ảnh bằng chứng</p>
              )}
            </div>

            <div className="detail-section">
              <h3>Phản hồi của moderator</h3>
              <div className="detail-item">
                <label>Phản hồi tới người báo cáo:</label>
                <span>{report.moderatorReply || 'Chưa có phản hồi'}</span>
              </div>
              <div className="detail-item">
                <label>Phản hồi tới người bị báo cáo:</label>
                <span>{report.moderatorReplyToReportedUser || 'Chưa có phản hồi'}</span>
              </div>
            </div>
          </div>

          {(report.status === 'pending' || report.status === 'reviewing') && (
            <div className="admin-actions">
              <div className="action-section">
                <h3>Thao tác xử lý</h3>
                
                <div className="form-group">
                  <label>Quyết định xử lý:</label>
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                  >
                    <option value="warn_user">Cảnh báo người dùng</option>
                    <option value="reply_feedback">Trả lời phản hồi</option>
                    <option value="ban_user">Khóa tài khoản</option>
                    <option value="remove_content">Gỡ nội dung</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Phản hồi tới người báo cáo:</label>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Nhập phản hồi cho người báo cáo (tùy chọn)"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Phản hồi tới người bị báo cáo:</label>
                  <textarea
                    value={replyToReportedUser}
                    onChange={(e) => setReplyToReportedUser(e.target.value)}
                    placeholder="Nhập phản hồi cho người bị báo cáo (tùy chọn)"
                    rows="3"
                  />
                </div>

                <div className="action-buttons">
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      if (window.confirm('Xác nhận đã giải quyết báo cáo này?')) {
                        handleAction('resolved');
                      }
                    }}
                  >
                    <i className="fas fa-check-circle"></i>
                    Đánh dấu Đã giải quyết
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      if (window.confirm('Bỏ qua báo cáo này (báo cáo sai)?')) {
                        handleAction('dismissed');
                      }
                    }}
                  >
                    <i className="fas fa-times-circle"></i>
                    Bỏ qua báo cáo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default AdminReportDetail;