import { Card, Descriptions, Button, Space, Tag, message, Popconfirm, Input, Select, Alert, Image } from "antd";
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ArrowLeftOutlined
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getModeratorReportById, resolveModeratorReport } from "../../../services/moderator.service";
import { getImageUrl } from "../../../utils/imageHelper";

const { TextArea } = Input;

function getWarningLevel(warningCount, isSuspended, shouldLockAccount) {
  if (isSuspended) {
    return { color: "error", message: "Tài khoản đang bị khóa do vi phạm từ báo cáo." };
  }

  if (shouldLockAccount) {
    return { color: "warning", message: `Đã đạt mốc ${warningCount} cảnh báo (mốc khóa 3/6/9).` };
  }

  if (warningCount === 0) {
    return { color: "success", message: "Người dùng chưa có cảnh báo nào." };
  }

  const remain = 3 - (warningCount % 3);
  return {
    color: remain === 1 ? "warning" : "info",
    message: `${warningCount} cảnh báo, còn ${remain} lần tới mốc khóa tiếp theo.`
  };
}

const ModReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reply, setReply] = useState("");
  const [replyToReportedUser, setReplyToReportedUser] = useState("");
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
      setReplyToReportedUser(data?.moderatorReplyToReportedUser || "");
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
        moderatorReply: reply,
        moderatorReplyToReportedUser: replyToReportedUser
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
  const warningLevel = getWarningLevel(warningCount, isSuspended, shouldLockAccount);
  const productWarningActions = Number(report?.productStats?.warningActions || 0);
  const productTotalReports = Number(report?.productStats?.totalReports || 0);
  const productIsRemoved = Boolean(report?.productStats?.isRemoved);

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
              <Tag className="mod-status-pill" color={isSuspended ? "red" : shouldLockAccount ? "volcano" : warningCount > 0 ? "gold" : "green"}>
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
          {report?.reportType === "product" && (
            <Descriptions.Item label="Mức vi phạm sản phẩm">
              <Space size={8} wrap>
                <Tag className="mod-status-pill" color={productWarningActions >= 3 ? "red" : productWarningActions >= 1 ? "gold" : "green"}>
                  {productWarningActions} cảnh báo
                </Tag>
                <Tag className="mod-status-pill" color={productTotalReports >= 6 ? "red" : productTotalReports >= 3 ? "volcano" : productTotalReports >= 1 ? "gold" : "default"}>
                  {productTotalReports} lần bị báo
                </Tag>
                {productIsRemoved && <Tag className="mod-status-pill" color="red">Bài đã bị gỡ</Tag>}
              </Space>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Ảnh bằng chứng (tối đa 4)">
            {report?.evidenceImages?.length ? (
              <Image.PreviewGroup>
                <Space size={8} wrap>
                  {report.evidenceImages.slice(0, 4).map((imageUrl, index) => (
                    <Image
                      key={`${imageUrl}-${index}`}
                      src={getImageUrl(imageUrl)}
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
          <Descriptions.Item label="Phản hồi tới người báo cáo">{report?.moderatorReply || "Chưa có phản hồi"}</Descriptions.Item>
          <Descriptions.Item label="Phản hồi tới người bị báo cáo">{report?.moderatorReplyToReportedUser || "Chưa có phản hồi"}</Descriptions.Item>
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
                ? "Mốc khóa áp dụng theo chu kỳ 3/6/9 cảnh báo với mức khóa tăng dần 24h, 1 tuần, 1 năm."
                : "Mốc khóa tài khoản: 3/6/9 cảnh báo."
            }
          />
        )}

        {(report?.status === "pending" || report?.status === "reviewing") && (
          <div className="mod-action-row mod-action-grid">
            <div className="mod-action-field">
              <span className="mod-action-label">Quyết định xử lý</span>
              <Select
                value={decision}
                style={{ width: "100%" }}
                onChange={setDecision}
                options={[
                  { value: "warn_user", label: "Cảnh báo người dùng" },
                  { value: "reply_feedback", label: "Trả lời phản hồi" },
                  { value: "ban_user", label: "Khóa tài khoản" },
                  { value: "remove_content", label: "Gỡ nội dung" }
                ]}
              />
            </div>

            <div className="mod-action-field">
              <span className="mod-action-label">Phản hồi tới người báo cáo</span>
              <TextArea
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Nhập phản hồi cho người báo cáo (tùy chọn)"
              />
            </div>

            <div className="mod-action-field">
              <span className="mod-action-label">Phản hồi tới người bị báo cáo</span>
              <TextArea
                rows={3}
                value={replyToReportedUser}
                onChange={(e) => setReplyToReportedUser(e.target.value)}
                placeholder="Nhập phản hồi cho người bị báo cáo (tùy chọn)"
              />
            </div>

            <div className="mod-action-buttons">
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
          </div>
        )}
      </Card>
    </Space>
  );
};

export default ModReportDetail;