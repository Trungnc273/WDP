import { Card, Table, Tag, Button, Typography, Space, Select, Input, message } from "antd";
import { EyeOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getModeratorReports } from "../../../services/moderator.service";

const { Title } = Typography;

function getWarningMeta(warningCount, isSuspended, shouldLockAccount) {
  if (isSuspended) {
    return { color: "red", text: `${warningCount} cảnh báo - Đang bị khóa` };
  }

  if (shouldLockAccount) {
    return { color: "volcano", text: `${warningCount} cảnh báo - Đạt mốc khóa` };
  }

  if (warningCount === 0) {
    return { color: "green", text: "0 cảnh báo" };
  }

  const remain = 3 - (warningCount % 3);
  return { color: remain === 1 ? "gold" : "geekblue", text: `${warningCount} cảnh báo - Còn ${remain} lần tới mốc khóa` };
}

function getReportMeta(totalReports) {
  if (totalReports >= 6) {
    return { color: "red", text: `${totalReports} lần bị báo` };
  }
  if (totalReports >= 3) {
    return { color: "volcano", text: `${totalReports} lần bị báo` };
  }
  if (totalReports >= 1) {
    return { color: "gold", text: `${totalReports} lần bị báo` };
  }
  return { color: "default", text: "Chưa bị báo" };
}

function getProductWarningMeta(warningActions, isRemoved) {
  if (isRemoved) {
    return { color: "red", text: "Bài đã bị gỡ" };
  }
  if (warningActions >= 3) {
    return { color: "red", text: `${warningActions} cảnh báo - Cần gỡ bài` };
  }
  if (warningActions >= 1) {
    return { color: "gold", text: `${warningActions} cảnh báo` };
  }
  return { color: "green", text: "0 cảnh báo" };
}

const ModReportList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ status: "", reportType: "", keyword: "" });

  // Chuẩn hóa và kiểm tra từ khóa ngay tại UI trước khi gọi API.
  const sanitizeKeyword = (keyword) => String(keyword || "").trim();

  const validateKeyword = (keyword) => {
    if (keyword.length > 100) {
      throw new Error("Từ khóa tìm kiếm không được vượt quá 100 ký tự");
    }
  };

  // Tập trung gọi API danh sách tại một nơi để bộ lọc và phân trang luôn đồng nhất.
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
    } catch (error) {
      message.error(error.message || "Không thể tải danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    // Đưa bộ lọc về mặc định và tải lại toàn bộ dữ liệu.
    setFilters({ status: "", reportType: "", keyword: "" });
    fetchReports(1, pagination.pageSize);
  };

  useEffect(() => {
    fetchReports(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.reportType]);

  const columns = [
    {
      title: "Mã BC",
      dataIndex: "_id",
      key: "_id",
      render: (text) => <b>{String(text).slice(-8).toUpperCase()}</b>
    },
    {
      title: "Người tố cáo",
      dataIndex: ["reporterId", "fullName"],
      key: "reporter"
    },
    {
      title: "Đối tượng bị tố cáo",
      key: "target",
      render: (_, record) => record.reportedUserId?.fullName || record.productId?.title || "N/A"
    },
    {
      title: "Mức vi phạm",
      key: "risk",
      width: 260,
      render: (_, record) => {
        const userStats = record?.reportedUserStats || null;
        const productStats = record?.productStats || null;

        if (record.reportType === "user" && userStats) {
          const warningCount = Number(userStats.warningCount || 0);
          const totalReports = Number(userStats.totalReports || 0);
          const isSuspended = Boolean(userStats.isSuspended || userStats.isSellingRestricted);
          const shouldLockAccount = Boolean(userStats.shouldLockAccount);
          const warningMeta = getWarningMeta(warningCount, isSuspended, shouldLockAccount);
          const reportMeta = getReportMeta(totalReports);

          return (
            <Space direction="vertical" size={4}>
              <Tag className="mod-status-pill" color={warningMeta.color}>{warningMeta.text}</Tag>
              <Tag className="mod-status-pill" color={reportMeta.color}>{reportMeta.text}</Tag>
            </Space>
          );
        }

        if (record.reportType === "product" && productStats) {
          const warningActions = Number(productStats.warningActions || 0);
          const totalReports = Number(productStats.totalReports || 0);
          const isRemoved = Boolean(productStats.isRemoved);
          const warningMeta = getProductWarningMeta(warningActions, isRemoved);
          const reportMeta = getReportMeta(totalReports);

          return (
            <Space direction="vertical" size={4}>
              <Tag className="mod-status-pill" color={warningMeta.color}>{warningMeta.text}</Tag>
              <Tag className="mod-status-pill" color={reportMeta.color}>{reportMeta.text}</Tag>
            </Space>
          );
        }

        // Fallback cho dữ liệu cũ/không đồng nhất: tránh để cột hiển thị trống.
        if (record.reportType === "product" && userStats) {
          const warningCount = Number(userStats.warningCount || 0);
          const totalReports = Number(userStats.totalReports || 0);
          const warningMeta = getWarningMeta(warningCount, Boolean(userStats.isSuspended || userStats.isSellingRestricted), Boolean(userStats.shouldLockAccount));
          const reportMeta = getReportMeta(totalReports);

          return (
            <Space direction="vertical" size={4}>
              <Tag className="mod-status-pill" color="default">Thiếu dữ liệu sản phẩm</Tag>
              <Tag className="mod-status-pill" color={warningMeta.color}>{warningMeta.text}</Tag>
              <Tag className="mod-status-pill" color={reportMeta.color}>{reportMeta.text}</Tag>
            </Space>
          );
        }

        if (record.reportType === "user") {
          return <Tag className="mod-status-pill" color="default">Thiếu dữ liệu người dùng</Tag>;
        }

        if (record.reportType === "product") {
          return <Tag className="mod-status-pill" color="default">Thiếu dữ liệu sản phẩm</Tag>;
        }

        return <span style={{ color: "#8c8c8c" }}>-</span>;
      }
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      render: (text) => <span className="mod-danger-text">{text}</span>
    },
    { 
      title: "Trạng thái", 
      dataIndex: "status", 
      key: "status",
      width: 150,
      render: (status) => {
        if (status === "pending") return <Tag className="mod-status-pill" color="warning">Chờ xử lý</Tag>;
        if (status === "reviewing") return <Tag className="mod-status-pill" color="processing">Đang xử lý</Tag>;
        if (status === "resolved") return <Tag className="mod-status-pill" color="success">Đã giải quyết</Tag>;
        return <Tag className="mod-status-pill" color="default">Đã bỏ qua</Tag>;
      }
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<EyeOutlined />} 
          onClick={() => navigate(`/moderator/reports/${record._id}`)}
        >
          Chi tiết
        </Button>
      )
    }
  ];

  return (
    <Card className="mod-panel">
      <div className="mod-toolbar">
        <Title level={4} style={{ margin: 0 }}>Danh sách Báo cáo</Title>
        <div className="mod-filter-row">
          <Input
            placeholder="Tìm theo nội dung..."
            prefix={<SearchOutlined />}
            value={filters.keyword}
            onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
            onPressEnter={() => fetchReports(1, pagination.pageSize)}
            style={{ width: 220 }}
          />
          <Select
            placeholder="Trạng thái"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => setFilters((prev) => ({ ...prev, status: value || "" }))}
            options={[
              { value: "pending", label: "Chờ xử lý" },
              { value: "reviewing", label: "Đang xử lý" },
              { value: "resolved", label: "Đã giải quyết" },
              { value: "dismissed", label: "Đã bỏ qua" }
            ]}
          />
          <Select
            placeholder="Loại báo cáo"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => setFilters((prev) => ({ ...prev, reportType: value || "" }))}
            options={[
              { value: "product", label: "Sản phẩm" },
              { value: "user", label: "Người dùng" }
            ]}
          />
          <div className="mod-filter-actions">
            <Button type="primary" onClick={() => fetchReports(1, pagination.pageSize)}>Lọc</Button>
            <Button icon={<ReloadOutlined />} className="mod-reset-btn" onClick={handleResetFilters}>Reset</Button>
          </div>
        </div>
      </div>
      <Table 
        className="mod-table"
        columns={columns} 
        dataSource={reports} 
        rowKey="_id" 
        loading={loading}
        pagination={pagination}
        onChange={(pager) => fetchReports(pager.current, pager.pageSize)}
      />
    </Card>
  );
};

export default ModReportList;
