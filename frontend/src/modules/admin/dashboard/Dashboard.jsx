import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TeamOutlined,
  SafetyOutlined,
  UserDeleteOutlined,
  WalletOutlined,
  FlagOutlined,
  StarOutlined,
  AlertOutlined,
  UserOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
  BarChartOutlined,
  FileSearchOutlined,
  IssuesCloseOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../hooks/useAuth';
import { adminUserApi } from '../../../services/adminApi';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setError('');
      const response = await adminUserApi.getAdminDashboardStats();
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setError('Không thể tải dữ liệu tổng quan. Vui lòng thử lại sau ít phút.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Đang tải tổng quan quản trị...</div>;
  }

  const {
    userStats = {},
    moderationStats = {}
  } = dashboardStats;

  const {
    totalUsers = 0,
    activeUsers = 0,
    suspendedUsers = 0,
    usersByRole = {}
  } = userStats;

  const {
    pendingReports = 0,
    reviewingReports = 0,
    unresolvedReports = 0,
    pendingWithdrawals = 0,
    pendingReviews = 0,
    openOrders = 0,
    pendingDisputes = 0,
    recentReports = []
  } = moderationStats;

  const adminCount = usersByRole.admin || 0;
  const moderatorCount = usersByRole.moderator || 0;
  const userCount = usersByRole.user || 0;

  const quickMetrics = [
    {
      key: 'totalUsers',
      title: 'Tổng người dùng',
      value: totalUsers,
      subtitle: `${activeUsers} đang hoạt động`,
      tone: 'ocean',
      icon: <TeamOutlined />,
      route: '/admin/users'
    },
    {
      key: 'moderationQueue',
      title: 'Hàng chờ kiểm duyệt',
      value: unresolvedReports,
      subtitle: `${pendingReports} chờ duyệt, ${reviewingReports} đang xử lý`,
      tone: 'amber',
      icon: <SafetyOutlined />,
      route: '/admin/reports'
    },
    {
      key: 'riskAccounts',
      title: 'Tài khoản hạn chế bán',
      value: suspendedUsers,
      subtitle: 'Theo dõi vi phạm đang áp dụng',
      tone: 'rose',
      icon: <UserDeleteOutlined />,
      route: '/admin/users?status=selling_restricted'
    },
    {
      key: 'financeQueue',
      title: 'Rút tiền chờ duyệt',
      value: pendingWithdrawals,
      subtitle: 'Ưu tiên SLA tài chính',
      tone: 'teal',
      icon: <WalletOutlined />,
      route: '/admin/withdrawals'
    }
  ];

  const priorityItems = [
    {
      key: 'reports',
      label: 'Báo cáo chưa xử lý',
      value: unresolvedReports,
      tone: unresolvedReports > 10 ? 'critical' : unresolvedReports > 0 ? 'warning' : 'ok',
      route: '/admin/reports',
      cta: 'Mở danh sách báo cáo',
      icon: <FlagOutlined />
    },
    {
      key: 'withdrawals',
      label: 'Yêu cầu rút tiền chờ duyệt',
      value: pendingWithdrawals,
      tone: pendingWithdrawals > 5 ? 'critical' : pendingWithdrawals > 0 ? 'warning' : 'ok',
      route: '/admin/withdrawals',
      cta: 'Đi tới duyệt rút tiền',
      icon: <WalletOutlined />
    },
    {
      key: 'reviews',
      label: 'Đánh giá chờ kiểm duyệt',
      value: pendingReviews,
      tone: pendingReviews > 10 ? 'warning' : 'ok',
      route: '/admin/reviews',
      cta: 'Xử lý đánh giá',
      icon: <StarOutlined />
    },
    {
      key: 'disputes',
      label: 'Tranh chấp đang chờ xử lý',
      value: pendingDisputes,
      tone: pendingDisputes > 0 ? 'warning' : 'ok',
      route: '/admin/disputes',
      cta: 'Mở khu vực tranh chấp',
      icon: <AlertOutlined />
    }
  ];

  const operationalBlocks = [
    {
      key: 'users',
      title: 'Nhân sự hệ thống',
      icon: <UserOutlined />,
      metrics: [
        { label: 'Admin', value: adminCount },
        { label: 'Moderator', value: moderatorCount },
        { label: 'User', value: userCount }
      ]
    },
    {
      key: 'orders',
      title: 'Vận hành giao dịch',
      icon: <CheckCircleOutlined />,
      metrics: [
        { label: 'Đơn hàng đang mở', value: openOrders },
        { label: 'Báo cáo chờ duyệt', value: pendingReports },
        { label: 'Báo cáo đang xử lý', value: reviewingReports }
      ]
    }
  ];

  const quickActions = [
    {
      key: 'users',
      title: 'Quản lý người dùng',
      desc: 'Theo dõi trạng thái, phân quyền và xử lý vi phạm.',
      route: '/admin/users',
      icon: <UserOutlined />
    },
    {
      key: 'reports',
      title: 'Kiểm duyệt báo cáo',
      desc: 'Ưu tiên các báo cáo mới để giảm tồn đọng.',
      route: '/admin/reports',
      icon: <FileSearchOutlined />
    },
    {
      key: 'withdrawals',
      title: 'Duyệt rút tiền',
      desc: 'Đảm bảo tiến độ thanh toán và trải nghiệm người dùng.',
      route: '/admin/withdrawals',
      icon: <IssuesCloseOutlined />
    },
    {
      key: 'revenue',
      title: 'Báo cáo doanh thu',
      desc: 'Xem nhanh hiệu suất và dòng tiền nền tảng.',
      route: '/admin/revenue',
      icon: <BarChartOutlined />
    }
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-topbar">
        <div className="dashboard-topbar__text">
          <h1>Tổng quan vận hành quản trị</h1>
          <p>Xin chào {user?.fullName || 'Administrator'} </p>
        </div>
        <button className="dashboard-refresh" onClick={loadDashboardStats}>
          <ReloadOutlined /> Làm mới dữ liệu
        </button>
      </div>

      {error ? <div className="dashboard-error">{error}</div> : null}

      <div className="dashboard-kpi-grid">
        {quickMetrics.map((metric) => (
          <Link
            key={metric.key}
            to={metric.route}
            className={`dashboard-kpi-card dashboard-kpi-card--${metric.tone}`}
            aria-label={`Mở ${metric.title}`}
          >
            <div className="dashboard-kpi-header">
              <div className="dashboard-kpi-icon">{metric.icon}</div>
              <div className="dashboard-kpi-title">{metric.title}</div>
            </div>
            <div className="dashboard-kpi-value">{metric.value}</div>
            <div className="dashboard-kpi-subtitle">{metric.subtitle}</div>
          </Link>
        ))}
      </div>

      <div className="dashboard-sections">
        <section className="dashboard-section dashboard-priority">
          <div className="dashboard-section__header">
            <h2>Hạng mục ưu tiên</h2>
            
          </div>
          <div className="priority-list">
            {priorityItems.map((item) => (
              <div key={item.key} className={`priority-item priority-item--${item.tone}`}>
                <div className="priority-item__main">
                  <div className="priority-item__icon">{item.icon}</div>
                  <div>
                    <div className="priority-item__label">{item.label}</div>
                    <div className="priority-item__value">{item.value}</div>
                  </div>
                </div>
                <Link to={item.route} className="priority-item__link">
                  {item.cta} <ArrowRightOutlined />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-section dashboard-operations">
          <div className="dashboard-section__header">
            <h2>Snapshot vận hành</h2>
        
          </div>

          <div className="operations-grid">
            {operationalBlocks.map((block) => (
              <div key={block.key} className="operation-card">
                <h3><span>{block.icon}</span>{block.title}</h3>
                <div className="operation-metrics">
                  {block.metrics.map((metric) => (
                    <div key={metric.label} className="operation-metric">
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-footer-grid">
        <section className="dashboard-section">
          <div className="dashboard-section__header">
            <h2>Thao tác nhanh</h2>
            <p>Đi tới các module cần xử lý thường xuyên trong ngày.</p>
          </div>
          <div className="quick-actions-grid">
            {quickActions.map((action) => (
              <Link key={action.key} to={action.route} className="quick-action-card">
                <div className="quick-action-card__icon">{action.icon}</div>
                <h3>{action.title}</h3>
                <p>{action.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section__header">
            <h2>Báo cáo mới gần đây</h2>
            <p>Các báo cáo mới nhất cần theo dõi ngay.</p>
          </div>

          {recentReports.length === 0 ? (
            <div className="recent-empty">Không có báo cáo đang chờ xử lý.</div>
          ) : (
            <div className="recent-report-list">
              {recentReports.map((report) => (
                <div key={report._id} className="recent-report-item">
                  <div className="recent-report-item__content">
                    <strong>{report.type || 'Báo cáo'}</strong>
                    <span>{report.reason || 'Không có mô tả bổ sung'}</span>
                  </div>
                  <Link to="/admin/reports" className="recent-report-item__link">
                    Xem chi tiết
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
