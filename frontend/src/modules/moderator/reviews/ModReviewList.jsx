import { Card, Table, Button, Typography, Tag, message, Select, Space, Input, Modal, Descriptions, Divider, Alert } from "antd";
import { WarningOutlined, SearchOutlined, ReloadOutlined, EyeOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { getModeratorReviews, markBadModeratorReview } from "../../../services/moderator.service";

const { Title } = Typography;
const { TextArea } = Input;

const ModReviewList = () => {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState("");
  const [rawKeyword, setRawKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [markingReviewId, setMarkingReviewId] = useState("");
  const [badReviewModalOpen, setBadReviewModalOpen] = useState(false);
  const [pendingReview, setPendingReview] = useState(null);
  const [moderatorNote, setModeratorNote] = useState("");
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
      const result = await getModeratorReviews({ page, limit: pageSize, ...(status ? { status } : {}) });
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
    setStatus("");
    setRawKeyword("");
    setKeyword("");
    fetchReviews(1, pagination.pageSize);
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(Number(value || 0));
  };

  const openMarkBadModal = (review) => {
    const reviewId = review?._id;
    if (!reviewId) return;

    if (review?.moderatorAssessment?.isBad) {
      message.warning("Review này đã được mod đánh giá xấu trước đó");
      return;
    }

    setPendingReview(review);
    setModeratorNote("Review phản ánh chất lượng phục vụ kém, cần xử lý tài khoản người bán");
    setBadReviewModalOpen(true);
  };

  const getNextPenaltyPreview = (review) => {
    const nextCount = Number(review?.reviewedUserId?.modBadReviewCount || 0) + 1;
    const nextLevel = Math.min(Math.floor(nextCount / 3), 3);
    const shouldSuspendNow = nextCount % 3 === 0;

    if (!shouldSuspendNow) {
      return {
        level: nextLevel,
        label: "Chưa khóa tài khoản (đang tích lũy cảnh cáo)",
        milestone: 3 - (nextCount % 3)
      };
    }

    if (nextLevel === 1) return { level: 1, label: "Khóa 24 giờ", milestone: 0 };
    if (nextLevel === 2) return { level: 2, label: "Khóa 1 tuần", milestone: 0 };
    return { level: 3, label: "Khóa 1 năm", milestone: 0 };
  };

  const submitMarkBad = async () => {
    const review = pendingReview;
    const reviewId = review?._id;
    if (!reviewId) return;

    const normalizedNote = String(moderatorNote || "").trim();
    if (normalizedNote.length < 10) {
      message.warning("Vui lòng nhập nội dung gửi người bán tối thiểu 10 ký tự");
      return;
    }

    try {
      setMarkingReviewId(reviewId);
      const result = await markBadModeratorReview(reviewId, normalizedNote);
      const penalty = result?.sellerPenalty;
      const resultMessage = penalty?.shouldSuspendNow
        ? `Đã đánh giá xấu người bán. Mức xử lý: ${penalty?.suspensionLabel || 'đã khóa tài khoản'}`
        : `Đã đánh giá xấu người bán. Chưa khóa tài khoản, đang tích lũy mốc 3 lần.`;
      message.success(resultMessage);
      setBadReviewModalOpen(false);
      setPendingReview(null);
      setModeratorNote("");
      if (selectedReview?._id === reviewId) {
        setSelectedReview(result?.review || selectedReview);
      }
      fetchReviews(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.message || "Không thể đánh giá xấu review này");
    } finally {
      setMarkingReviewId("");
    }
  };

  const openReviewDetail = (review) => {
    setSelectedReview(review);
    setDetailModalOpen(true);
  };

  const closeReviewDetail = () => {
    setDetailModalOpen(false);
    setSelectedReview(null);
  };

  const renderRatingStars = (rating = 0) => {
    const rounded = Math.max(0, Math.min(5, Number(rating || 0)));
    return (
      <span style={{ color: "#f59e0b", letterSpacing: 2, fontSize: 16 }}>
        {"★".repeat(rounded)}
        <span style={{ color: "#d1d5db" }}>{"★".repeat(5 - rounded)}</span>
      </span>
    );
  };

  const formatDateTime = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const columns = [
    { title: "Người dùng", dataIndex: ["reviewerId", "fullName"], key: "user", render: (text) => <b>{text}</b> },
    { title: "Sản phẩm", dataIndex: ["productId", "title"], key: "product" },
    {
      title: "Giá đơn",
      dataIndex: ["orderId", "agreedAmount"],
      key: "orderPrice",
      render: (amount) => <span className="mod-money-text">{formatPrice(amount)}</span>
    },
    { title: "Điểm đánh giá", dataIndex: "rating", key: "rating", render: (star) => <span className="mod-money-text">{star} sao</span> },
    { title: "Nội dung", dataIndex: "comment", key: "comment" },
    { 
      title: "Trạng thái", 
      dataIndex: "status", 
      key: "status",
      render: (currentStatus) => currentStatus === "reported" ? <Tag className="mod-status-pill" color="red">Bị báo cáo</Tag> : currentStatus === "hidden" ? <Tag className="mod-status-pill" color="default">Đã ẩn</Tag> : <Tag className="mod-status-pill" color="green">Bình thường</Tag>
    },
    {
      title: "Đánh giá mod",
      key: "modAssessment",
      render: (_, record) => {
        if (record?.moderatorAssessment?.isBad) {
          return <Tag className="mod-status-pill" color="volcano">Đã đánh giá xấu (Mức {record?.moderatorAssessment?.penaltyLevel || 1})</Tag>;
        }
        return <Tag className="mod-status-pill" color="blue">Chưa đánh giá</Tag>;
      }
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => openReviewDetail(record)}>
            Xem chi tiết
          </Button>
          <Button
            type="primary"
            danger
            icon={<WarningOutlined />}
            disabled={record?.moderatorAssessment?.isBad}
            loading={markingReviewId === record._id}
            onClick={() => openMarkBadModal(record)}
          >
            Đánh giá xấu
          </Button>
        </Space>
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
              { value: "", label: "Tất cả" },
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

      <Modal
        title="Chi tiết đánh giá"
        open={detailModalOpen}
        onCancel={closeReviewDetail}
        footer={
          <Space>
            <Button onClick={closeReviewDetail}>Đóng</Button>
            <Button
              type="primary"
              danger
              icon={<WarningOutlined />}
              disabled={selectedReview?.moderatorAssessment?.isBad}
              loading={markingReviewId === selectedReview?._id}
              onClick={async () => {
                if (!selectedReview?._id) return;
                openMarkBadModal(selectedReview);
              }}
            >
              Đánh giá xấu người bán
            </Button>
          </Space>
        }
        width={720}
      >
        {selectedReview && (
          <>
            <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Tag color={selectedReview.status === "reported" ? "red" : selectedReview.status === "hidden" ? "default" : "green"}>
                {selectedReview.status === "reported" ? "Bị báo cáo" : selectedReview.status === "hidden" ? "Đã ẩn" : "Bình thường"}
              </Tag>
              <Tag color={selectedReview?.moderatorAssessment?.isBad ? "volcano" : "blue"}>
                {selectedReview?.moderatorAssessment?.isBad
                  ? `Mod đã đánh giá xấu (Mức ${selectedReview?.moderatorAssessment?.penaltyLevel || 1})`
                  : "Chưa có đánh giá xấu từ mod"}
              </Tag>
            </div>

            <Card size="small" style={{ marginBottom: 12, borderRadius: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>
                    {selectedReview.productId?.title || "Sản phẩm"}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>
                    Người bán: <b>{selectedReview.reviewedUserId?.fullName || "N/A"}</b>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#047857", fontWeight: 700 }}>{formatPrice(selectedReview.orderId?.agreedAmount)}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Giá đơn</div>
                </div>
              </div>
              <Divider style={{ margin: "12px 0" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {renderRatingStars(selectedReview.rating)}
                <span style={{ color: "#374151", fontWeight: 600 }}>{selectedReview.rating || 0}/5 sao</span>
              </div>
            </Card>

            <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Người đánh giá">
              {selectedReview.reviewerId?.fullName || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Người được đánh giá">
              {selectedReview.reviewedUserId?.fullName || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Sản phẩm">
              {selectedReview.productId?.title || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Giá đơn">
              {formatPrice(selectedReview.orderId?.agreedAmount)}
            </Descriptions.Item>
            <Descriptions.Item label="Điểm đánh giá">
              {selectedReview.rating || 0} sao
            </Descriptions.Item>
            <Descriptions.Item label="Số lần bị mod đánh xấu">
              {selectedReview.reviewedUserId?.modBadReviewCount || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Khóa tài khoản đến" span={2}>
              {formatDateTime(selectedReview.reviewedUserId?.suspendedUntil)}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo" span={2}>
              {formatDateTime(selectedReview.createdAt)}
            </Descriptions.Item>
            {selectedReview?.moderatorAssessment?.isBad && (
              <Descriptions.Item label="Ghi chú moderator" span={2}>
                {selectedReview?.moderatorAssessment?.note || "N/A"}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Nội dung" span={2}>
              {selectedReview.comment || "(Không có nội dung)"}
            </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>

      <Modal
        title="Đánh giá xấu người bán"
        open={badReviewModalOpen}
        onCancel={() => {
          if (markingReviewId) return;
          setBadReviewModalOpen(false);
          setPendingReview(null);
        }}
        onOk={submitMarkBad}
        okText="Gửi đánh giá xấu"
        cancelText="Hủy"
        okButtonProps={{
          danger: true,
          icon: <WarningOutlined />,
          loading: markingReviewId === pendingReview?._id
        }}
      >
        {pendingReview && (
          <>
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              message={`Xử lý tại mốc kế tiếp: ${getNextPenaltyPreview(pendingReview).label}`}
              description={
                getNextPenaltyPreview(pendingReview).milestone > 0
                  ? `Lần đánh giá xấu thứ ${Number(pendingReview?.reviewedUserId?.modBadReviewCount || 0) + 1} cho người bán ${pendingReview?.reviewedUserId?.fullName || ""}. Cần thêm ${getNextPenaltyPreview(pendingReview).milestone} lần nữa để kích hoạt khóa.`
                  : `Lần đánh giá xấu thứ ${Number(pendingReview?.reviewedUserId?.modBadReviewCount || 0) + 1} cho người bán ${pendingReview?.reviewedUserId?.fullName || ""} sẽ kích hoạt khóa tài khoản.`
              }
            />
            <div style={{ marginBottom: 8, fontWeight: 600 }}>Nội dung gửi cho người bán</div>
            <TextArea
              rows={5}
              maxLength={500}
              value={moderatorNote}
              onChange={(e) => setModeratorNote(e.target.value)}
              placeholder="Nhập nội dung phản hồi để gửi trực tiếp cho người bán"
            />
            <div style={{ textAlign: "right", color: "#6b7280", marginTop: 4, fontSize: 12 }}>
              {String(moderatorNote || "").trim().length}/500
            </div>
          </>
        )}
      </Modal>
    </Card>
  );
};

export default ModReviewList;