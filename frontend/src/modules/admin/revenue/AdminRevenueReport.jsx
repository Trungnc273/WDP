import React, { useEffect, useMemo, useState } from 'react';
import { getModeratorRevenueReport } from '../../../services/moderator.service';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
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

  const monthlyChartData = (report?.breakdown || []).map((item) => ({
    ...item,
    periodLabel: item.period?.slice(2).replace('-', '/') || ''
  }));

  const topProductChartData = (report?.topProducts || []).slice(0, 6).map((item) => ({
    name: String(item.title || 'N/A').slice(0, 18),
    grossRevenue: Number(item.grossRevenue || 0)
  }));

  const revenueSplitData = [
    { name: 'Phí hệ thống', value: Number(summary.platformRevenue || 0) },
    { name: 'Chi trả người bán', value: Number(summary.sellerPayout || 0) }
  ];

  const platformRatePercent = summary.grossRevenue > 0
    ? (Number(summary.platformRevenue || 0) / Number(summary.grossRevenue || 1)) * 100
    : 0;

  const splitColors = ['#ef4444', '#22c55e'];

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
              <div className="meta">Đơn đã hoàn thành trong kỳ lọc</div>
            </div>
            <div className="revenue-overview-card">
              <div className="label">Doanh thu gộp</div>
              <div className="value">{formatCurrency(summary.grossRevenue)}</div>
              <div className="meta">Tổng tiền người mua đã thanh toán</div>
            </div>
            <div className="revenue-overview-card">
              <div className="label">Doanh thu hệ thống (5%)</div>
              <div className="value">{formatCurrency(summary.platformRevenue)}</div>
              <div className="meta">Tỷ lệ thực tế: {platformRatePercent.toFixed(2)}%</div>
            </div>
            <div className="revenue-overview-card">
              <div className="label">Chi trả người bán (95%)</div>
              <div className="value">{formatCurrency(summary.sellerPayout)}</div>
              <div className="meta">Doanh thu chuyển về ví người bán</div>
            </div>
          </div>

          <div className="revenue-chart-grid">
            <div className="admin-module__content revenue-chart-card">
              <h3>Xu hướng doanh thu theo tháng</h3>
              <div className="revenue-chart-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={monthlyChartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grossRevenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.32} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="platformRevenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="periodLabel" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `${Math.round(v / 1000000)}M`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Area type="monotone" dataKey="grossRevenue" name="Doanh thu gộp" stroke="#2563eb" fill="url(#grossRevenueFill)" strokeWidth={2} />
                    <Area type="monotone" dataKey="platformRevenue" name="Phí nền tảng" stroke="#ef4444" fill="url(#platformRevenueFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="admin-module__content revenue-chart-card">
              <h3>Cơ cấu phân bổ doanh thu</h3>
              <div className="revenue-chart-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Pie data={revenueSplitData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={52} label>
                      {revenueSplitData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={splitColors[index % splitColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="admin-module__content revenue-chart-card">
            <h3>Top sản phẩm theo doanh thu gộp</h3>
            <div className="revenue-chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topProductChartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `${Math.round(v / 1000000)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="grossRevenue" name="Doanh thu gộp" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
