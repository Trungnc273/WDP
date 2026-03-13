import { useEffect, useState } from "react";
import { Card, Table, Tag, Button, Typography, Select, message } from "antd";
import { EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getModeratorDisputes } from "../../../services/moderator.service";

const { Title } = Typography;

const ModDisputeList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [disputes, setDisputes] = useState([]);
  const initialStatus = searchParams.get("status") || "all";
  const [status, setStatus] = useState(initialStatus);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const reasonLabel = {
    not_as_described: "Không đúng mô tả",
    damaged: "Sản phẩm bị hỏng/hư hại",
    not_received: "Không nhận được hàng",
    counterfeit: "Hàng giả/hàng nhái",
    return_request: "Yêu cầu hoàn hàng",
    other: "Lý do khác"
  };

  const viMessage = (raw = "") => {
    const input = String(raw || "").trim();
    const map = {
      "Dispute resolved: refund to buyer": "Tranh chấp đã xử lý: Hoàn tiền cho người mua",
      "Dispute resolved: release to seller": "Tranh chấp đã xử lý: Nhả tiền cho người bán"
    };
    return map[input] || input;
  };

  // Tập trung hàm tải dữ liệu để bộ lọc và phân trang luôn đồng bộ.
  const fetchDisputes = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const result = await getModeratorDisputes({
        page,
        limit: pageSize,
        status: status === "all" ? undefined : status
      });
      setDisputes(result.items);
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.limit,
        total: result.pagination.total
      });
    } catch (error) {
      message.error(viMessage(error.message) || "Không thể tải danh sách khiếu nại");
    } finally {
      setLoading(false);
    }
  };

  // Đồng bộ trạng thái bộ lọc với query trên URL để reload vẫn giữ filter.
  useEffect(() => {
    const queryStatus = searchParams.get("status") || "all";
    if (queryStatus !== status) {
      setStatus(queryStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Mỗi khi đổi trạng thái lọc thì cập nhật URL và tải lại trang 1.
  useEffect(() => {
    setSearchParams(status === "all" ? {} : { status });
    fetchDisputes(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleResetFilter = () => {
    setStatus("all");
  };

  // Cấu hình cột bảng tranh chấp.
  const columns = [
    {
      title: "Mã KN",
      dataIndex: "_id",
      key: "_id",
      render: (text) => <b>{String(text).slice(-8).toUpperCase()}</b>
    },
    { title: "Người mua", dataIndex: ["buyerId", "fullName"], key: "buyer" },
    { title: "Người bán", dataIndex: ["sellerId", "fullName"], key: "seller" },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      render: (text) => <span className="mod-danger-text">{reasonLabel[text] || viMessage(text)}</span>
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (value) => {
        if (value === "pending") return <Tag className="mod-status-pill" color="warning">Chờ xử lý</Tag>;
        if (value === "investigating") return <Tag className="mod-status-pill" color="processing">Đang điều tra</Tag>;
        return <Tag className="mod-status-pill" color="success">Đã xử lý</Tag>;
      }
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Button type="primary" icon={<EyeOutlined />} onClick={() => navigate(`/moderator/disputes/${record._id}`)}>
          Chi tiết
        </Button>
      )
    }
  ];

  return (
    <Card className="mod-panel">
      <div className="mod-toolbar">
        <Title level={4} style={{ margin: 0 }}>Quản lý Tranh chấp</Title>
        <div className="mod-filter-row">
          <Select
            value={status}
            onChange={setStatus}
            style={{ width: 180 }}
            options={[
              { value: "all", label: "Tất cả" },
              { value: "pending", label: "Chờ xử lý" },
              { value: "investigating", label: "Đang điều tra" },
              { value: "resolved", label: "Đã xử lý" }
            ]}
          />
          <div className="mod-filter-actions">
            <Button icon={<ReloadOutlined />} className="mod-reset-btn" onClick={handleResetFilter}>Reset</Button>
          </div>
        </div>
      </div>

      <Table
        className="mod-table"
        rowKey="_id"
        columns={columns}
        dataSource={disputes}
        loading={loading}
        pagination={pagination}
        onChange={(pager) => fetchDisputes(pager.current, pager.pageSize)}
      />
    </Card>
  );
};

export default ModDisputeList;
