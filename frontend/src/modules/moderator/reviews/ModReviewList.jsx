import { Card, Table, Button, Typography, Tag, message, Select, Space, Input, Modal, Descriptions, Divider, Alert } from "antd";
import { WarningOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getModeratorReviews, markBadModeratorReview, markGoodModeratorReview } from "../../../services/moderator.service";

const { Title } = Typography;
const { TextArea } = Input;
const { Text } = Typography;

const ALLOWED_STATUS = ["", "reported", "active", "hidden"];
const ALLOWED_ASSESSMENT = ["", "pending", "good", "bad"];

function normalizeFilterValue(value, allowedValues) {
  const normalized = String(value || "").trim();
  return allowedValues.includes(normalized) ? normalized : "";
}

const ModReviewList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const initialStatus = normalizeFilterValue(searchParams.get("status"), ALLOWED_STATUS);
  const initialAssessment = normalizeFilterValue(searchParams.get("assessment"), ALLOWED_ASSESSMENT);
  const initialKeyword = String(searchParams.get("keyword") || "").trim();
  const [status, setStatus] = useState(initialStatus);
  const [assessment, setAssessment] = useState(initialAssessment);
  const [rawKeyword, setRawKeyword] = useState(initialKeyword);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [markingReviewId, setMarkingReviewId] = useState("");
  const [approvingReviewId, setApprovingReviewId] = useState("");
  const [badReviewModalOpen, setBadReviewModalOpen] = useState(false);
  const [pendingReview, setPendingReview] = useState(null);
  const [moderatorNote, setModeratorNote] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Tập trung gọi API tại một chỗ để dễ bảo trì bộ lọc và phân trang.
  const fetchReviews = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const result = await getModeratorReviews({
        page,
        limit: pageSize,
        ...(status ? { status } : {}),
        ...(assessment ? { assessment } : {}),
        ...(keyword ? { keyword } : {})
      });
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
  }, [status, assessment, keyword]);

  useEffect(() => {
    const nextStatus = normalizeFilterValue(searchParams.get("status"), ALLOWED_STATUS);
    const nextAssessment = normalizeFilterValue(searchParams.get("assessment"), ALLOWED_ASSESSMENT);
    const nextKeyword = String(searchParams.get("keyword") || "").trim();

    setStatus(nextStatus);
    setAssessment(nextAssessment);
    setRawKeyword(nextKeyword);
    setKeyword(nextKeyword);
  }, [searchParams]);

  useEffect(() => {
    const params = {};
    if (status) params.status = status;
    if (assessment) params.assessment = assessment;
    if (keyword) params.keyword = keyword;

    const nextSearch = new URLSearchParams(params).toString();
    const currentSearch = searchParams.toString();
    if (nextSearch !== currentSearch) {
      setSearchParams(params, { replace: true });
    }
  }, [status, assessment, keyword, searchParams, setSearchParams]);

  const handleResetFilters = () => {
    setStatus("");
    setAssessment("");
    setRawKeyword("");
    setKeyword("");
    setSearchParams({}, { replace: true });
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

    const assessment = review?.moderatorAssessment;
    if (assessment?.isReviewed || assessment?.isBad) {
      message.warning("Review này đã được moderator xử lý trước đó");
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

  const submitMarkGood = async (review) => {
    const reviewId = review?._id;
    if (!reviewId) return;

    const assessment = review?.moderatorAssessment;
    if (assessment?.isReviewed || assessment?.isBad) {
      message.warning("Review này đã được moderator xử lý trước đó");
      return;
    }

    try {
      setApprovingReviewId(reviewId);
      const result = await markGoodModeratorReview(reviewId, "Đã duyệt đánh giá tốt");
      message.success("Đã duyệt đánh giá tốt");
      if (selectedReview?._id === reviewId) {
        setSelectedReview(result?.review || selectedReview);
      }
      fetchReviews(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.message || "Không thể duyệt đánh giá này");
    } finally {
      setApprovingReviewId("");
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
    {
      title: "Người dùng",
      dataIndex: ["reviewerId", "fullName"],
      key: "user",
      width: 110,
      render: (text) => <Text strong className="mod-review-primary-text">{text || "N/A"}</Text>
    },
    {
      title: "Sản phẩm",
      dataIndex: ["productId", "title"],
      key: "product",
      width: 110,
      ellipsis: true,
      render: (value) => <Text className="mod-review-secondary-text" ellipsis={{ tooltip: value || "N/A" }}>{value || "N/A"}</Text>
    },
    {
      title: "Giá đơn",
      dataIndex: ["orderId", "agreedAmount"],
      key: "orderPrice",
      width: 105,
      render: (amount) => <span className="mod-money-text">{formatPrice(amount)}</span>
    },
    {
      title: "Điểm",
      dataIndex: "rating",
      key: "rating",
      width: 75,
      align: "center",
      render: (star) => <span className="mod-money-text">{Number(star || 0)} sao</span>
    },
    {
      title: "Nội dung",
      dataIndex: "comment",
      key: "comment",
      width: 170,
      render: (comment) => (
        <div className="mod-review-comment-cell" title={comment || "(Không có nội dung)"}>
          {comment || "(Không có nội dung)"}
        </div>
      )
    },
    { 
      title: "Trạng thái", 
      dataIndex: "status", 
      key: "status",
      width: 110,
      render: (currentStatus) => currentStatus === "reported" ? <Tag className="mod-status-pill" color="red">Bị báo cáo</Tag> : currentStatus === "hidden" ? <Tag className="mod-status-pill" color="default">Đã ẩn</Tag> : <Tag className="mod-status-pill" color="green">Bình thường</Tag>
    },
    {
      title: "Đánh giá mod",
      key: "modAssessment",
      width: 145,
      render: (_, record) => {
        if (record?.moderatorAssessment?.isBad || record?.moderatorAssessment?.verdict === "bad") {
          return <Tag className="mod-status-pill" color="volcano">Đã đánh giá xấu (Mức {record?.moderatorAssessment?.penaltyLevel || 1})</Tag>;
        }
        if (record?.moderatorAssessment?.isReviewed || record?.moderatorAssessment?.verdict === "good") {
          return <Tag className="mod-status-pill" color="green">Đã duyệt</Tag>;
        }
        return <Tag className="mod-status-pill" color="blue">Chưa đánh giá</Tag>;
      }
    },
    {
      title: "Người bị đánh giá",
      dataIndex: ["reviewedUserId", "fullName"],
      key: "reviewedUser",
      width: 120,
      render: (text) => <Text strong className="mod-review-primary-text">{text || "N/A"}</Text>
    },
    {
      title: "Hành động",
      key: "action",
      width: 210,
      render: (_, record) => (
        <div className="mod-review-actions">
          <Button
            size="small"
            icon={<EyeOutlined />}
            className="mod-review-btn mod-review-btn-detail"
            onClick={() => openReviewDetail(record)}
          >
            Chi tiết
          </Button>
          <div className="mod-review-actions-secondary">
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              className="mod-review-btn mod-review-btn-approve"
              disabled={record?.moderatorAssessment?.isReviewed || record?.moderatorAssessment?.isBad}
              loading={approvingReviewId === record._id}
              onClick={() => submitMarkGood(record)}
            >
              Duyệt
            </Button>
            <Button
              type="primary"
              danger
              size="small"
              icon={<WarningOutlined />}
              className="mod-review-btn mod-review-btn-reject"
              disabled={record?.moderatorAssessment?.isReviewed || record?.moderatorAssessment?.isBad}
              loading={markingReviewId === record._id}
              onClick={() => openMarkBadModal(record)}
            >
              Xấu
            </Button>
          </div>
        </div>
      )
    }
  ];

  return (
    <Card className="mod-panel">
      <div className="mod-toolbar">
        <Title level={4} style={{ margin: 0 }}>Quản lý Đánh giá &amp; Nhận xét</Title>
        <div className="mod-filter-row">
          <Input
            placeholder="Tìm theo người đánh giá, người bị đánh giá, sản phẩm, nội dung..."
            prefix={<SearchOutlined />}
            value={rawKeyword}
            onChange={(e) => setRawKeyword(e.target.value)}
            onPressEnter={() => setKeyword(String(rawKeyword || "").trim())}
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
          <Select
            value={assessment}
            onChange={setAssessment}
            style={{ width: 180 }}
            options={[
              { value: "", label: "Mọi đánh giá mod" },
              { value: "pending", label: "Chưa đánh giá" },
              { value: "good", label: "Đã duyệt" },
              { value: "bad", label: "Đánh giá xấu" }
            ]}
          />
          <div className="mod-filter-actions">
            <Button type="primary" onClick={() => setKeyword(String(rawKeyword || "").trim())}>Lọc</Button>
            <Button icon={<ReloadOutlined />} className="mod-reset-btn" onClick={handleResetFilters}>Reset</Button>
          </div>
        </div>
      </div>
      <Table
        className="mod-table mod-review-table"
        size="middle"
        columns={columns}
        dataSource={reviews}
        loading={loading}
        rowKey="_id"
        rowClassName={(_, index) => (index % 2 === 0 ? "mod-review-row-even" : "mod-review-row-odd")}
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
              icon={<CheckCircleOutlined />}
              style={{ background: "#16a34a", borderColor: "#16a34a" }}
              disabled={selectedReview?.moderatorAssessment?.isReviewed || selectedReview?.moderatorAssessment?.isBad}
              loading={approvingReviewId === selectedReview?._id}
              onClick={() => submitMarkGood(selectedReview)}
            >
              Đã duyệt
            </Button>
            <Button
              type="primary"
              danger
              icon={<WarningOutlined />}
              disabled={selectedReview?.moderatorAssessment?.isReviewed || selectedReview?.moderatorAssessment?.isBad}
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
              <Tag color={selectedReview?.moderatorAssessment?.isBad ? "volcano" : selectedReview?.moderatorAssessment?.isReviewed ? "green" : "blue"}>
                {selectedReview?.moderatorAssessment?.isBad
                  ? `Mod đã đánh giá xấu (Mức ${selectedReview?.moderatorAssessment?.penaltyLevel || 1})`
                  : selectedReview?.moderatorAssessment?.isReviewed
                    ? "Mod đã duyệt đánh giá tốt"
                    : "Chưa có đánh giá từ mod"}
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
            {(selectedReview?.moderatorAssessment?.isBad || selectedReview?.moderatorAssessment?.isReviewed) && (
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