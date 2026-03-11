import { Card, Table, Tag, Button, Typography, Space, Select, Input, message } from "antd";
import { EyeOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getModeratorOrders } from "../../../services/moderator.service";

const { Title } = Typography;

const ModOrderList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ status: "", keyword: "" });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Chuẩn hóa và validate từ khóa để tránh gửi input lỗi lên backend.
  const sanitizeKeyword = (keyword) => String(keyword || "").trim();

  const validateKeyword = (keyword) => {
    if (keyword.length > 100) {
      throw new Error("Từ khóa tìm kiếm không được vượt quá 100 ký tự");
    }
  };

  // Một điểm gọi API duy nhất giúp trạng thái bảng ổn định sau khi lọc/phân trang.
  const fetchOrders = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const keyword = sanitizeKeyword(filters.keyword);
      validateKeyword(keyword);

      const result = await getModeratorOrders({
        page,
        limit: pageSize,
        status: filters.status || undefined,
        keyword: keyword || undefined
      });
      setOrders(result.items);
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.limit,
        total: result.pagination.total
      });
    } catch (error) {
      message.error(error.message || "Không thể tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    // Reset toàn bộ điều kiện lọc về trạng thái ban đầu.
    setFilters({ status: "", keyword: "" });
    fetchOrders(1, pagination.pageSize);
  };

  useEffect(() => {
    fetchOrders(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status]);

  const STATUS_COLOR = {
    awaiting_payment: "gold",
    paid: "cyan",
    shipped: "processing",
    completed: "green",
    cancelled: "red",
    disputed: "orange"
  };

  const STATUS_LABEL = {
    awaiting_payment: "Chờ thanh toán",
    paid: "Đã thanh toán",
    shipped: "Đang giao",
    completed: "Hoàn tất",
    cancelled: "Đã hủy",
    disputed: "Đang tranh chấp"
  };

  const columns = [
    { title: "Mã ĐH", dataIndex: "_id", key: "_id", render: (text) => <b>{String(text).slice(-8).toUpperCase()}</b> },
    { title: "Người mua", dataIndex: ["buyerId", "fullName"], key: "buyer" },
    { title: "Người bán", dataIndex: ["sellerId", "fullName"], key: "seller" },
    {
      title: "Tổng tiền",
      dataIndex: "totalToPay",
      key: "total",
      render: (value) => <span className="mod-money-text">{Number(value || 0).toLocaleString("vi-VN")} đ</span>
    },
    { 
      title: "Trạng thái", 
      dataIndex: "status", 
      key: "status",
      render: (status) => (
        <Tag className="mod-status-pill" color={STATUS_COLOR[status] || "default"}>
          {STATUS_LABEL[status] || status}
        </Tag>
      )
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/moderator/orders/${record._id}`)}
          >
            Chi tiết
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Card className="mod-panel">
      <div className="mod-toolbar">
        <Title level={4} style={{ margin: 0 }}>Danh sách Đơn hàng cần kiểm duyệt</Title>
        <div className="mod-filter-row">
          <Input
            placeholder="Tìm đơn hàng..."
            prefix={<SearchOutlined />}
            value={filters.keyword}
            onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
            onPressEnter={() => fetchOrders(1, pagination.pageSize)}
            style={{ width: 220 }}
          />
          <Select
            placeholder="Trạng thái"
            allowClear
            style={{ width: 180 }}
            onChange={(value) => setFilters((prev) => ({ ...prev, status: value || "" }))}
            options={[
              { value: "awaiting_payment", label: "Chờ thanh toán" },
              { value: "paid", label: "Đã thanh toán" },
              { value: "shipped", label: "Đang giao" },
              { value: "completed", label: "Hoàn tất" },
              { value: "cancelled", label: "Đã hủy" },
              { value: "disputed", label: "Đang tranh chấp" }
            ]}
          />
          <div className="mod-filter-actions">
            <Button type="primary" onClick={() => fetchOrders(1, pagination.pageSize)}>Lọc</Button>
            <Button icon={<ReloadOutlined />} className="mod-reset-btn" onClick={handleResetFilters}>Reset</Button>
          </div>
        </div>
      </div>
      <Table
        className="mod-table"
        columns={columns}
        dataSource={orders}
        rowKey="_id"
        loading={loading}
        pagination={pagination}
        onChange={(pager) => fetchOrders(pager.current, pager.pageSize)}
      />
    </Card>
  );
};

export default ModOrderList;