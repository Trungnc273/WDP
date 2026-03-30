import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getModeratorReports } from '../../../services/moderator.service';
import '../AdminModules.css';

const AdminReportList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ status: '', reportType: '', keyword: '' });
  const [message, setMessage] = useState('');

  const sanitizeKeyword = (keyword) => String(keyword || '').trim();

  const validateKeyword = (keyword) => {
    if (keyword.length > 100) {
      throw new Error('Từ khóa tìm kiếm không được vượt quá 100 ký tự');
    }
  };

  const fetchReports = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const keyword = sanitizeKeyword(filters.keyword);
      validateKeyword(keyword);

      const result = await getModeratorReports({
        page,
        limit: pageSize,
        status: filters.status || undefined,
        reportType: filters.reportType || undefined,
        keyword: keyword || undefined
      });

      setReports(result.items);
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.limit,
        total: result.pagination.total
      });
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({ status: '', reportType: '', keyword: '' });
    fetchReports(1, pagination.pageSize);
  };

  useEffect(() => {
    fetchReports(1, pagination.pageSize);
  }, [filters.status, filters.reportType]);

  const getWarningMeta = (warningCount, isSuspended, shouldLockAccount) => {
    if (isSuspended) {
      return { color: 'red', text: `${warningCount} cảnh báo - Đang bị khóa` };
    }

    if (shouldLockAccount) {
      return { color: 'orange', text: `${warningCount} cảnh báo - Đạt mốc khóa` };
    }

    if (warningCount === 0) {
      return { color: 'green', text: '0 cảnh báo' };
    }

    const remain = 3 - (warningCount % 3);
    return { 
      color: remain === 1 ? 'gold' : 'blue', 
      text: `${warningCount} cảnh báo - Còn ${remain} lần tới mốc khóa` 
    };
  };

  const getReportMeta = (totalReports) => {
    if (totalReports >= 6) {
      return { color: 'red', text: `${totalReports} lần bị báo` };
    }
    if (totalReports >= 3) {
      return { color: 'orange', text: `${totalReports} lần bị báo` };
    }
    if (totalReports >= 1) {
      return { color: 'gold', text: `${totalReports} lần bị báo` };
    }
    return { color: 'default', text: 'Chưa bị báo' };
  };

  const getProductWarningMeta = (warningActions, isRemoved) => {
    if (isRemoved) {
      return { color: 'red', text: 'Bài đã bị gỡ' };
    }
    if (warningActions >= 3) {
      return { color: 'red', text: `${warningActions} cảnh báo - Cần gỡ bài` };
    }
    if (warningActions >= 1) {
      return { color: 'gold', text: `${warningActions} cảnh báo` };
    }
    return { color: 'green', text: '0 cảnh báo' };
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'Chờ xử lý',
      reviewing: 'Đang xử lý',
      resolved: 'Đã giải quyết',
      dismissed: 'Đã bỏ qua'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="admin-module">
      <div className="admin-module__header">
        <h1>Quản lý báo cáo</h1>
        <p>Xử lý báo cáo từ người dùng trong hệ thống</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('thành công') ? 'alert-success' : 'alert-error'}`}>
          {message}
          <button onClick={() => setMessage('')} className="alert-close">×</button>
        </div>
      )}

      <div className="admin-module__filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Tìm theo nội dung..."
            value={filters.keyword}
            onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            onKeyPress={(e) => e.key === 'Enter' && fetchReports(1, pagination.pageSize)}
            className="filter-input"
          />
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="filter-select"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="reviewing">Đang xử lý</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="dismissed">Đã bỏ qua</option>
          </select>

          <select
            value={filters.reportType}
            onChange={(e) => setFilters(prev => ({ ...prev, reportType: e.target.value }))}
            className="filter-select"
          >
            <option value="">Tất cả loại</option>
            <option value="product">Sản phẩm</option>
            <option value="user">Người dùng</option>
          </select>

          <div className="filter-actions">
            <button 
              className="btn btn-primary"
              onClick={() => fetchReports(1, pagination.pageSize)}
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
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã BC</th>
                    <th>Người tố cáo</th>
                    <th>Đối tượng bị tố cáo</th>
                    <th>Mức vi phạm</th>
                    <th>Lý do</th>
                    <th className="status-col">Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report._id}>
                        <td>
                          <strong>{report._id.slice(-8).toUpperCase()}</strong>
                        </td>
                        <td>{report.reporterId?.fullName || 'N/A'}</td>
                        <td>{report.reportedUserId?.fullName || report.productId?.title || 'N/A'}</td>
                        <td>
                          <div className="violation-level">
                            {report.reportType === 'user' && report.reportedUserStats && (
                              <>
                                <span className={`violation-badge violation-${getWarningMeta(
                                  report.reportedUserStats.warningCount,
                                  report.reportedUserStats.isSuspended,
                                  report.reportedUserStats.shouldLockAccount
                                ).color}`}>
                                  {getWarningMeta(
                                    report.reportedUserStats.warningCount,
                                    report.reportedUserStats.isSuspended,
                                    report.reportedUserStats.shouldLockAccount
                                  ).text}
                                </span>
                                <span className={`violation-badge violation-${getReportMeta(report.reportedUserStats.totalReports).color}`}>
                                  {getReportMeta(report.reportedUserStats.totalReports).text}
                                </span>
                              </>
                            )}
                            {report.reportType === 'product' && report.productStats && (
                              <>
                                <span className={`violation-badge violation-${getProductWarningMeta(
                                  report.productStats.warningActions,
                                  report.productStats.isRemoved
                                ).color}`}>
                                  {getProductWarningMeta(
                                    report.productStats.warningActions,
                                    report.productStats.isRemoved
                                  ).text}
                                </span>
                                <span className={`violation-badge violation-${getReportMeta(report.productStats.totalReports).color}`}>
                                  {getReportMeta(report.productStats.totalReports).text}
                                </span>
                              </>
                            )}
                            {(!report.reportedUserStats && !report.productStats) && (
                              <span className="violation-badge violation-default">-</span>
                            )}
                          </div>
                        </td>
                        <td className="reason-text">{report.reason}</td>
                        <td className="status-col">
                          <span className={`status status-${report.status}`}>
                            {getStatusLabel(report.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => navigate(`/admin/reports/${report._id}`)}
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
                  onClick={() => fetchReports(pagination.current - 1, pagination.pageSize)}
                  disabled={pagination.current === 1}
                >
                  Trước
                </button>
                
                <span className="page-info">
                  Trang {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize)}
                </span>
                
                <button
                  className="btn btn-sm"
                  onClick={() => fetchReports(pagination.current + 1, pagination.pageSize)}
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

export default AdminReportList;
