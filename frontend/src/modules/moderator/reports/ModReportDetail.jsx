import { Card, Descriptions, Button, Space, Tag, message, Popconfirm, Input, Select, Alert, Image } from "antd";
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ArrowLeftOutlined
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getModeratorReportById, resolveModeratorReport } from "../../../services/moderator.service";

const { TextArea } = Input;

function getWarningLevel(warningCount, isSuspended) {
  if (isSuspended || warningCount >= 3) {
    return { color: "error", message: "Tai khoan da bi khoa do vuot nguong 3 canh bao." };
  }
  if (warningCount === 2) {
    return { color: "warning", message: "Canh bao lan 2: neu them 1 lan se bi khoa tai khoan." };
  }
  if (warningCount === 1) {
    return { color: "info", message: "Da co 1 canh bao truoc do." };
  }
  return { color: "success", message: "Nguoi dung chua co canh bao nao." };
}

const ModReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reply, setReply] = useState("");
  const [decision, setDecision] = useState("warn_user");
  const [error, setError] = useState("");

  // Dùng một hàm tải chi tiết duy nhất để sau thao tác có thể gọi lại đúng dữ liệu mới nhất.
  const fetchDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getModeratorReportById(id);
      setReport(data);
      setReply(data?.moderatorReply || "");
      setDecision(data?.moderatorDecision || "warn_user");
    } catch (err) {
      setError(err.message || "Không thể tải chi tiết báo cáo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAction = async (status) => {
    try {
      await resolveModeratorReport(id, {
        status,
        moderatorDecision: decision,
        moderatorReply: reply
      });
      message.success("Đã xử lý báo cáo thành công");
      fetchDetail();
    } catch (err) {
      message.error(err.message || "Không thể xử lý báo cáo");
    }
  };

  if (error) {
    return <Alert type="error" showIcon message={error} />;
  }

  const warningCount = Number(report?.reportedUserStats?.warningCount || 0);
  const totalReports = Number(report?.reportedUserStats?.totalReports || 0);
  const isSuspended = Boolean(report?.reportedUserStats?.isSuspended);
  const shouldLockAccount = Boolean(report?.reportedUserStats?.shouldLockAccount);
  const warningLevel = getWarningLevel(warningCount, isSuspended);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/moderator/reports")}>
        Quay lại danh sách
      </Button>

      <Card className="mod-panel" title={`Chi tiết Báo cáo: ${report?._id?.slice(-8)?.toUpperCase() || ""}`} loading={loading}>
        <Descriptions bordered column={1} labelStyle={{ width: "200px", fontWeight: "bold" }}>
          <Descriptions.Item label="Người tố cáo">{report?.reporterId?.fullName || "N/A"}</Descriptions.Item>
          <Descriptions.Item label="Đối tượng bị tố cáo">{report?.reportedUserId?.fullName || report?.productId?.title || "N/A"}</Descriptions.Item>
          <Descriptions.Item label="Sản phẩm liên quan">
            {report?.productId?._id ? (
              <Button type="link" onClick={() => navigate(`/product/${report.productId._id}`)} style={{ padding: 0 }}>
                {report.productId.title}
              </Button>
            ) : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Lý do">{report?.reason}</Descriptions.Item>
          <Descriptions.Item label="Chi tiết">{report?.description}</Descriptions.Item>
          {report?.reportType === "user" && (
            <Descriptions.Item label="Số lần bị cảnh báo">
              <Tag className="mod-status-pill" color={isSuspended || shouldLockAccount ? "red" : warningCount >= 2 ? "volcano" : warningCount >= 1 ? "gold" : "green"}>
                {warningCount} lần
              </Tag>
            </Descriptions.Item>
          )}
          {report?.reportType === "user" && (
            <Descriptions.Item label="Số lần bị báo cáo">
              <Tag className="mod-status-pill" color={totalReports >= 6 ? "red" : totalReports >= 3 ? "volcano" : totalReports >= 1 ? "gold" : "default"}>
                {totalReports} lần
              </Tag>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Ảnh bằng chứng (tối đa 4)">
            {report?.evidenceImages?.length ? (
              <Image.PreviewGroup>
                <Space size={8} wrap>
                  {report.evidenceImages.slice(0, 4).map((imageUrl, index) => (
                    <Image
                      key={`${imageUrl}-${index}`}
                      src={imageUrl}
                      width={84}
                      height={84}
                      style={{ objectFit: "cover", borderRadius: 8 }}
                      fallback="https://via.placeholder.com/84x84?text=Error"
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            ) : (
              <span>Không có ảnh bằng chứng</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Phản hồi tới người dùng">{report?.moderatorReply || "Chưa có phản hồi"}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {report?.status === "pending" && <Tag className="mod-status-pill" color="warning">Chờ xử lý</Tag>}
            {report?.status === "reviewing" && <Tag className="mod-status-pill" color="processing">Đang xem xét</Tag>}
            {report?.status === "resolved" && <Tag className="mod-status-pill" color="success">Đã giải quyết</Tag>}
            {report?.status === "dismissed" && <Tag className="mod-status-pill" color="default">Đã bỏ qua</Tag>}
          </Descriptions.Item>
        </Descriptions>

        {report?.reportType === "user" && (
          <Alert
            showIcon
            style={{ marginTop: 14 }}
            type={warningLevel.color}
            message={warningLevel.message}
            description={
              isSuspended || shouldLockAccount
                ? "Nguoi dung nay dang o muc rui ro cao. He thong can theo doi chat cac phat sinh tiep theo."
                : "Moc khoa tai khoan: 3 canh bao."
            }
          />
        )}

        {(report?.status === "pending" || report?.status === "reviewing") && (
          <div className="mod-action-row">
            <Select
              value={decision}
              style={{ width: 220 }}
              onChange={setDecision}
              options={[
                { value: "warn_user", label: "Cảnh báo người dùng" },
                { value: "reply_feedback", label: "Trả lời phản hồi" },
                { value: "ban_user", label: "Khóa tài khoản" },
                { value: "remove_content", label: "Gỡ nội dung" }
              ]}
            />
            <TextArea
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Phản hồi gửi cho người dùng báo cáo (tùy chọn)"
              style={{ minWidth: 320, flex: 1 }}
            />

            <Popconfirm title="Xác nhận đã giải quyết báo cáo này?" onConfirm={() => handleAction("resolved")}>
              <Button type="primary" style={{ background: "#52c41a" }} icon={<CheckCircleOutlined />}>
                Đánh dấu Đã giải quyết
              </Button>
            </Popconfirm>

            <Popconfirm title="Bỏ qua báo cáo này (báo cáo sai)?" onConfirm={() => handleAction("dismissed")}>
              <Button icon={<CloseCircleOutlined />}>
                Bỏ qua báo cáo
              </Button>
            </Popconfirm>
          </div>
        )}
      </Card>
    </Space>
  );
};

export default ModReportDetail;