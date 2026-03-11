import { useEffect, useState } from "react";
import { Card, Descriptions, Button, Space, Tag, Input, Alert, Popconfirm, message } from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import {
  getModeratorDisputeById,
  markModeratorDisputeInvestigating,
  resolveModeratorDispute
} from "../../../services/moderator.service";

const { TextArea } = Input;

const ModDisputeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dispute, setDispute] = useState(null);
  const [notes, setNotes] = useState("");

  // Tải lại chi tiết sau mỗi thao tác để luôn hiển thị dữ liệu chuẩn từ server.
  const fetchDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getModeratorDisputeById(id);
      setDispute(data);
      setNotes(data?.moderatorNotes || "");
    } catch (err) {
      setError(err.message || "Không thể tải chi tiết khiếu nại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleResolve = async (resolution) => {
    try {
      await resolveModeratorDispute(id, {
        resolution,
        moderatorNotes: notes
      });
      message.success("Đã xử lý tranh chấp thành công");
      fetchDetail();
    } catch (err) {
      message.error(err.message || "Không thể xử lý tranh chấp");
    }
  };

  const handleInvestigating = async () => {
    try {
      await markModeratorDisputeInvestigating(id, notes);
      message.success("Đã chuyển trạng thái sang đang điều tra");
      fetchDetail();
    } catch (err) {
      message.error(err.message || "Không thể cập nhật trạng thái đang điều tra");
    }
  };

  if (error) {
    return <Alert type="error" showIcon message={error} />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/moderator/disputes")}>Quay lại danh sách</Button>

      <Card className="mod-panel" title={`Chi tiết Khiếu nại: ${dispute?._id?.slice(-8)?.toUpperCase() || ""}`} loading={loading}>
        <Descriptions bordered column={1} labelStyle={{ width: 220, fontWeight: 700 }}>
          <Descriptions.Item label="Người mua">{dispute?.buyerId?.fullName || "N/A"}</Descriptions.Item>
          <Descriptions.Item label="Người bán">{dispute?.sellerId?.fullName || "N/A"}</Descriptions.Item>
          <Descriptions.Item label="Sản phẩm">{dispute?.productId?.title || "N/A"}</Descriptions.Item>
          <Descriptions.Item label="Giá trị đơn hàng">{Number(dispute?.orderId?.agreedAmount || 0).toLocaleString("vi-VN")} đ</Descriptions.Item>
          <Descriptions.Item label="Lý do khiếu nại">{dispute?.reason || "N/A"}</Descriptions.Item>
          <Descriptions.Item label="Mô tả">{dispute?.description || "N/A"}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {dispute?.status === "pending" && <Tag className="mod-status-pill" color="warning">Chờ xử lý</Tag>}
            {dispute?.status === "investigating" && <Tag className="mod-status-pill" color="processing">Đang điều tra</Tag>}
            {dispute?.status === "resolved" && <Tag className="mod-status-pill" color="success">Đã xử lý</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="Kết quả">{dispute?.resolution || "Chưa xử lý"}</Descriptions.Item>
        </Descriptions>

        {dispute?.status !== "resolved" && (
          <div className="mod-action-row">
            <TextArea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú xử lý của moderator (tối thiểu 10 ký tự)"
              style={{ minWidth: 320, flex: 1 }}
            />

            {/* Bước trung gian để moderator nhận xử lý trước khi ra quyết định cuối. */}
            <Button
              type="default"
              onClick={handleInvestigating}
              disabled={dispute?.status === "investigating"}
            >
              Chuyển sang Đang điều tra
            </Button>

            <Popconfirm title="Xác nhận hoàn tiền cho người mua?" onConfirm={() => handleResolve("refund")}>
              <Button type="primary" danger icon={<StopOutlined />}>Hoàn tiền cho người mua</Button>
            </Popconfirm>

            <Popconfirm title="Xác nhận nhả tiền cho người bán?" onConfirm={() => handleResolve("release")}>
              <Button type="primary" icon={<CheckCircleOutlined />}>Nhả tiền cho người bán</Button>
            </Popconfirm>
          </div>
        )}
      </Card>
    </Space>
  );
};

export default ModDisputeDetail;
