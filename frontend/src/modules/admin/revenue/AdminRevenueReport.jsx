import React, { useEffect, useMemo, useState } from 'react';
import { getModeratorRevenueReport } from '../../../services/moderator.service';
import '../AdminModules.css';

const AdminRevenueReport = () => {
  const today = useMemo(() => new Date(), []);
  const defaultFrom = useMemo(
    () => new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10),
    [today]
  );
  const defaultTo = useMemo(() => today.toISOString().slice(0, 10), [today]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(Number(value || 0));

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString('vi-VN');
  };

  const fetchRevenueReport = async (from, to) => {
    setLoading(true);
    setError('');
    try {
      const data = await getModeratorRevenueReport({ from, to });
      setReport(data);
    } catch (err) {
      setError(err.message || 'Không thể tải báo cáo doanh thu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueReport(defaultFrom, defaultTo);
  }, [defaultFrom, defaultTo]);

  const handleApplyFilter = () => {
    if (!fromDate || !toDate) {
      setError('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc');
      return;
    }
    if (fromDate > toDate) {
      setError('Ngày bắt đầu không được lớn hơn ngày kết thúc');
      return;
    }
    fetchRevenueReport(fromDate, toDate);
  };

  const handleResetFilter = () => {
    setFromDate(defaultFrom);
    setToDate(defaultTo);
    fetchRevenueReport(defaultFrom, defaultTo);
  };

  const summary = report?.summary || {
    completedOrders: 0,
    grossRevenue: 0,
    platformRevenue: 0,
    sellerPayout: 0
  };

  return (
    <div className="admin-module admin-revenue-report">
      <div className="admin-module__header">
        <h1>Báo cáo doanh thu</h1>
        <p>Phí nền tảng: 5% trên mỗi đơn hoàn tất. Người bán nhận 95%.</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}

      <div className="admin-module__filters">
        <div className="filter-group">
          <div className="form-group">
            <label>Từ ngày</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="form-group">
            <label>Đến ngày</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-actions">
            <button type="button" className="btn btn-primary" onClick={handleApplyFilter}>
              <i className="fas fa-filter"></i>
              Áp dụng
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleResetFilter}>
              <i className="fas fa-redo"></i>
              Mặc định
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          Đang tải báo cáo...
        </div>
      ) : (
        <>
          <div className="revenue-overview-grid">
            <div className="revenue-overview-card">
              <div className="label">Tổng đơn hoàn tất</div>
              <div className="value">{Number(summary.completedOrders || 0).toLocaleString('vi-VN')}</div>
            </div>
            <div className="revenue-overview-card">
              <div className="label">Doanh thu gộp</div>
              <div className="value">{formatCurrency(summary.grossRevenue)}</div>
            </div>
            <div className="revenue-overview-card">
              <div className="label">Doanh thu hệ thống (5%)</div>
              <div className="value">{formatCurrency(summary.platformRevenue)}</div>
            </div>
            <div className="revenue-overview-card">
              <div className="label">Chi trả người bán (95%)</div>
              <div className="value">{formatCurrency(summary.sellerPayout)}</div>
            </div>
          </div>

          <div className="admin-module__content revenue-section">
            <h3>Doanh thu theo tháng</h3>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Kỳ</th>
                    <th>Số đơn</th>
                    <th>Doanh thu gộp</th>
                    <th>Phí nền tảng</th>
                    <th>Chi trả người bán</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.breakdown || []).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-data">Không có dữ liệu</td>
                    </tr>
                  ) : (
                    (report?.breakdown || []).map((item) => (
                      <tr key={item.period}>
                        <td>{item.period}</td>
                        <td>{Number(item.completedOrders || 0).toLocaleString('vi-VN')}</td>
                        <td>{formatCurrency(item.grossRevenue)}</td>
                        <td>{formatCurrency(item.platformRevenue)}</td>
                        <td>{formatCurrency(item.sellerPayout)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-module__content revenue-section">
            <h3>Top sản phẩm mang doanh thu cao</h3>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Số đơn</th>
                    <th>Doanh thu gộp</th>
                    <th>Phí nền tảng</th>
                    <th>Chi trả người bán</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.topProducts || []).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-data">Không có dữ liệu</td>
                    </tr>
                  ) : (
                    (report?.topProducts || []).map((item) => (
                      <tr key={String(item.productId)}>
                        <td>{item.title}</td>
                        <td>{Number(item.completedOrders || 0).toLocaleString('vi-VN')}</td>
                        <td>{formatCurrency(item.grossRevenue)}</td>
                        <td>{formatCurrency(item.platformRevenue)}</td>
                        <td>{formatCurrency(item.sellerPayout)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-module__content revenue-section">
            <h3>Đơn hoàn tất gần đây</h3>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Sản phẩm</th>
                    <th>Người mua</th>
                    <th>Người bán</th>
                    <th>Doanh thu gộp</th>
                    <th>Phí 5%</th>
                    <th>Chi trả người bán</th>
                    <th>Hoàn tất lúc</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.recentOrders || []).length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-data">Không có dữ liệu</td>
                    </tr>
                  ) : (
                    (report?.recentOrders || []).map((order) => (
                      <tr key={String(order.orderId)}>
                        <td>{order.orderCode || String(order.orderId).slice(-8).toUpperCase()}</td>
                        <td>{order.productTitle}</td>
                        <td>{order.buyerName}</td>
                        <td>{order.sellerName}</td>
                        <td>{formatCurrency(order.grossRevenue)}</td>
                        <td>{formatCurrency(order.platformRevenue)}</td>
                        <td>{formatCurrency(order.sellerPayout)}</td>
                        <td>{formatDateTime(order.completedAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminRevenueReport;
