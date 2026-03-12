import { Card, Table, Button, Typography, Tag, Space, message, Modal, Input, Image, Descriptions } from "antd";
import { CheckOutlined, CloseOutlined, EyeOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import {
  getModeratorPendingKYC,
  approveModeratorKYC,
  rejectModeratorKYC
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
      title: "Người dùng",
      key: "user",
      render: (_, record) => (
        <Space>
          <div>
            <Text strong>{record.fullName || "N/A"}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
          </div>
        </Space>
      )
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      render: (phone) => phone || "Chưa có"
    },
    {
      title: "Ngày gửi",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date) => date ? new Date(date).toLocaleDateString("vi-VN") : "N/A"
    },
    {
      title: "Ảnh CCCD",
      dataIndex: "kycDocuments",
      key: "docs",
      render: (docs) => (
        <Space>
          {docs?.idCardFront && (
            <Image src={docs.idCardFront} width={50} height={35} style={{ objectFit: "cover", borderRadius: 3 }} />
          )}
          {docs?.idCardBack && (
            <Image src={docs.idCardBack} width={50} height={35} style={{ objectFit: "cover", borderRadius: 3 }} />
          )}
          {!docs?.idCardFront && <Text type="secondary">Chưa có</Text>}
        </Space>
      )
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setViewTarget(record)}>Xem</Button>
          <Button
            type="primary"
            style={{ background: "#52c41a" }}
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
            Từ chối
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Card className="mod-panel">
      <div className="mod-toolbar">
        <Title level={4} style={{ margin: 0 }}>Xác minh KYC</Title>
        <div className="mod-filter-row">
          <Input
            placeholder="Tìm theo tên, email, số điện thoại..."
            prefix={<SearchOutlined />}
            value={rawKeyword}
            onChange={(e) => setRawKeyword(e.target.value)}
            onPressEnter={() => setKeyword(rawKeyword)}
            style={{ width: 280 }}
          />
          <Tag color="blue" style={{ lineHeight: "32px", padding: "0 12px" }}>
            {filteredUsers.length} chờ xét duyệt
          </Tag>
          <div className="mod-filter-actions">
            <Button type="primary" onClick={() => setKeyword(rawKeyword)}>Lọc</Button>
            <Button
              icon={<ReloadOutlined />}
              className="mod-reset-btn"
              onClick={() => { setRawKeyword(""); setKeyword(""); fetchUsers(); }}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      <Table
        className="mod-table"
        columns={columns}
        dataSource={filteredUsers}
        loading={loading}
        rowKey="_id"
        pagination={{ pageSize: 20 }}
        locale={{ emptyText: "Không có hồ sơ KYC nào chờ duyệt" }}
      />

      {/* Modal xem chi tiết hồ sơ KYC */}
      <Modal
        title="Chi tiết hồ sơ KYC"
        open={!!viewTarget}
        footer={[
          <Button key="reject" danger icon={<CloseOutlined />} onClick={() => { setRejectTarget(viewTarget?._id); setViewTarget(null); }}>
            Từ chối
          </Button>,
          <Button key="approve" type="primary" style={{ background: "#52c41a" }} icon={<CheckOutlined />} onClick={() => handleApprove(viewTarget?._id)}>
            Duyệt KYC
          </Button>
        ]}
        onCancel={() => setViewTarget(null)}
        width={700}
      >
        {viewTarget && (
          <div>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Họ tên">{viewTarget.fullName || "N/A"}</Descriptions.Item>
              <Descriptions.Item label="Email">{viewTarget.email}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{viewTarget.phone || "Chưa có"}</Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">{viewTarget.dateOfBirth ? new Date(viewTarget.dateOfBirth).toLocaleDateString("vi-VN") : "Chưa có"}</Descriptions.Item>
            </Descriptions>
            <Title level={5}>Ảnh giấy tờ</Title>
            <Space wrap size={16}>
              {viewTarget.kycDocuments?.idCardFront && (
                <div>
                  <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>Mặt trước CCCD</Text>
                  <Image src={viewTarget.kycDocuments.idCardFront} width={200} style={{ borderRadius: 6 }} />
                </div>
              )}
              {viewTarget.kycDocuments?.idCardBack && (
                <div>
                  <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>Mặt sau CCCD</Text>
                  <Image src={viewTarget.kycDocuments.idCardBack} width={200} style={{ borderRadius: 6 }} />
                </div>
              )}
              {viewTarget.kycDocuments?.selfie && (
                <div>
                  <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>Ảnh selfie</Text>
                  <Image src={viewTarget.kycDocuments.selfie} width={200} style={{ borderRadius: 6 }} />
                </div>
              )}
            </Space>
          </div>
        )}
      </Modal>

      {/* Modal nhập lý do từ chối */}
      <Modal
        title="Lý do từ chối KYC"
        open={!!rejectTarget}
        onOk={handleRejectConfirm}
        okText="Xác nhận từ chối"
        okButtonProps={{ danger: true, loading: submitting }}
        onCancel={() => {
          setRejectTarget(null);
          setRejectReason("");
        }}
      >
        <TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Nhập lý do từ chối (tối thiểu 10 ký tự)"
        />
      </Modal>
    </Card>
  );
};

export default ModKYCList;
