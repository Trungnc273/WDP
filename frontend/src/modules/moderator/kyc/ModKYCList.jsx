import {
  Card,
  Table,
  Button,
  Typography,
  Tag,
  Space,
  message,
  Modal,
  Input,
  Image,
  Descriptions,
  Divider,
  Alert,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import {
  getModeratorPendingKYC,
  approveModeratorKYC,
  rejectModeratorKYC,
} from "../../../services/moderator.service";

const { Title, Text } = Typography;
const { TextArea } = Input;

const ModKYCList = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [rawKeyword, setRawKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const [viewTarget, setViewTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredUsers = keyword
    ? users.filter((u) => {
        const name = (u.fullName || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const phone = (u.phone || "").toLowerCase();
        const kw = keyword.toLowerCase();
        return name.includes(kw) || email.includes(kw) || phone.includes(kw);
      })
    : users;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getModeratorPendingKYC();
      setUsers(data);
    } catch (error) {
      message.error(error.message || "Không tải được danh sách KYC");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId) => {
    try {
      await approveModeratorKYC(userId);
      message.success("Đã xác nhận KYC thành công");
      setViewTarget(null);
      fetchUsers();
    } catch (error) {
      message.error(error.message || "Không thể duyệt KYC");
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    if (rejectReason.length < 10) {
      return message.warning("Lý do từ chối phải ít nhất 10 ký tự");
    }
    setSubmitting(true);
    try {
      await rejectModeratorKYC(rejectTarget, rejectReason);
      message.success("Đã từ chối KYC");
      setRejectTarget(null);
      setRejectReason("");
      setViewTarget(null);
      fetchUsers();
    } catch (error) {
      message.error(error.message || "Không thể từ chối KYC");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Thông tin khách hàng",
      key: "user",
      width: 250,
      render: (_, record) => (
        <div style={{ padding: "4px 0" }}>
          <Text strong style={{ fontSize: 15, display: "block" }}>
            {record.fullName || "N/A"}
          </Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {record.email}
          </Text>
          <div style={{ marginTop: 4 }}>
            <Tag icon={<IdcardOutlined />} color="default">
              {record.phone || "No Phone"}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Ảnh CCCD (Mặt trước / Mặt sau)",
      dataIndex: "kycDocuments",
      key: "docs",
      width: 320,
      render: (docs) => (
        <Image.PreviewGroup>
          <Space size={12}>
            {docs?.idCardFront ? (
              <div className="img-wrapper">
                <Image
                  src={docs.idCardFront}
                  width={120}
                  height={80}
                  style={{
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid #f0f0f0",
                  }}
                />
                <div
                  style={{ fontSize: 10, textAlign: "center", color: "#999" }}
                >
                  Mặt trước
                </div>
              </div>
            ) : (
              <Tag>Thiếu ảnh trước</Tag>
            )}

            {docs?.idCardBack ? (
              <div className="img-wrapper">
                <Image
                  src={docs.idCardBack}
                  width={120}
                  height={80}
                  style={{
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid #f0f0f0",
                  }}
                />
                <div
                  style={{ fontSize: 10, textAlign: "center", color: "#999" }}
                >
                  Mặt sau
                </div>
              </div>
            ) : (
              <Tag>Thiếu ảnh sau</Tag>
            )}
          </Space>
        </Image.PreviewGroup>
      ),
    },
    {
      title: "Ngày gửi",
      dataIndex: "kycSubmittedAt",
      key: "kycSubmittedAt",
      render: (date) => (
        <div style={{ fontSize: 13 }}>
          {date
            ? new Date(date).toLocaleString("vi-VN", {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "N/A"}
        </div>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setViewTarget(record)}>
            Chi tiết
          </Button>
          <Button
            type="primary"
            style={{ background: "#52c41a", borderColor: "#52c41a" }}
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record._id)}
          >
            Duyệt
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => setRejectTarget(record._id)}
          >
            Loại
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      className="mod-panel"
      style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
    >
      <div
        className="mod-toolbar"
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Thẩm định KYC
          </Title>
          <Text type="secondary">Phê duyệt danh tính người dùng hệ thống</Text>
        </div>

        <div className="mod-filter-row" style={{ display: "flex", gap: 12 }}>
          <Input
            placeholder="Tên, email, SĐT..."
            prefix={<SearchOutlined />}
            value={rawKeyword}
            onChange={(e) => setRawKeyword(e.target.value)}
            onPressEnter={() => setKeyword(rawKeyword)}
            style={{ width: 250, borderRadius: 8 }}
          />
          <Button
            type="primary"
            style={{ borderRadius: 8 }}
            onClick={() => setKeyword(rawKeyword)}
          >
            Lọc
          </Button>
          <Button
            icon={<ReloadOutlined />}
            style={{ borderRadius: 8 }}
            onClick={() => {
              setRawKeyword("");
              setKeyword("");
              fetchUsers();
            }}
          />
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        loading={loading}
        rowKey="_id"
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Tổng cộng ${total} hồ sơ`,
        }}
        style={{ background: "#fff" }}
      />

      <Modal
        title={<Title level={4}>Thẩm định hồ sơ khách hàng</Title>}
        open={!!viewTarget}
        width={800}
        onCancel={() => setViewTarget(null)}
        footer={[
          <Button key="close" onClick={() => setViewTarget(null)}>
            Đóng
          </Button>,
          <Button
            key="reject"
            danger
            onClick={() => {
              setRejectTarget(viewTarget?._id);
              setViewTarget(null);
            }}
          >
            Từ chối
          </Button>,
          <Button
            key="approve"
            type="primary"
            style={{ background: "#52c41a" }}
            onClick={() => handleApprove(viewTarget?._id)}
          >
            Duyệt ngay
          </Button>,
        ]}
      >
        {viewTarget && (
          <div style={{ paddingTop: 12 }}>
            <Descriptions
              title="Thông tin cá nhân"
              bordered
              column={2}
              size="middle"
            >
              <Descriptions.Item label="Họ và tên" span={2}>
                <Text strong>{viewTarget.fullName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {viewTarget.email}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {viewTarget.phone || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {viewTarget.dateOfBirth
                  ? new Date(viewTarget.dateOfBirth).toLocaleDateString("vi-VN")
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Giới tính">
                {viewTarget.gender || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {viewTarget.address || "N/A"}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Chứng thực hình ảnh</Divider>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 16,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 8 }}
                >
                  Mặt trước
                </Text>
                <Image
                  src={viewTarget.kycDocuments?.idCardFront}
                  style={{ borderRadius: 8, border: "1px solid #ddd" }}
                />
              </div>
              <div style={{ textAlign: "center" }}>
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 8 }}
                >
                  Mặt sau
                </Text>
                <Image
                  src={viewTarget.kycDocuments?.idCardBack}
                  style={{ borderRadius: 8, border: "1px solid #ddd" }}
                />
              </div>
              <div style={{ textAlign: "center" }}>
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 8 }}
                >
                  Ảnh Selfie
                </Text>
                <Image
                  src={viewTarget.kycDocuments?.selfie}
                  style={{ borderRadius: 8, border: "1px solid #ddd" }}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Lý do từ chối hồ sơ"
        open={!!rejectTarget}
        onOk={handleRejectConfirm}
        okButtonProps={{ danger: true, loading: submitting }}
        onCancel={() => setRejectTarget(null)}
      >
        <Alert
          message="Người dùng sẽ nhận được email thông báo kèm lý do này."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Ví dụ: Ảnh mặt sau mờ, thông báo người dùng chụp lại..."
        />
      </Modal>
    </Card>
  );
};

export default ModKYCList;
