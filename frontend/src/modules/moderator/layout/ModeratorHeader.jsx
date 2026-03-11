import { Layout, Space, Dropdown, Typography, Button, Tag } from "antd";
import {
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

const { Header } = Layout;
const { Text, Title } = Typography;

const ModeratorHeader = ({ onOpenMenu, isMobile }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    if (logout) logout();
    navigate("/login");
  };

  const handleGoProfile = () => {
    navigate("/moderator/profile");
  };

  const items = [
    {
      key: "profile",
      label: "Profile",
      icon: <UserOutlined />,
      onClick: handleGoProfile,
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Header className="moderator-header">
      <div className="moderator-header-left">
        {isMobile && (
          <Button
            className="moderator-menu-trigger"
            type="text"
            icon={<MenuOutlined />}
            onClick={onOpenMenu}
          />
        )}

        <div className="moderator-header-badge">
          <SafetyCertificateOutlined />
        </div>

        <div className="moderator-header-text">
          <Title level={5} className="moderator-header-title">
            Bảng điều khiển kiểm duyệt
          </Title>
        </div>
      </div>

      <Space size={14}>
        <Tag className="moderator-role-tag" color="gold">
          {user?.role === "admin" ? "Quản trị viên" : "Kiểm duyệt viên"}
        </Tag>

        <div className="moderator-notify-chip">
          <BellOutlined />
        </div>

        <Dropdown menu={{ items }} placement="bottomRight">
          <Space className="moderator-user-chip">
            <div className="moderator-avatar">
              <UserOutlined />
            </div>

            {!isMobile && (
              <Text strong>{user?.fullName || "Kiểm duyệt viên"}</Text>
            )}
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default ModeratorHeader;