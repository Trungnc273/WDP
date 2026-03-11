import { Layout, Typography } from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";

const { Footer } = Layout;
const { Text } = Typography;

const ModeratorFooter = () => {
  return (
    <Footer className="moderator-footer">
      <div className="moderator-footer-inner">
        <div className="moderator-footer-brand">
          <SafetyCertificateOutlined className="moderator-footer-icon" />
          <Text className="moderator-footer-text">ReFlow Moderation</Text>
        </div>
        <Text className="moderator-footer-divider">|</Text>
        <Text className="moderator-footer-text">Trung tam kiem duyet</Text>
        <Text className="moderator-footer-divider">|</Text>
        <Text className="moderator-footer-text">&copy; {new Date().getFullYear()}</Text>
      </div>
    </Footer>
  );
};

export default ModeratorFooter;
