import { Card, Descriptions, Button, Space, Tag, message, Popconfirm, Input, Alert, Select } from "antd";
import { StopOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  forceCancelModeratorOrder,
  getModeratorOrderById,
  updateModeratorOrderStatus
} from "../../../services/moderator.service";

const { TextArea } = Input;

const ModOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [reason, setReason] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [nextStatus, setNextStatus] = useState(undefined);
  const [error, setError] = useState("");

  const STATUS_LABEL = {
    awaiting_payment: "Chờ thanh toán",
    paid: "Đã thanh toán",
    shipped: "Đang giao",
    completed: "Hoàn tất",
    cancelled: "Đã hủy",
    disputed: "Đang tranh chấp"
  };

  const fetchOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getModeratorOrderById(id);
      setOrder(data);
      setNextStatus(data?.allowedNextStatuses?.[0]);
    } catch (err) {
      setError(err.message || "Không tải được chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Luồng hủy cưỡng chế tách riêng để dễ audit và truy lỗi.
  const handleForceCancel = async () => {
    try {
      await forceCancelModeratorOrder(id, reason);
      message.success("Đã ép hủy đơn hàng");
      fetchOrder();
      setReason("");
    } catch (err) {
      message.error(err.message || "Không thể hủy đơn");
    }
  };

  // Cập nhật trạng thái theo allowedNextStatuses từ backend để chặn chuyển lùi linh tinh.
  const handleUpdateStatus = async () => {
    if (!nextStatus) {
      message.warning("Không có trạng thái kế tiếp hợp lệ");
      return;
    }

    try {
      await updateModeratorOrderStatus(id, nextStatus, statusNote);
      message.success("Đã cập nhật trạng thái đơn hàng");
      setStatusNote("");
      fetchOrder();
    } catch (err) {
      message.error(err.message || "Không thể cập nhật trạng thái đơn");
    }
  };

  if (error) {
    return <Alert type="error" showIcon message={error} />;
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/moderator/orders")}>
        Quay lại danh sách
      </Button>

      <Card className="mod-panel" title={`Chi tiết Đơn hàng: ${order?._id?.slice(-8)?.toUpperCase() || ""}`} loading={loading}>
        <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Người mua">{order?.buyerId?.fullName || "N/A"}</Descriptions.Item>
          <Descriptions.Item label="Người bán">{order?.sellerId?.fullName || "N/A"}</Descriptions.Item>
          <Descriptions.Item label="Sản phẩm">{order?.productId?.title || "N/A"}</Descriptions.Item>
          <Descriptions.Item label="Tổng tiền">{Number(order?.totalToPay || 0).toLocaleString("vi-VN")} đ</Descriptions.Item>
          <Descriptions.Item label="Trạng thái hiện tại">
            <Tag className="mod-status-pill" color={order?.status === "completed" ? "green" : "processing"}>
              {STATUS_LABEL[order?.status] || "N/A"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Thanh toán">
            {order?.paymentStatus === "paid" ? "Đã thanh toán" : order?.paymentStatus === "refunded" ? "Đã hoàn tiền" : "Chưa thanh toán"}
          </Descriptions.Item>
        </Descriptions>

        <Card type="inner" title="Cập nhật trạng thái đơn hàng" className="mod-panel" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Select
              value={nextStatus}
              onChange={setNextStatus}
              placeholder="Chọn trạng thái kế tiếp"
              options={(order?.allowedNextStatuses || []).map((status) => ({
                value: status,
                label: STATUS_LABEL[status] || status
              }))}
            />
            <TextArea
              rows={3}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Ghi chú cập nhật trạng thái (bắt buộc >= 10 ký tự nếu chọn Hủy đơn)"
            />
            <Popconfirm title="Xác nhận cập nhật trạng thái đơn hàng?" onConfirm={handleUpdateStatus}>
              <Button type="primary" disabled={!order?.allowedNextStatuses?.length}>
                Cập nhật trạng thái
              </Button>
            </Popconfirm>
          </Space>
        </Card>

        <Card type="inner" title="Thao tác của Moderator" className="mod-panel">
          <Space direction="vertical" style={{ width: "100%" }}>
            <TextArea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do hủy đơn (tối thiểu 10 ký tự)"
            />
            <Popconfirm title="Xác nhận ép hủy đơn hàng này?" onConfirm={handleForceCancel}>
              <Button type="primary" danger icon={<StopOutlined />} disabled={order?.status === "cancelled" || order?.status === "completed"}>
                Ép hủy đơn hàng
              </Button>
            </Popconfirm>
          </Space>
        </Card>
      </Card>
    </Space>
  );
};

export default ModOrderDetail;