import { Card, Table, Button, Typography, Tag, Space, message, Select, Modal, Input } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { getModeratorWithdrawals, updateModeratorWithdrawalStatus } from "../../../services/moderator.service";

const { Title } = Typography;
const { TextArea } = Input;

const ModWithdrawalList = () => {
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [status, setStatus] = useState("pending");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  // Dùng một hàm fetch chung để tránh lệch dữ liệu giữa lọc và phân trang.
  const fetchWithdrawals = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const result = await getModeratorWithdrawals({ page, limit: pageSize, status });
      setWithdrawals(result.items);
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.limit,
        total: result.pagination.total
      });
    } catch (error) {
      message.error(error.message || "Không tải được yêu cầu rút tiền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleApprove = async (id) => {
    try {
      await updateModeratorWithdrawalStatus(id, "completed");
      message.success("Đã duyệt yêu cầu rút tiền");
      fetchWithdrawals(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.message || "Không thể duyệt yêu cầu");
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await updateModeratorWithdrawalStatus(rejectTarget, "failed", rejectNote);
      message.success("Đã từ chối yêu cầu rút tiền");
      setRejectTarget(null);
      setRejectNote("");
      fetchWithdrawals(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.message || "Không thể từ chối yêu cầu");
    }
  };

  const columns = [
    { title: "Mã YC", dataIndex: "_id", key: "id", render: (text) => <b>{String(text).slice(-8).toUpperCase()}</b> },
    { title: "Người dùng", dataIndex: ["userId", "fullName"], key: "user" },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (value) => <span className="mod-money-text">{Number(value || 0).toLocaleString("vi-VN")} đ</span>
    },
    {
      title: "Thông tin Bank",
      dataIndex: "metadata",
      key: "bank",
      render: (metadata) => `${metadata?.bankName || "N/A"} - ${metadata?.bankAccount || "N/A"}`
    },
    { 
      title: "Trạng thái", 
      dataIndex: "status", 
      key: "status",
      render: (status) => {
        if (status === "pending") return <Tag className="mod-status-pill" color="warning">Chờ duyệt</Tag>;
        if (status === "completed") return <Tag className="mod-status-pill" color="success">Đã chuyển</Tag>;
        return <Tag className="mod-status-pill" color="error">Từ chối</Tag>;
      }
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        record.status === "pending" && (
          <Space>
            <Button type="primary" style={{ background: "#52c41a" }} icon={<CheckOutlined />} onClick={() => handleApprove(record._id)}>Duyệt</Button>
            <Button danger icon={<CloseOutlined />} onClick={() => setRejectTarget(record._id)}>Từ chối</Button>
          </Space>
        )
      )
    }
  ];

  return (
    <Card className="mod-panel">
      <Space className="mod-toolbar" style={{ width: "100%" }} wrap>
        <Title level={4} style={{ margin: 0 }}>Yêu cầu Rút tiền</Title>
        <Select
          value={status}
          onChange={setStatus}
          style={{ width: 180 }}
          options={[
            { value: "pending", label: "Chờ duyệt" },
            { value: "completed", label: "Đã duyệt" },
            { value: "failed", label: "Từ chối" },
            { value: "cancelled", label: "Đã hủy" }
          ]}
        />
      </Space>
      <Table
        className="mod-table"
        columns={columns}
        dataSource={withdrawals}
        loading={loading}
        rowKey="_id"
        pagination={pagination}
        onChange={(pager) => fetchWithdrawals(pager.current, pager.pageSize)}
      />

      <Modal
        title="Lý do từ chối"
        open={!!rejectTarget}
        onOk={handleReject}
        onCancel={() => {
          setRejectTarget(null);
          setRejectNote("");
        }}
      >
        <TextArea
          rows={4}
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="Nhập lý do từ chối (tối thiểu 5 ký tự)"
        />
      </Modal>
    </Card>
  );
};

export default ModWithdrawalList;