import { Menu, Typography } from "antd";
import {
  DashboardOutlined,
  FlagOutlined,
  ShoppingOutlined,
  StarOutlined,
  BankOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

const { Text } = Typography;

const ModeratorSidebar = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Chuẩn hóa route con để menu luôn highlight đúng ở trang chi tiết.
  const getActiveKey = () => {
    if (location.pathname === "/moderator" || location.pathname.startsWith("/moderator/dashboard")) {
      return "/moderator/dashboard";
    }
    if (location.pathname.startsWith("/moderator/reports")) return "/moderator/reports";
    if (location.pathname.startsWith("/moderator/orders")) return "/moderator/orders";
    if (location.pathname.startsWith("/moderator/reviews")) return "/moderator/reviews";
    if (location.pathname.startsWith("/moderator/withdrawals")) return "/moderator/withdrawals";
    if (location.pathname.startsWith("/moderator/disputes")) return "/moderator/disputes";
    return "/moderator/dashboard";
  };

  const handleClick = (e) => {
    // Điều hướng route và đóng drawer trên mobile (nếu có truyền callback).
    navigate(e.key);
    if (onNavigate) onNavigate();
  };

  return (
    <div className="moderator-sidebar">
      <div className="moderator-brand">
        <div className="moderator-brand-badge">M</div>
        <div>
          <div className="moderator-brand-title">Mod Panel</div>
          <Text type="secondary">Bảng điều khiển kiểm duyệt</Text>
        </div>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[getActiveKey()]}
        onClick={handleClick}
        className="moderator-menu"
        items={[
          {
            key: "/moderator/dashboard",
            icon: <DashboardOutlined />,
            label: "Tổng quan",
          },
          {
            key: "/moderator/reports",
            icon: <FlagOutlined />,
            label: "Quản lý Báo cáo",
          },
          {
            key: "/moderator/orders",
            icon: <ShoppingOutlined />,
            label: "Quản lý Đơn hàng",
          },
          {
            key: "/moderator/reviews",
            icon: <StarOutlined />,
            label: "Đánh giá & Nhận xét",
          },
          {
            key: "/moderator/withdrawals",
            icon: <BankOutlined />,
            label: "Yêu cầu Rút tiền",
          },
          {
            key: "/moderator/disputes",
            icon: <SafetyCertificateOutlined />,
            label: "Giải quyết Tranh chấp",
          },
        ]}
      />
    </div>
  );
};

export default ModeratorSidebar;