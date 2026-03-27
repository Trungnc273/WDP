import { Card, Table, Button, Typography, Tag, Space, message, Modal, Input, Image } from "antd";
import { CheckOutlined, CloseOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { getProductImageUrl } from "../../../utils/imageHelper";
import { formatCategoryText } from "../../../utils/categoryHelper";
import {
  getModeratorPendingProducts,
  approveModeratorProduct,
  rejectModeratorProduct
} from "../../../services/moderator.service";

const { Title, Text } = Typography;
const { TextArea } = Input;

const ModProductList = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [rawKeyword, setRawKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredProducts = keyword
    ? products.filter((p) => {
        const title = (p.title || "").toLowerCase();
        const seller = (p.seller?.fullName || p.seller?.email || "").toLowerCase();
        const kw = keyword.toLowerCase();
        return title.includes(kw) || seller.includes(kw);
      })
    : products;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getModeratorPendingProducts();
      setProducts(data);
    } catch (error) {
      message.error(error.message || "Không tải được danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleApprove = async (id) => {
    try {
      await approveModeratorProduct(id);
      message.success("Đã duyệt sản phẩm");
      fetchProducts();
    } catch (error) {
      message.error(error.message || "Không thể duyệt sản phẩm");
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    setSubmitting(true);
    try {
      await rejectModeratorProduct(rejectTarget, rejectReason);
      message.success("Đã từ chối sản phẩm");
      setRejectTarget(null);
      setRejectReason("");
      fetchProducts();
    } catch (error) {
      message.error(error.message || "Không thể từ chối sản phẩm");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Ảnh",
      dataIndex: "images",
      key: "image",
      width: 80,
      render: (_, record) => (
        <Image
          src={getProductImageUrl(record)}
          width={60}
          height={60}
          style={{ objectFit: "cover", borderRadius: 4 }}
          fallback="/images/placeholders/product-placeholder.svg"
        />
      )
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "title",
      key: "title",
      render: (title, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {/* Dung helper chung de tranh manh nao chi hien 1 category. */}
            {formatCategoryText(record)}
          </Text>
        </Space>
      )
    },
    {
      title: "Người đăng",
      dataIndex: "seller",
      key: "seller",
      render: (seller) => seller?.fullName || seller?.email || "N/A"
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (price) => (
        <span className="mod-money-text">{Number(price || 0).toLocaleString("vi-VN")} đ</span>
      )
    },
    {
      title: "Tình trạng",
      dataIndex: "condition",
      key: "condition",
      render: (c) => {
        const map = { new: "Mới", "like-new": "Như mới", good: "Tốt", fair: "Khá", poor: "Kém" };
        return <Tag>{map[c] || c}</Tag>;
      }
    },
    {
      title: "Ngày đăng",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => date ? new Date(date).toLocaleDateString("vi-VN") : "N/A"
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
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
        <Title level={4} style={{ margin: 0 }}>Duyệt Sản phẩm</Title>
        <div className="mod-filter-row">
          <Input
            placeholder="Tìm theo tên sản phẩm, người đăng..."
            prefix={<SearchOutlined />}
            value={rawKeyword}
            onChange={(e) => setRawKeyword(e.target.value)}
            onPressEnter={() => setKeyword(rawKeyword)}
            style={{ width: 280 }}
          />
          <Tag color="orange" style={{ lineHeight: "32px", padding: "0 12px" }}>
            {filteredProducts.length} chờ duyệt
          </Tag>
          <div className="mod-filter-actions">
            <Button type="primary" onClick={() => setKeyword(rawKeyword)}>Lọc</Button>
            <Button
              icon={<ReloadOutlined />}
              className="mod-reset-btn"
              onClick={() => { setRawKeyword(""); setKeyword(""); fetchProducts(); }}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      <Table
        className="mod-table"
        columns={columns}
        dataSource={filteredProducts}
        loading={loading}
        rowKey="_id"
        pagination={{ pageSize: 20 }}
        locale={{ emptyText: "Không có sản phẩm nào chờ duyệt" }}
      />

      <Modal
        title="Lý do từ chối"
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

export default ModProductList;
