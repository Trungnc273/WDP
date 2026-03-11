import { useEffect, useState } from "react";
import { Card, Table, Tag, Button, Typography, Select, Space, message } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getModeratorDisputes } from "../../../services/moderator.service";

const { Title } = Typography;

const ModDisputeList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [disputes, setDisputes] = useState([]);
  const [status, setStatus] = useState("pending");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Tập trung hàm tải dữ liệu để bộ lọc và phân trang luôn đồng bộ.
  const fetchDisputes = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const result = await getModeratorDisputes({ page, limit: pageSize, status: status || undefined });
      setDisputes(result.items);
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.limit,
        total: result.pagination.total
      });
    } catch (error) {
      message.error(error.message || "Không thể tải danh sách khiếu nại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const columns = [
    {
      title: "Mã KN",
      dataIndex: "_id",
      key: "_id",
      render: (text) => <b>{String(text).slice(-8).toUpperCase()}</b>
    },
    { title: "Người mua", dataIndex: ["buyerId", "fullName"], key: "buyer" },
    { title: "Người bán", dataIndex: ["sellerId", "fullName"], key: "seller" },
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
      render: (value) => {
        if (value === "pending") return <Tag className="mod-status-pill" color="warning">Chờ xử lý</Tag>;
        if (value === "investigating") return <Tag className="mod-status-pill" color="processing">Đang điều tra</Tag>;
        return <Tag className="mod-status-pill" color="success">Đã xử lý</Tag>;
      }
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Button type="primary" icon={<EyeOutlined />} onClick={() => navigate(`/moderator/disputes/${record._id}`)}>
          Chi tiết
        </Button>
      )
    }
  ];

  return (
    <Card className="mod-panel">
      <Space className="mod-toolbar" style={{ width: "100%" }} wrap>
        <Title level={4} style={{ margin: 0 }}>Quản lý Tranh chấp</Title>
        <Select
          value={status}
          onChange={setStatus}
          style={{ width: 180 }}
          options={[
            { value: "pending", label: "Chờ xử lý" },
            { value: "investigating", label: "Đang điều tra" },
            { value: "resolved", label: "Đã xử lý" }
          ]}
        />
      </Space>

      <Table
        className="mod-table"
        rowKey="_id"
        columns={columns}
        dataSource={disputes}
        loading={loading}
        pagination={pagination}
        onChange={(pager) => fetchDisputes(pager.current, pager.pageSize)}
      />
    </Card>
  );
};

export default ModDisputeList;
