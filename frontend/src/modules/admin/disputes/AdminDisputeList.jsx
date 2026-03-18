import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getModeratorDisputes } from '../../../services/moderator.service';
import '../AdminModules.css';

const AdminDisputeList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [disputes, setDisputes] = useState([]);
  const [filters, setFilters] = useState({ status: 'all' });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [message, setMessage] = useState('');

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

  const fetchDisputes = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const result = await getModeratorDisputes({
        page,
        limit: pageSize,
        status: filters.status === 'all' ? undefined : filters.status
      });
      setDisputes(result.items);
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.limit,
        total: result.pagination.total
      });
      setMessage('');
    } catch (error) {
      setMessage(viMessage(error.message) || 'Không thể tải danh sách khiếu nại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes(1, pagination.pageSize);
  }, [filters.status]);

  const handleResetFilter = () => {
    setFilters({ status: 'all' });
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

  return (
    <div className="admin-module">
      <div className="admin-module__header">
        <h1>Quản lý tranh chấp</h1>
        <p>Xem xét và giải quyết tranh chấp giữa người mua và người bán</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('thành công') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div className="admin-module__filters">
        <div className="filter-group">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="filter-select"
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ xử lý</option>
            <option value="investigating">Đang điều tra</option>
            <option value="resolved">Đã xử lý</option>
          </select>

          <div className="filter-actions">
            <button 
              className="btn btn-secondary"
              onClick={handleResetFilter}
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
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã KN</th>
                    <th>Người mua</th>
                    <th>Người bán</th>
                    <th>Lý do</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    disputes.map((dispute) => (
                      <tr key={dispute._id}>
                        <td>
                          <strong>
                            {String(dispute._id).slice(-8).toUpperCase()}
                          </strong>
                        </td>
                        <td>{dispute.buyerId?.fullName || 'N/A'}</td>
                        <td>{dispute.sellerId?.fullName || 'N/A'}</td>
                        <td>
                          <span style={{ color: '#cf1322' }}>
                            {reasonLabel[dispute.reason] || viMessage(dispute.reason)}
                          </span>
                        </td>
                        <td>
                          <span className={`status ${getStatusClass(dispute.status)}`}>
                            {getStatusLabel(dispute.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => navigate(`/admin/disputes/${dispute._id}`)}
                          >
                            <i className="fas fa-eye"></i>
                            Chi tiết
                          </button>
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
                  onClick={() => fetchDisputes(pagination.current - 1, pagination.pageSize)}
                  disabled={pagination.current === 1}
                >
                  Trước
                </button>
                
                <span className="page-info">
                  Trang {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize)}
                </span>
                
                <button
                  className="btn btn-sm"
                  onClick={() => fetchDisputes(pagination.current + 1, pagination.pageSize)}
                  disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDisputeList;