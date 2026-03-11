import { Layout, Grid, Drawer } from "antd";
import { Outlet, Navigate } from "react-router-dom";
import { useState } from "react";
import ModeratorSidebar from "./ModeratorSidebar";
import ModeratorHeader from "./ModeratorHeader";
import ModeratorFooter from "./ModeratorFooter";
import { useAuth } from "../../../hooks/useAuth";
import "./moderator-layout.css";
import "../moderator-pages.css";

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const ModeratorLayout = () => {
  const screens = useBreakpoint();
  const [openDrawer, setOpenDrawer] = useState(false);
  const { user } = useAuth();

  // Kiểm tra lại quyền ngay tại layout để chặn truy cập sai vai trò.
  if (!user || (user.role !== "moderator" && user.role !== "admin")) {
    return <Navigate to="/" replace />;
  }

  const isMobile = !screens.lg;

  return (
    <Layout className="moderator-shell">
      {!isMobile && (
        <Sider width={280} className="moderator-sider" theme="light">
          <ModeratorSidebar />
        </Sider>
      )}

      <Layout className="moderator-main">
        <ModeratorHeader onOpenMenu={() => setOpenDrawer(true)} isMobile={isMobile} />
        <Content className="moderator-content">
          <div className="moderator-content-inner">
            <Outlet />
          </div>
        </Content>
        <ModeratorFooter />
      </Layout>

      <Drawer
        // Drawer điều hướng mobile dùng cùng menu với desktop để tránh lệch chức năng.
        title="Điều hướng kiểm duyệt"
        placement="left"
        open={isMobile && openDrawer}
        onClose={() => setOpenDrawer(false)}
        bodyStyle={{ padding: 0 }}
      >
        <ModeratorSidebar onNavigate={() => setOpenDrawer(false)} />
      </Drawer>
    </Layout>
  );
};

export default ModeratorLayout;