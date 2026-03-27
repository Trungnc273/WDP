import { useEffect, useState } from "react";
import { Card, Descriptions, Button, Space, Tag, Input, Alert, Popconfirm, message, Image, Typography } from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import {
  getModeratorDisputeById,
  markModeratorDisputeInvestigating,
  resolveModeratorDispute
} from "../../../services/moderator.service";
import { getImageUrl } from "../../../utils/imageHelper";

const { TextArea } = Input;
const { Text } = Typography;

const ModDisputeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dispute, setDispute] = useState(null);
  const [notes, setNotes] = useState("");

  const disputeReasonLabels = {
    not_as_described: "Không đúng mô tả",
    damaged: "Sản phẩm bị hỏng/hư hại",
    not_received: "Không nhận được hàng",
    counterfeit: "Hàng giả/hàng nhái",
    return_request: "Yêu cầu hoàn hàng",
    other: "Lý do khác"
  };

  const disputeResolutionLabels = {
    refund: "Hoàn tiền cho người mua",
    release: "Nhả tiền cho người bán"
  };

  const viMessage = (raw = "") => {
    const input = String(raw || "").trim();
    const map = {
      "Dispute resolved: refund to buyer": "Tranh chấp đã xử lý: Hoàn tiền cho người mua",
      "Dispute resolved: release to seller": "Tranh chấp đã xử lý: Nhả tiền cho người bán",
      "resolution phải là refund hoặc release": "Kết quả xử lý chỉ được chọn Hoàn tiền hoặc Nhả tiền",
      "moderatorNotes tối thiểu 10 ký tự": "Ghi chú xử lý tối thiểu 10 ký tự"
    };

    return map[input] || input;
  };

  const isVideoEvidence = (url = "") => /\.(mp4|mov|webm|avi|mkv)$/i.test(url);

  const buildDisputeTimeline = (disputeData) => {
    if (!disputeData) return [];

    const timeline = [];

    timeline.push({
      key: 'initial',
      title: 'Người mua tạo khiếu nại',
      description: disputeData.description || 'Không có mô tả',
      media: disputeData.evidenceImages || [],
      time: disputeData.createdAt
    });

    if (disputeData.sellerResponse || disputeData.sellerEvidenceImages?.length) {
      timeline.push({
        key: 'seller-response',
        title: 'Người bán phản hồi',
        description: disputeData.sellerResponse || 'Người bán đã gửi tệp đính kèm',
        media: disputeData.sellerEvidenceImages || [],
        time: disputeData.sellerResponseUpdatedAt || null
      });
    }

    if (disputeData.buyerFollowUpNote || disputeData.buyerAdditionalEvidenceImages?.length) {
      timeline.push({
        key: 'buyer-followup',
        title: 'Tin mới từ người mua',
        description: disputeData.buyerFollowUpNote || 'Người mua đã gửi tệp mới',
        media: disputeData.buyerAdditionalEvidenceImages || [],
        time: disputeData.buyerFollowUpUpdatedAt || null
      });
    }

    if (disputeData.resolution || disputeData.status === 'resolved') {
      timeline.push({
        key: 'resolved',
        title: 'Moderator chốt kết quả',
        description: disputeData.resolution
          ? (disputeResolutionLabels[disputeData.resolution] || disputeData.resolution)
          : 'Đã xử lý',
        media: [],
        time: disputeData.resolvedAt || null
      });
    }

    return timeline
      .map((item, index) => ({ ...item, __index: index }))
      .sort((a, b) => {
        const timeA = a.time ? new Date(a.time).getTime() : Number.MAX_SAFE_INTEGER;
        const timeB = b.time ? new Date(b.time).getTime() : Number.MAX_SAFE_INTEGER;
        if (timeA === timeB) return a.__index - b.__index;
        return timeA - timeB;
      });
  };

  // Render bang chung theo tung loai media de moderator doi chieu de dang.
  const renderEvidenceSection = (files = [], emptyText) => {
    if (!files.length) {
      return <Text type="secondary">{emptyText}</Text>;
    }

    const imageFiles = files.filter((file) => !isVideoEvidence(file));
    const videoFiles = files.filter((file) => isVideoEvidence(file));

    return (
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        {imageFiles.length > 0 && (
          <Image.PreviewGroup>
            <Space size={8} wrap>
              {imageFiles.map((file, index) => (
                <Image
                  key={`${file}-${index}`}
                  src={getImageUrl(file)}
                  width={92}
                  height={92}
                  style={{ objectFit: "cover", borderRadius: 8 }}
                  fallback="https://via.placeholder.com/92x92?text=Error"
                />
              ))}
            </Space>
          </Image.PreviewGroup>
        )}

        {videoFiles.length > 0 && (
          <Space size={12} wrap>
            {videoFiles.map((file, index) => (
              <video
                key={`${file}-${index}`}
                src={getImageUrl(file)}
                controls
                style={{ width: 220, maxWidth: "100%", borderRadius: 10, background: "#000" }}
              />
            ))}
          </Space>
        )}
      </Space>
    );
  };

  // Luong tranh chap: tai chi tiet tranh chap (bao gom bang chung 2 ben).
  const fetchDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getModeratorDisputeById(id);
      setDispute(data);
      setNotes(data?.moderatorNotes || "");
    } catch (err) {
      setError(viMessage(err.message) || "Không thể tải chi tiết khiếu nại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleResolve = async (resolution) => {
    // Luong tranh chap: quyet dinh cuoi refund/release.
    try {
      const updatedDispute = await resolveModeratorDispute(id, {
        resolution,
        moderatorNotes: notes
      });

      if (updatedDispute) {
        setDispute(updatedDispute);
      }

      message.success("Đã xử lý tranh chấp thành công");
      navigate("/moderator/disputes?status=resolved");
    } catch (err) {
      message.error(viMessage(err.message) || "Không thể xử lý tranh chấp");
    }
  };

  const handleInvestigating = async () => {
    // Luong tranh chap: chuyen sang investigating de mo giai doan dieu tra.
    try {
      await markModeratorDisputeInvestigating(id, notes);
      message.success("Đã chuyển trạng thái sang đang điều tra");
      fetchDetail();
    } catch (err) {
      message.error(viMessage(err.message) || "Không thể cập nhật trạng thái đang điều tra");
    }
  };

  const handleContinueChat = () => {
    if (!dispute?.chatConversationId) {
      message.warning('Chưa tìm thấy cuộc trò chuyện liên quan để tiếp tục.');
      return;
    }

    navigate(`/chat/${dispute.chatConversationId}`);
  };

  if (error) {
    return <Alert type="error" showIcon message={error} />;
  }

  const disputeTimeline = buildDisputeTimeline(dispute);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/moderator/disputes")}>Quay lại danh sách</Button>
        <Button onClick={handleContinueChat}>Chat tiếp trong report</Button>
      </Space>

      <Card className="mod-panel" title={`Chi tiết Khiếu nại: ${dispute?._id?.slice(-8)?.toUpperCase() || ""}`} loading={loading}>
        <Descriptions bordered column={1} labelStyle={{ width: 220, fontWeight: 700 }}>
          <Descriptions.Item label="Người mua">{dispute?.buyerId?.fullName || "Không có"}</Descriptions.Item>
          <Descriptions.Item label="Người bán">{dispute?.sellerId?.fullName || "Không có"}</Descriptions.Item>
          <Descriptions.Item label="Sản phẩm">{dispute?.productId?.title || "Không có"}</Descriptions.Item>
          <Descriptions.Item label="Giá trị đơn hàng">{Number(dispute?.orderId?.agreedAmount || 0).toLocaleString("vi-VN")} đ</Descriptions.Item>
          <Descriptions.Item label="Lý do khiếu nại">
            <Tag color={dispute?.reason === 'return_request' ? "purple" : "default"}>
              {disputeReasonLabels[dispute?.reason] || dispute?.reason || "Không có"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Diễn biến theo thời gian">
            {disputeTimeline.length === 0 ? (
              <Text type="secondary">Chưa có dữ liệu diễn biến</Text>
            ) : (
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                {disputeTimeline.map((event) => (
                  <Card key={event.key} size="small" style={{ borderRadius: 8 }}>
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      <Space size={8} wrap>
                        <Tag color="blue">{event.title}</Tag>
                        {event.time && (
                          <Text type="secondary">{new Date(event.time).toLocaleString('vi-VN')}</Text>
                        )}
                      </Space>
                      <Text>{event.description}</Text>
                      {!!event.media?.length && renderEvidenceSection(event.media, "")}
                    </Space>
                  </Card>
                ))}
              </Space>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {dispute?.status === "pending" && <Tag className="mod-status-pill" color="warning">Chờ xử lý</Tag>}
            {dispute?.status === "investigating" && <Tag className="mod-status-pill" color="processing">Đang điều tra</Tag>}
            {dispute?.status === "resolved" && <Tag className="mod-status-pill" color="success">Đã xử lý</Tag>}
          </Descriptions.Item>
          {dispute?.reason === 'return_request' && (
            <Descriptions.Item label="Người bán xác nhận nhận lại hàng">
              {dispute?.sellerConfirmedReturnAt
                ? <Tag color="green">Đã xác nhận vào {new Date(dispute.sellerConfirmedReturnAt).toLocaleDateString('vi-VN')}</Tag>
                : <Tag color="orange">Chưa xác nhận</Tag>}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Kết quả">{dispute?.resolution ? (disputeResolutionLabels[dispute.resolution] || dispute.resolution) : "Chưa xử lý"}</Descriptions.Item>
        </Descriptions>

        {dispute?.status !== "resolved" && (
          <div className="mod-action-row">
            <TextArea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú xử lý của moderator (tùy chọn)"
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
