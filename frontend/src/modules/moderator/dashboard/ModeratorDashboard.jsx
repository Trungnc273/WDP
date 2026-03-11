import { useEffect, useState } from "react";
import { Card, Statistic, Table, Tag, Typography, Alert } from "antd";
import {
  AlertOutlined,
  WalletOutlined,
  StarOutlined,
  ShoppingCartOutlined,
  UserDeleteOutlined
} from "@ant-design/icons";
import { getModeratorDashboard } from "../../../services/moderator.service";

const { Title, Text } = Typography;

const STAT_CARDS = [
  { key: "pendingReports", label: "Báo cáo chờ", icon: <AlertOutlined />, color: "#e74c3c" },
  { key: "pendingWithdrawals", label: "Rút tiền chờ", icon: <WalletOutlined />, color: "#f39c12" },
  { key: "reportedReviews", label: "Review bị tố", icon: <StarOutlined />, color: "#8e44ad" },
  { key: "openOrders", label: "Đơn đang mở", icon: <ShoppingCartOutlined />, color: "#2980b9" },
  { key: "suspendedUsers", label: "TK bị khóa", icon: <UserDeleteOutlined />, color: "#7f8c8d" },
];

const ModeratorDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    pendingReports: 0,
    pendingWithdrawals: 0,
    reportedReviews: 0,
    openOrders: 0,
    suspendedUsers: 0,
    recentReports: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getModeratorDashboard();
        setStats({
          pendingReports: data.pendingReports || 0,
          pendingWithdrawals: data.pendingWithdrawals || 0,
          reportedReviews: data.reportedReviews || 0,
          openOrders: data.openOrders || 0,
          suspendedUsers: data.suspendedUsers || 0,
          recentReports: data.recentReports || []
        });
      } catch (err) {
        setError(err.message || "Không tải được dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="mod-dashboard">
      <Title level={3} className="mod-dashboard-title">Tổng quan kiểm duyệt</Title>
      <Text type="secondary" className="mod-dashboard-subtitle">Theo dõi nhanh các đầu việc ưu tiên trong ngày</Text>

      {error && <Alert style={{ marginTop: 16 }} type="error" showIcon message={error} />}

      <div className="mod-stat-row">
        {STAT_CARDS.map((card) => (
          <Card key={card.key} loading={loading} className="mod-stat-card" bodyStyle={{ padding: "20px 16px" }}>
            <div className="mod-stat-icon" style={{ background: card.color }}>
              {card.icon}
            </div>
            <Statistic title={card.label} value={stats[card.key]} className="mod-stat-value" />
          </Card>
        ))}
      </div>

      <Card className="mod-panel" title="Báo cáo gần đây" loading={loading} style={{ marginTop: 20 }}>
        <Table
          className="mod-table"
          rowKey="_id"
          pagination={false}
          dataSource={stats.recentReports}
          columns={[
            { title: "Người báo cáo", dataIndex: ["reporterId", "fullName"] },
            {
              title: "Đối tượng",
              render: (_, record) => record.reportedUserId?.fullName || record.productId?.title || "N/A"
            },
            { title: "Lý do", dataIndex: "reason", ellipsis: true },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 130,
              render: (status) => (
                <Tag className="mod-status-pill" color={status === "pending" ? "orange" : status === "reviewing" ? "blue" : status === "resolved" ? "green" : "default"}>
                  {status === "pending" ? "Chờ xử lý" : status === "reviewing" ? "Đang xử lý" : status === "resolved" ? "Đã giải quyết" : "Đã bỏ qua"}
                </Tag>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default ModeratorDashboard;
