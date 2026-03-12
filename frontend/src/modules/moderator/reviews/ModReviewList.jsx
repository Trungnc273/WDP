import { Card, Table, Button, Typography, Tag, message, Select, Space, Input } from "antd";
import { DeleteOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { getModeratorReviews, hideModeratorReview } from "../../../services/moderator.service";

const { Title } = Typography;

const ModReviewList = () => {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState("reported");
  const [rawKeyword, setRawKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const filteredReviews = keyword
    ? reviews.filter((r) => {
        const name = (r.reviewerId?.fullName || "").toLowerCase();
        const product = (r.productId?.title || "").toLowerCase();
        const comment = (r.comment || "").toLowerCase();
        const kw = keyword.toLowerCase();
        return name.includes(kw) || product.includes(kw) || comment.includes(kw);
      })
    : reviews;

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

  const handleResetFilters = () => {
    setStatus("reported");
    setRawKeyword("");
    setKeyword("");
    fetchReviews(1, pagination.pageSize);
  };

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
      <div className="mod-toolbar">
        <Title level={4} style={{ margin: 0 }}>Quản lý Đánh giá &amp; Nhận xét</Title>
        <div className="mod-filter-row">
          <Input
            placeholder="Tìm theo tên, sản phẩm, nội dung..."
            prefix={<SearchOutlined />}
            value={rawKeyword}
            onChange={(e) => setRawKeyword(e.target.value)}
            onPressEnter={() => setKeyword(rawKeyword)}
            style={{ width: 260 }}
          />
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
          <div className="mod-filter-actions">
            <Button type="primary" onClick={() => setKeyword(rawKeyword)}>Lọc</Button>
            <Button icon={<ReloadOutlined />} className="mod-reset-btn" onClick={handleResetFilters}>Reset</Button>
          </div>
        </div>
      </div>
      <Table
        className="mod-table"
        columns={columns}
        dataSource={filteredReviews}
        loading={loading}
        rowKey="_id"
        pagination={pagination}
        onChange={(pager) => fetchReviews(pager.current, pager.pageSize)}
      />
    </Card>
  );
};

export default ModReviewList;