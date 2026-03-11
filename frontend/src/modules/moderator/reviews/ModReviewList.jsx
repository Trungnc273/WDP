import { Card, Table, Button, Typography, Tag, message, Select, Space } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { getModeratorReviews, hideModeratorReview } from "../../../services/moderator.service";

const { Title } = Typography;

const ModReviewList = () => {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState("reported");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Tập trung gọi API tại một chỗ để dễ bảo trì bộ lọc và phân trang.
  const fetchReviews = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const result = await getModeratorReviews({ page, limit: pageSize, status });
      setReviews(result.items);
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.limit,
        total: result.pagination.total
      });
    } catch (error) {
      message.error(error.message || "Không tải được danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleDelete = async (id) => {
    try {
      await hideModeratorReview(id);
      message.success("Đã ẩn đánh giá vi phạm");
      fetchReviews(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.message || "Không thể ẩn đánh giá");
    }
  };

  const columns = [
    { title: "Người dùng", dataIndex: ["reviewerId", "fullName"], key: "user", render: (text) => <b>{text}</b> },
    { title: "Sản phẩm", dataIndex: ["productId", "title"], key: "product" },
    { title: "Điểm đánh giá", dataIndex: "rating", key: "rating", render: (star) => <span className="mod-money-text">{star} sao</span> },
    { title: "Nội dung", dataIndex: "comment", key: "comment" },
    { 
      title: "Trạng thái", 
      dataIndex: "status", 
      key: "status",
      render: (currentStatus) => currentStatus === "reported" ? <Tag className="mod-status-pill" color="red">Bị báo cáo</Tag> : currentStatus === "hidden" ? <Tag className="mod-status-pill" color="default">Đã ẩn</Tag> : <Tag className="mod-status-pill" color="green">Bình thường</Tag>
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        record.status !== "hidden" && (
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record._id)}>
            Xóa review
          </Button>
        )
      )
    }
  ];

  return (
    <Card className="mod-panel">
      <Space className="mod-toolbar" style={{ width: "100%" }} wrap>
        <Title level={4} style={{ margin: 0 }}>Quản lý Đánh giá & Nhận xét</Title>
        <Select
          value={status}
          onChange={setStatus}
          style={{ width: 180 }}
          options={[
            { value: "reported", label: "Bị báo cáo" },
            { value: "active", label: "Đang hiển thị" },
            { value: "hidden", label: "Đã ẩn" }
          ]}
        />
      </Space>
      <Table
        className="mod-table"
        columns={columns}
        dataSource={reviews}
        loading={loading}
        rowKey="_id"
        pagination={pagination}
        onChange={(pager) => fetchReviews(pager.current, pager.pageSize)}
      />
    </Card>
  );
};

export default ModReviewList;