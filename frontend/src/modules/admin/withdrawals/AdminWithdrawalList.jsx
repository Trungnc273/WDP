import React, { useState, useEffect } from 'react';
import { 
  getModeratorWithdrawals, 
  updateModeratorWithdrawalStatus 
} from '../../../services/moderator.service';
import '../AdminModules.css';

const AdminWithdrawalList = () => {
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [filters, setFilters] = useState({ status: 'pending', keyword: '' });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [message, setMessage] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWithdrawals = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const result = await getModeratorWithdrawals({ 
        page, 
        limit: pageSize, 
        status: filters.status 
      });
      setWithdrawals(result.items);
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.limit,
        total: result.pagination.total
      });
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Không tải được yêu cầu rút tiền');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({ status: 'pending', keyword: '' });
    fetchWithdrawals(1, pagination.pageSize);
  };

  useEffect(() => {
    fetchWithdrawals(1, pagination.pageSize);
  }, [filters.status]);

  const handleApprove = async (id) => {
    try {
      await updateModeratorWithdrawalStatus(id, 'completed');
      setMessage('Đã duyệt yêu cầu rút tiền thành công');
      fetchWithdrawals(pagination.current, pagination.pageSize);
    } catch (error) {
      setMessage(error.message || 'Không thể duyệt yêu cầu');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setSubmitting(true);
    try {
      await updateModeratorWithdrawalStatus(rejectTarget, 'failed', rejectNote);
      setMessage('Đã từ chối yêu cầu rút tiền thành công');
      setRejectTarget(null);
      setRejectNote('');
      fetchWithdrawals(pagination.current, pagination.pageSize);
    } catch (error) {
      setMessage(error.message || 'Không thể từ chối yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredWithdrawals = filters.keyword
    ? withdrawals.filter((w) => {
        const name = (w.userId?.fullName || '').toLowerCase();
        const bank = (w.metadata?.bankName || '').toLowerCase();
        const account = (w.metadata?.bankAccount || '').toLowerCase();
        const kw = filters.keyword.toLowerCase();
        return name.includes(kw) || bank.includes(kw) || account.includes(kw);
      })
    : withdrawals;

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'Chờ duyệt',
      completed: 'Đã chuyển',
      failed: 'Từ chối',
      cancelled: 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const statusClassMap = {
      pending: 'status-orange',
      completed: 'status-green',
      failed: 'status-red',
      cancelled: 'status-red'
    };
    return statusClassMap[status] || 'status-blue';
  };

  return (
    <div className="admin-module">
      <div className="admin-module__header">
        <h1>Yêu cầu rút tiền</h1>
        <p>Xem xét và xử lý yêu cầu rút tiền từ người dùng</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('thành công') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div className="admin-module__filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Tìm theo tên, ngân hàng..."
            value={filters.keyword}
            onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            className="filter-input"
          />
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="filter-select"
          >
            <option value="pending">Chờ duyệt</option>
            <option value="completed">Đã duyệt</option>
            <option value="failed">Từ chối</option>
            <option value="cancelled">Đã hủy</option>
          </select>

          <div className="filter-actions">
            <button 
              className="btn btn-primary"
              onClick={() => fetchWithdrawals(1, pagination.pageSize)}
            >
              <i className="fas fa-search"></i>
              Lọc
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleResetFilters}
            >
              <i className="fas fa-redo"></i>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="admin-module__content">
        {loading ? (
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i>
            Đang tải...
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="withdrawals-table">
                <thead>
                  <tr>
                    <th style={{width: '100px'}}>Mã YC</th>
                    <th style={{width: '160px'}}>Người dùng</th>
                    <th style={{width: '130px', textAlign: 'right'}}>Số tiền</th>
                    <th style={{width: '200px'}}>Thông tin Bank</th>
                    <th style={{width: '120px'}}>Trạng thái</th>
                    <th style={{width: '150px'}}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    filteredWithdrawals.map((withdrawal) => (
                      <tr key={withdrawal._id}>
                        <td>
                          <strong>
                            {String(withdrawal._id).slice(-8).toUpperCase()}
                          </strong>
                        </td>
                        <td>
                          <div style={{fontWeight: '500'}}>
                            {withdrawal.userId?.fullName || 'N/A'}
                          </div>
                        </td>
                        <td style={{textAlign: 'right', fontWeight: '600', color: '#52c41a'}}>
                          {Number(withdrawal.amount || 0).toLocaleString('vi-VN')} ₫
                        </td>
                        <td>
                          <div style={{fontSize: '13px'}}>
                            <div style={{fontWeight: '500', marginBottom: '2px'}}>
                              {withdrawal.metadata?.bankName || 'N/A'}
                            </div>
                            <div style={{color: '#666', fontFamily: 'monospace'}}>
                              {withdrawal.metadata?.bankAccount || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`status ${getStatusClass(withdrawal.status)}`}>
                            {getStatusLabel(withdrawal.status)}
                          </span>
                        </td>
                        <td>
                          {withdrawal.status === 'pending' && (
                            <div className="action-buttons">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleApprove(withdrawal._id)}
                                style={{ background: '#52c41a' }}
                              >
                                <i className="fas fa-check"></i>
                                Duyệt
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => setRejectTarget(withdrawal._id)}
                              >
                                <i className="fas fa-times"></i>
                                Từ chối
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination.total > pagination.pageSize && (
              <div className="pagination">
                <button
                  className="btn btn-sm"
                  onClick={() => fetchWithdrawals(pagination.current - 1, pagination.pageSize)}
                  disabled={pagination.current === 1}
                >
                  Trước
                </button>
                
                <span className="page-info">
                  Trang {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize)}
                </span>
                
                <button
                  className="btn btn-sm"
                  onClick={() => fetchWithdrawals(pagination.current + 1, pagination.pageSize)}
                  disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="modal-overlay" onClick={() => !submitting && setRejectTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Lý do từ chối</h3>
              <button 
                className="modal-close" 
                onClick={() => !submitting && setRejectTarget(null)}
                disabled={submitting}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Nhập lý do từ chối yêu cầu rút tiền</label>
                <textarea
                  rows={4}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Nhập lý do từ chối (tối thiểu 5 ký tự)"
                  className="form-control"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setRejectTarget(null)}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                className="btn btn-danger"
                onClick={handleReject}
                disabled={submitting || rejectNote.trim().length < 5}
              >
                {submitting ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-times"></i>
                )}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawalList;