import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  Table,
  Tag,
  Button,
  Typography,
  Input,
  Select,
  Space,
  Modal,
  Descriptions,
  Avatar,
  DatePicker,
  Form,
  message,
  Popconfirm
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  UserSwitchOutlined,
  StopOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UnlockOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { adminUserApi } from "../../../services/adminApi";

const { Title, Text } = Typography;

function normalizeSearchKeyword(value) {
  return String(value || "").trim();
}

function validateSearchKeyword(keyword) {
  if (keyword.length > 100) {
    throw new Error("Từ khóa tìm kiếm không được vượt quá 100 ký tự");
  }
}

function isRestrictionStillActive(flag, until) {
  if (!flag) {
    return false;
  }

  if (!until) {
    return true;
  }

  const untilTime = dayjs(until);
  if (!untilTime.isValid()) {
    return false;
  }

  return untilTime.isAfter(dayjs());
}

function getEffectiveUserStatus(user) {
  const isModerator = user?.role === "moderator";

  const accountSuspended = isRestrictionStillActive(user?.isSuspended, user?.suspendedUntil);
  if (accountSuspended && isModerator) {
    return {
      type: "account_suspended",
      label: "Khóa nick",
      color: "red"
    };
  }

  const sellingRestricted =
    isRestrictionStillActive(user?.isSellingRestricted, user?.sellingRestrictedUntil) ||
    (accountSuspended && !isModerator);

  if (sellingRestricted) {
    return {
      type: "selling_restricted",
      label: "Hạn chế bán",
      color: "volcano"
    };
  }

  return {
    type: "active",
    label: "Đang hoạt động",
    color: "green"
  };
}

const UserManagement = () => {
  const [searchParams] = useSearchParams();
  const requestSeqRef = useRef(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [rawSearchKeyword, setRawSearchKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [restrictModalOpen, setRestrictModalOpen] = useState(false);
  const [restrictionTarget, setRestrictionTarget] = useState(null);
  const [restrictionSubmitting, setRestrictionSubmitting] = useState(false);
  const [restrictionForm] = Form.useForm();
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockTarget, setLockTarget] = useState(null);
  const [lockSubmitting, setLockSubmitting] = useState(false);
  const [lockForm] = Form.useForm();

  useEffect(() => {
    loadUsers(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, statusFilter, searchKeyword]);

  useEffect(() => {
    const statusFromQuery = searchParams.get("status") || "";
    if (statusFromQuery && statusFromQuery !== statusFilter) {
      setStatusFilter(statusFromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadUsers = async (page = 1, pageSize = 10) => {
    const requestSeq = ++requestSeqRef.current;

    try {
      setLoading(true);
      const keyword = normalizeSearchKeyword(searchKeyword);
      validateSearchKeyword(keyword);

      const response = await adminUserApi.getAllUsers({
        page,
        limit: pageSize,
        search: keyword,
        role: roleFilter,
        status: statusFilter
      });

      if (response.data && response.data.data) {
        if (requestSeq !== requestSeqRef.current) {
          return;
        }

        const loadedUsers = response.data.data.users || [];
        const pageInfo = response.data.data.pagination || {};

        setUsers(loadedUsers);
        setTotalUsers(pageInfo.total || 0);
        setPagination({
          current: pageInfo.page || page,
          pageSize: pageInfo.limit || pageSize,
          total: pageInfo.total || 0
        });
      } else {
        if (requestSeq !== requestSeqRef.current) {
          return;
        }

        setUsers([]);
        setTotalUsers(0);
        setPagination((prev) => ({ ...prev, current: page, pageSize, total: 0 }));
      }
    } catch (err) {
      if (requestSeq !== requestSeqRef.current) {
        return;
      }

      message.error(err.response?.data?.message || err.message || "Không thể tải danh sách người dùng");
      setUsers([]);
      setTotalUsers(0);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } finally {
      if (requestSeq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  };

  const visibleUsers = useMemo(() => {
    if (!statusFilter) {
      return users;
    }

    if (statusFilter === "suspended") {
      return users.filter((user) => getEffectiveUserStatus(user).type === "selling_restricted");
    }

    return users.filter((user) => getEffectiveUserStatus(user).type === statusFilter);
  }, [users, statusFilter]);

  const handlePromoteToModerator = async (user) => {
    if (!user?._id || user.role !== "user") {
      message.warning("Chỉ có thể nâng quyền tài khoản người dùng thường");
      return;
    }

    try {
      await adminUserApi.updateUser(user._id, { role: "moderator" });
      message.success(`Đã nâng quyền "${user.fullName}" lên Moderator`);

      if (selectedUser?._id === user._id) {
        setSelectedUser((prev) => (prev ? { ...prev, role: "moderator" } : prev));
      }

      loadUsers(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error(err.response?.data?.message || err.message || "Không thể nâng quyền người dùng");
    }
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setDetailModalOpen(true);

    try {
      const response = await adminUserApi.getUserById(user._id);
      if (response?.data?.data) {
        setSelectedUser(response.data.data);
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message || "Không thể tải chi tiết người dùng");
    }
  };

  const openRestrictionModal = (user) => {
    if (!user?._id || user?.role === "admin") {
      message.warning("Không thể hạn chế quyền bán của admin");
      return;
    }

    if (user?.role === "moderator") {
      message.warning("Tài khoản moderator không áp dụng hạn chế bán, hãy dùng thao tác khóa/mở khóa");
      return;
    }

    setRestrictionTarget(user);
    restrictionForm.setFieldsValue({
      reason: "",
      suspendedUntil: null
    });
    setRestrictModalOpen(true);
  };

  const closeRestrictionModal = () => {
    if (restrictionSubmitting) {
      return;
    }

    setRestrictModalOpen(false);
    setRestrictionTarget(null);
    restrictionForm.resetFields();
  };

  const handleRestrictSelling = async () => {
    if (!restrictionTarget?._id) {
      return;
    }

    try {
      const formValues = await restrictionForm.validateFields();
      const reason = String(formValues.reason || "").trim();
      const untilValue = formValues.suspendedUntil ? dayjs(formValues.suspendedUntil) : null;

      if (untilValue && !untilValue.isAfter(dayjs())) {
        throw new Error("Thời gian hạn chế phải sau thời điểm hiện tại");
      }

      setRestrictionSubmitting(true);
      const payload = {
        reason,
        ...(untilValue ? { suspendedUntil: untilValue.toISOString() } : {})
      };

      const response = await adminUserApi.restrictSelling(restrictionTarget._id, payload);
      const updatedUser = response?.data?.data;
      message.success(`Đã hạn chế quyền bán của "${restrictionTarget.fullName}" thành công`);

      if (selectedUser?._id === restrictionTarget._id && updatedUser) {
        setSelectedUser(updatedUser);
      }

      setRestrictModalOpen(false);
      setRestrictionTarget(null);
      restrictionForm.resetFields();
      loadUsers(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error(err.response?.data?.message || err.message || "Không thể hạn chế quyền bán");
    } finally {
      setRestrictionSubmitting(false);
    }
  };

  const handleUnrestrictSelling = async (user) => {
    if (!user?._id || user?.role === "admin" || user?.role === "moderator") {
      return;
    }

    try {
      const response = await adminUserApi.unrestrictSelling(user._id);
      const updatedUser = response?.data?.data;
      message.success(`Đã gỡ hạn chế quyền bán của "${user.fullName}" thành công`);

      if (selectedUser?._id === user._id && updatedUser) {
        setSelectedUser(updatedUser);
      }

      loadUsers(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error(err.response?.data?.message || err.message || "Không thể gỡ hạn chế quyền bán");
    }
  };

  const handleLockModeratorAccount = async (user) => {
    if (!user?._id || user?.role !== "moderator") {
      return;
    }

    setLockTarget(user);
    lockForm.setFieldsValue({
      reason: "",
      suspendedUntil: null
    });
    setLockModalOpen(true);
  };

  const closeLockModal = () => {
    if (lockSubmitting) {
      return;
    }

    setLockModalOpen(false);
    setLockTarget(null);
    lockForm.resetFields();
  };

  const submitLockModeratorAccount = async () => {
    if (!lockTarget?._id || lockTarget?.role !== "moderator") {
      return;
    }

    try {
      const formValues = await lockForm.validateFields();
      const reason = String(formValues.reason || "").trim();
      const untilValue = formValues.suspendedUntil ? dayjs(formValues.suspendedUntil) : null;

      if (untilValue && !untilValue.isAfter(dayjs())) {
        throw new Error("Thời gian khóa phải sau thời điểm hiện tại");
      }

      setLockSubmitting(true);
      const response = await adminUserApi.lockModeratorAccount(lockTarget._id, {
        reason,
        ...(untilValue ? { suspendedUntil: untilValue.toISOString() } : {})
      });
      const updatedUser = response?.data?.data;
      message.success(`Đã khóa tài khoản moderator "${lockTarget.fullName}"`);

      if (selectedUser?._id === lockTarget._id && updatedUser) {
        setSelectedUser(updatedUser);
      }

      setLockModalOpen(false);
      setLockTarget(null);
      lockForm.resetFields();

      loadUsers(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error(err.response?.data?.message || err.message || "Không thể khóa tài khoản moderator");
    } finally {
      setLockSubmitting(false);
    }
  };

  const handleUnlockModeratorAccount = async (user) => {
    if (!user?._id || user?.role !== "moderator") {
      return;
    }

    try {
      const response = await adminUserApi.unlockModeratorAccount(user._id);
      const updatedUser = response?.data?.data;
      message.success(`Đã mở khóa tài khoản moderator "${user.fullName}"`);

      if (selectedUser?._id === user._id && updatedUser) {
        setSelectedUser(updatedUser);
      }

      loadUsers(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error(err.response?.data?.message || err.message || "Không thể mở khóa tài khoản moderator");
    }
  };

  const handleApplyKeyword = () => {
    try {
      const normalizedKeyword = normalizeSearchKeyword(rawSearchKeyword);
      validateSearchKeyword(normalizedKeyword);
      setSearchKeyword(normalizedKeyword);
    } catch (err) {
      message.error(err.message || "Từ khóa không hợp lệ");
    }
  };

  const handleResetFilters = () => {
    setRawSearchKeyword("");
    setSearchKeyword("");
    setRoleFilter("");
    setStatusFilter("");
  };

  const columns = useMemo(
    () => [
      {
        title: "Họ tên",
        dataIndex: "fullName",
        key: "fullName",
        width: 180,
        render: (_, record) => (
          <Space style={{ width: "100%" }}>
            <Avatar src={record.avatar || "/images/placeholders/avatar-placeholder.svg"} />
            <Text
              strong
              style={{
                display: "inline-block",
                maxWidth: 130,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
              title={record.fullName || "Không có tên"}
            >
              {record.fullName || "Không có tên"}
            </Text>
          </Space>
        )
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        width: 220,
        ellipsis: true
      },
      {
        title: "Vai trò",
        dataIndex: "role",
        key: "role",
        width: 130,
        render: (role) => {
          if (role === "admin") return <Tag className="mod-status-pill" color="magenta">Admin</Tag>;
          if (role === "moderator") return <Tag className="mod-status-pill" color="blue">Moderator</Tag>;
          return <Tag className="mod-status-pill" color="default">Người dùng</Tag>;
        }
      },
      {
        title: "Trạng thái",
        key: "status",
        width: 160,
        render: (_, record) => {
          const status = getEffectiveUserStatus(record);
          return <Tag className="mod-status-pill" color={status.color}>{status.label}</Tag>;
        }
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 120,
        render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "N/A")
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 250,
        render: (_, record) => {
          const status = getEffectiveUserStatus(record);
          const isAccountSuspended = status.type === "account_suspended";
          const isSellingRestricted = status.type === "selling_restricted";
          const detailButtonStyle = { width: "100%", borderRadius: 10, fontWeight: 700, height: 38 };
          const functionButtonStyle = { width: "100%", borderRadius: 8, fontWeight: 600, height: 32 };

          const renderPromoteButton = () => {
            if (record.role === "user") {
              return (
                <Popconfirm
                  title={`Nâng quyền "${record.fullName}" lên Moderator?`}
                  onConfirm={() => handlePromoteToModerator(record)}
                >
                  <Button size="small" icon={<UserSwitchOutlined />} style={functionButtonStyle}>
                    Nâng Mod
                  </Button>
                </Popconfirm>
              );
            }

            if (record.role === "moderator") {
              return !isAccountSuspended ? (
                <Popconfirm
                  title={`Khóa tài khoản moderator "${record.fullName}"?`}
                    onConfirm={() => handleLockModeratorAccount(record)}
                >
                  <Button size="small" danger icon={<LockOutlined />} style={functionButtonStyle}>
                    Khóa
                  </Button>
                </Popconfirm>
              ) : (
                <Button size="small" disabled icon={<LockOutlined />} style={functionButtonStyle}>
                  Khóa
                </Button>
              );
            }

            return (
              <Button size="small" disabled style={functionButtonStyle}>
                Admin
              </Button>
            );
          };

          const renderSellingButton = () => {
            if (record.role === "moderator") {
              return isAccountSuspended ? (
                <Popconfirm
                  title={`Mở khóa tài khoản moderator "${record.fullName}"?`}
                  onConfirm={() => handleUnlockModeratorAccount(record)}
                >
                  <Button size="small" icon={<UnlockOutlined />} style={functionButtonStyle}>
                    Mở khóa
                  </Button>
                </Popconfirm>
              ) : (
                <Button size="small" disabled icon={<UnlockOutlined />} style={functionButtonStyle}>
                  Mở khóa
                </Button>
              );
            }

            if (record.role === "admin") {
              return (
                <Button size="small" disabled style={functionButtonStyle}>
                  Không áp dụng
                </Button>
              );
            }

            if (isAccountSuspended) {
              return (
                <Button size="small" disabled style={functionButtonStyle}>
                  Tạm ngưng
                </Button>
              );
            }

            if (isSellingRestricted) {
              return (
                <Popconfirm
                  title={`Gỡ hạn chế quyền bán của "${record.fullName}"?`}
                  onConfirm={() => handleUnrestrictSelling(record)}
                >
                  <Button size="small" icon={<CheckCircleOutlined />} style={functionButtonStyle}>
                    Gỡ hạn chế
                  </Button>
                </Popconfirm>
              );
            }

            return (
              <Button size="small" danger icon={<StopOutlined />} style={functionButtonStyle} onClick={() => openRestrictionModal(record)}>
                Hạn chế
              </Button>
            );
          };

          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, width: "100%", maxWidth: 200 }}>
              <Button type="primary" icon={<EyeOutlined />} style={detailButtonStyle} onClick={() => handleViewUser(record)}>
                Chi tiết
              </Button>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                {renderPromoteButton()}
                {renderSellingButton()}
              </div>
            </div>
          );
        }
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedUser, pagination.current, pagination.pageSize]
  );

  return (
    <Card className="mod-panel">
      <div className="mod-toolbar">
        <Title level={4} style={{ margin: 0 }}>Quản lý Người dùng</Title>
        <div className="mod-filter-row">
          <Input
            placeholder="Tìm theo tên, email, số điện thoại..."
            prefix={<SearchOutlined />}
            value={rawSearchKeyword}
            onChange={(e) => setRawSearchKeyword(e.target.value)}
            onPressEnter={handleApplyKeyword}
            style={{ width: 260 }}
          />

          <Select
            placeholder="Vai trò"
            allowClear
            className="mod-filter-select"
            popupClassName="mod-filter-select-dropdown"
            value={roleFilter || undefined}
            onChange={(value) => setRoleFilter(value || "")}
            getPopupContainer={(triggerNode) => triggerNode.parentElement}
            style={{ width: 160 }}
            options={[
              { value: "admin", label: "Admin" },
              { value: "moderator", label: "Moderator" },
              { value: "user", label: "Người dùng" }
            ]}
          />

          <Select
            placeholder="Trạng thái"
            allowClear
            className="mod-filter-select"
            popupClassName="mod-filter-select-dropdown"
            value={statusFilter || undefined}
            onChange={(value) => setStatusFilter(value || "")}
            getPopupContainer={(triggerNode) => triggerNode.parentElement}
            style={{ width: 200 }}
            options={[
              { value: "active", label: "Đang hoạt động" },
              { value: "selling_restricted", label: "Hạn chế bán" },
              { value: "account_suspended", label: "Khóa nick" }
            ]}
          />

          <div className="mod-filter-actions">
            <Button type="primary" onClick={handleApplyKeyword}>Lọc</Button>
            <Button icon={<ReloadOutlined />} className="mod-reset-btn" onClick={handleResetFilters}>Reset</Button>
          </div>
        </div>
      </div>

      <Table
        className="mod-table"
        rowKey="_id"
        columns={columns}
        dataSource={visibleUsers}
        loading={loading}
        tableLayout="fixed"
        pagination={pagination}
        onChange={(nextPagination) => loadUsers(nextPagination.current, nextPagination.pageSize)}
      />

      <div style={{ marginTop: 10 }}>
        <Text type="secondary">
          Tổng cộng: {Number(totalUsers || 0).toLocaleString("vi-VN")} tài khoản
        </Text>
      </div>

      <Modal
        title="Chi tiết người dùng"
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setSelectedUser(null);
        }}
        width={760}
        footer={
          selectedUser ? (
            <Space>
              <Button
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedUser(null);
                }}
              >
                Đóng
              </Button>

              {selectedUser.role === "user" && (
                <Popconfirm
                  title={`Nâng quyền "${selectedUser.fullName}" lên Moderator?`}
                  onConfirm={() => handlePromoteToModerator(selectedUser)}
                >
                  <Button type="primary" icon={<UserSwitchOutlined />}>
                    Nâng lên Mod
                  </Button>
                </Popconfirm>
              )}

              {selectedUser.role === "moderator" && (
                isRestrictionStillActive(selectedUser.isSuspended, selectedUser.suspendedUntil) ? (
                  <Popconfirm
                    title={`Mở khóa tài khoản moderator "${selectedUser.fullName}"?`}
                    onConfirm={() => handleUnlockModeratorAccount(selectedUser)}
                  >
                    <Button icon={<UnlockOutlined />}>Mở khóa tài khoản</Button>
                  </Popconfirm>
                ) : (
                  <Button danger icon={<LockOutlined />} onClick={() => handleLockModeratorAccount(selectedUser)}>
                    Khóa tài khoản
                  </Button>
                )
              )}

              {selectedUser.role === "user" && (
                selectedUser.isSellingRestricted ? (
                  <Popconfirm
                    title={`Gỡ hạn chế quyền bán của "${selectedUser.fullName}"?`}
                    onConfirm={() => handleUnrestrictSelling(selectedUser)}
                  >
                    <Button icon={<CheckCircleOutlined />}>Gỡ hạn chế quyền bán</Button>
                  </Popconfirm>
                ) : (
                  <Button danger icon={<StopOutlined />} onClick={() => openRestrictionModal(selectedUser)}>
                    Hạn chế
                  </Button>
                )
              )}
            </Space>
          ) : null
        }
      >
        {selectedUser && (
          <>
            <Space style={{ marginBottom: 12 }}>
              <Avatar size={56} src={selectedUser.avatar || "/images/placeholders/avatar-placeholder.svg"} />
              <div>
                <Text strong>{selectedUser.fullName || "Không có tên"}</Text>
                <br />
                <Text type="secondary">{selectedUser.email || "N/A"}</Text>
              </div>
            </Space>

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Vai trò">
                {selectedUser.role === "admin" ? "Admin" : selectedUser.role === "moderator" ? "Moderator" : "Người dùng"}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {getEffectiveUserStatus(selectedUser).label}
              </Descriptions.Item>
              <Descriptions.Item label="Xác thực email">
                {selectedUser.isVerified ? "Đã xác thực" : "Chưa xác thực"}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedUser.phone || "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {selectedUser.createdAt ? dayjs(selectedUser.createdAt).format("DD/MM/YYYY HH:mm") : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn chế đến">
                {isRestrictionStillActive(selectedUser.isSellingRestricted, selectedUser.sellingRestrictedUntil) && selectedUser.sellingRestrictedUntil
                  ? dayjs(selectedUser.sellingRestrictedUntil).format("DD/MM/YYYY HH:mm")
                  : "Không có"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {selectedUser.address || "Chưa cập nhật"}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>

      <Modal
        title="Hạn chế quyền bán"
        open={restrictModalOpen}
        onCancel={closeRestrictionModal}
        onOk={handleRestrictSelling}
        okText="Áp dụng"
        cancelText="Hủy"
        confirmLoading={restrictionSubmitting}
      >
        <Form form={restrictionForm} layout="vertical">
          <Form.Item
            label="Lý do hạn chế"
            name="reason"
            validateTrigger={["onChange", "onBlur"]}
            rules={[
              {
                validator: (_, value) => {
                  const content = String(value || "").trim();
                  if (!content) {
                    return Promise.reject(new Error("Vui lòng nhập lý do hạn chế"));
                  }
                  if (content.length < 10) {
                    return Promise.reject(new Error("Lý do hạn chế phải có ít nhất 10 ký tự"));
                  }
                  if (content.length > 500) {
                    return Promise.reject(new Error("Lý do hạn chế không được vượt quá 500 ký tự"));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input.TextArea rows={4} maxLength={500} placeholder="Nhập lý do hạn chế quyền bán" />
          </Form.Item>

          <Form.Item
            label="Hạn chế đến ngày (để trống sẽ áp dụng theo mức vi phạm)"
            name="suspendedUntil"
            validateTrigger={["onChange", "onBlur"]}
            rules={[
              {
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve();
                  }

                  const selected = dayjs(value);
                  if (!selected.isValid() || !selected.isAfter(dayjs())) {
                    return Promise.reject(new Error("Thời gian hạn chế phải sau thời điểm hiện tại"));
                  }

                  return Promise.resolve();
                }
              }
            ]}
          >
            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Khóa tài khoản moderator"
        open={lockModalOpen}
        onCancel={closeLockModal}
        onOk={submitLockModeratorAccount}
        okText="Khóa tài khoản"
        cancelText="Hủy"
        confirmLoading={lockSubmitting}
      >
        <Form form={lockForm} layout="vertical">
          <Form.Item
            label="Lý do khóa"
            name="reason"
            validateTrigger={["onChange", "onBlur"]}
            rules={[
              {
                validator: (_, value) => {
                  const content = String(value || "").trim();
                  if (!content) {
                    return Promise.reject(new Error("Vui lòng nhập lý do khóa"));
                  }
                  if (content.length < 10) {
                    return Promise.reject(new Error("Lý do khóa phải có ít nhất 10 ký tự"));
                  }
                  if (content.length > 500) {
                    return Promise.reject(new Error("Lý do khóa không được vượt quá 500 ký tự"));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input.TextArea rows={4} maxLength={500} placeholder="Nhập lý do khóa tài khoản moderator" />
          </Form.Item>

          <Form.Item
            label="Khóa đến ngày (để trống nếu vô thời hạn)"
            name="suspendedUntil"
            validateTrigger={["onChange", "onBlur"]}
            rules={[
              {
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve();
                  }

                  const selected = dayjs(value);
                  if (!selected.isValid() || !selected.isAfter(dayjs())) {
                    return Promise.reject(new Error("Thời gian khóa phải sau thời điểm hiện tại"));
                  }

                  return Promise.resolve();
                }
              }
            ]}
          >
            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement;
