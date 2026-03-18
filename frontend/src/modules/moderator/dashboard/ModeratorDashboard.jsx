import { useEffect, useState } from "react";
import { Typography, Alert, Button, Badge, Tag, Card } from "antd";
import {
  FlagOutlined,
  ShoppingOutlined,
  StarOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined,
  IdcardOutlined,
  ArrowRightOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getModeratorDashboard } from "../../../services/moderator.service";

const { Title, Text } = Typography;

const ModeratorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Gom các chỉ số cần hiển thị ngoài dashboard thành một state duy nhất.
  const [stats, setStats] = useState({
    unresolvedReports: 0,
    pendingReports: 0,
    reviewingReports: 0,
    openOrders: 0,
    pendingReviews: 0,
    pendingWithdrawals: 0,
    pendingDisputes: 0,
    pendingProducts: 0,
    pendingKYC: 0,
    badReviews: 0
  });

  useEffect(() => {
    // Tải số liệu tổng quan một lần khi mở trang.
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getModeratorDashboard();
        setStats({
          unresolvedReports: data.unresolvedReports || 0,
          pendingReports: data.pendingReports || 0,
          reviewingReports: data.reviewingReports || 0,
          openOrders: data.openOrders || 0,
          pendingReviews: (data.pendingReviews ?? data.reportedReviews) || 0,
          badReviews: data.badReviews || 0,
          pendingWithdrawals: data.pendingWithdrawals || 0,
          pendingDisputes: data.pendingDisputes || 0,
          pendingProducts: data.pendingProducts || 0,
          pendingKYC: data.pendingKYC || 0
        });
      } catch (err) {
        setError(err.message || "Không tải được dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Cấu hình card theo từng module để dễ thay đổi nhãn/màu/route ở một chỗ.
  const SECTION_CARDS = [
    {
      key: "reports",
      label: "Quản lý Báo cáo",
      icon: <FlagOutlined />,
      color: "#e74c3c",
      bg: "#fff5f5",
      route: "/moderator/reports",
      count: stats.unresolvedReports,
      countLabel: "chờ xử lý",
      sub: [
        { label: "Chờ duyệt", value: stats.pendingReports, color: "orange" },
        { label: "Đang xử lý", value: stats.reviewingReports, color: "blue" }
      ]
    },
    {
      key: "orders",
      label: "Quản lý Đơn hàng",
      icon: <ShoppingOutlined />,
      color: "#2980b9",
      bg: "#f0f6ff",
      route: "/moderator/orders",
      count: stats.openOrders,
      countLabel: "đơn đang mở",
      sub: []
    },
    {
      key: "reviews",
      label: "Đánh giá & Nhận xét",
      icon: <StarOutlined />,
      color: "#8e44ad",
      bg: "#faf0ff",
      route: "/moderator/reviews?status=active&assessment=pending",
      count: stats.pendingReviews,
      countLabel: "chờ duyệt",
      sub: []
    },
    {
      key: "withdrawals",
      label: "Yêu cầu Rút tiền",
      icon: <BankOutlined />,
      color: "#f39c12",
      bg: "#fffbf0",
      route: "/moderator/withdrawals",
      count: stats.pendingWithdrawals,
      countLabel: "chờ duyệt",
      sub: []
    },
    {
      key: "disputes",
      label: "Giải quyết Tranh chấp",
      icon: <SafetyCertificateOutlined />,
      color: "#c0392b",
      bg: "#fff8f8",
      route: "/moderator/disputes",
      count: stats.pendingDisputes,
      countLabel: "chưa xử lý",
      sub: []
    },
    {
      key: "products",
      label: "Duyệt Sản phẩm",
      icon: <AppstoreOutlined />,
      color: "#27ae60",
      bg: "#f0fff6",
      route: "/moderator/products",
      count: stats.pendingProducts,
      countLabel: "chờ duyệt",
      sub: []
    },
    {
      key: "kyc",
      label: "Xác minh KYC",
      icon: <IdcardOutlined />,
      color: "#16a085",
      bg: "#f0fdfb",
      route: "/moderator/kyc",
      count: stats.pendingKYC,
      countLabel: "chờ xét duyệt",
      sub: []
    }
  ];

  return (
    <div className="mod-dashboard">
      <Card className="mod-panel mod-dashboard-frame">
        <div className="mod-dashboard-header">
          <Title level={3} className="mod-dashboard-title">Tổng quan kiểm duyệt</Title>
          <Text type="secondary" className="mod-dashboard-subtitle">Theo dõi nhanh các đầu việc ưu tiên trong ngày</Text>
        </div>

        {error && <Alert style={{ marginBottom: 16 }} type="error" showIcon message={error} />}

        <div className="mod-overview-grid">
          {/* Render dashboard theo cấu hình SECTION_CARDS thay vì hard-code từng khối. */}
          {SECTION_CARDS.map((card) => (
            <div
              key={card.key}
              className="mod-overview-card"
              style={{ background: card.bg, borderLeft: `4px solid ${card.color}` }}
            >
              <div className="mod-overview-card-header">
                <div className="mod-overview-icon" style={{ background: card.color }}>
                  {card.icon}
                </div>
                <div className="mod-overview-card-info">
                  <div className="mod-overview-card-label">{card.label}</div>
                  <div className="mod-overview-card-count" style={{ color: card.color }}>
                    {loading ? "..." : card.count}
                    <span className="mod-overview-count-label">&nbsp;{card.countLabel}</span>
                  </div>
                </div>
                <Badge
                  count={loading ? 0 : card.count}
                  showZero={false}
                  style={{ background: card.color }}
                />
              </div>

              {card.sub.length > 0 && (
                <div className="mod-overview-sub">
                  {card.sub.map((s) => (
                    <Tag key={s.label} color={s.color} className="mod-status-pill">
                      {s.label}: {loading ? "..." : s.value}
                    </Tag>
                  ))}
                </div>
              )}

              <Button
                type="link"
                icon={<ArrowRightOutlined />}
                className="mod-overview-link"
                style={{ color: card.color }}
                onClick={() => navigate(card.route)}
              >
                Xem danh sách
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ModeratorDashboard;
