import { useEffect, useState } from "react";
import { Card, Typography, Descriptions, Form, Input, Button, Alert, Row, Col, Tag, Divider } from "antd";
import { UserOutlined, LockOutlined, EditOutlined, SaveOutlined } from "@ant-design/icons";
import { getProfile, updateProfile, changePassword } from "../../../services/user.service";
import { STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE } from '../../../utils/passwordValidator';
import "./ModProfile.css";

const { Title, Text } = Typography;

const PHONE_REGEX = /^0\d{9,10}$/;

const ModProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const clearAlerts = () => {
    setError("");
    setSuccess("");
  };

  const normalizeProfile = (rawProfile) => ({
    fullName: rawProfile?.fullName || "",
    phone: rawProfile?.phone || "",
    address: rawProfile?.address || "",
    email: rawProfile?.email || ""
  });

  useEffect(() => {
    // Tải thông tin tài khoản moderator để hiển thị và bind sẵn vào form chỉnh sửa.
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        clearAlerts();
        const response = await getProfile();
        const nextProfile = response?.data || null;
        setProfile(nextProfile);
        profileForm.setFieldsValue(normalizeProfile(nextProfile));
      } catch (err) {
        setError(err?.message || "Không thể tải thông tin tài khoản");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [profileForm]);

  const handleUpdateProfile = async (values) => {
    clearAlerts();

    try {
      setSavingProfile(true);
      const payload = {
        fullName: String(values.fullName || "").trim(),
        phone: String(values.phone || "").trim(),
        address: String(values.address || "").trim()
      };

      const result = await updateProfile(payload);
      const nextProfile = result?.data || profile;
      setProfile(nextProfile);
      profileForm.setFieldsValue(normalizeProfile(nextProfile));
      setSuccess("Cập nhật thông tin kiểm duyệt viên thành công");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Không thể cập nhật thông tin");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (values) => {
    clearAlerts();

    try {
      setSavingPassword(true);
      await changePassword(values.currentPassword, values.newPassword);
      setSuccess("Đổi mật khẩu thành công");
      passwordForm.resetFields();
    } catch (err) {
      const message = err?.message ?? err?.response?.data?.message ?? "Đổi mật khẩu thất bại";
      setError(message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mod-profile-page">
      <div className="mod-page-header">
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>Thông tin kiểm duyệt viên</Title>
          <Text className="mod-page-subtitle">Quản lý hồ sơ cá nhân và bảo mật tài khoản moderator</Text>
        </div>
      </div>

      {(error || success) && (
        <Alert
          style={{ marginBottom: 16 }}
          type={error ? "error" : "success"}
          message={error || success}
          showIcon
          closable
          onClose={clearAlerts}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card className="mod-panel" loading={loadingProfile} title={<><UserOutlined /> Hồ sơ cá nhân</>}>
            <Descriptions column={1} size="middle" className="mod-profile-summary">
              <Descriptions.Item label="Vai trò">
                <Tag color={profile?.role === "admin" ? "red" : "gold"}>
                  {profile?.role === "admin" ? "Quản trị viên" : "Kiểm duyệt viên"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Họ tên hiện tại">
                <Text strong>{profile?.fullName || "N/A"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Email hệ thống">
                <Text>{profile?.email || "N/A"}</Text>
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: "14px 0" }} />

            <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
              <Form.Item
                name="fullName"
                label="Họ tên"
                rules={[
                  { required: true, message: "Vui lòng nhập họ tên" },
                  { min: 2, message: "Họ tên phải có ít nhất 2 ký tự" },
                  { max: 80, message: "Họ tên không được vượt quá 80 ký tự" }
                ]}
              >
                <Input placeholder="Nhập họ tên" prefix={<EditOutlined />} maxLength={80} />
              </Form.Item>

              <Form.Item name="email" label="Email" tooltip="Email không thể chỉnh sửa từ trang này">
                <Input disabled />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  {
                    validator: (_, value) => {
                      const phone = String(value || "").trim();
                      if (!phone) return Promise.resolve();
                      if (!PHONE_REGEX.test(phone)) {
                        return Promise.reject(new Error("Số điện thoại phải bắt đầu bằng 0 và có 10-11 chữ số"));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input placeholder="VD: 0912345678" maxLength={11} />
              </Form.Item>

              <Form.Item
                name="address"
                label="Địa chỉ"
                rules={[{ max: 255, message: "Địa chỉ không được vượt quá 255 ký tự" }]}
              >
                <Input.TextArea rows={3} placeholder="Nhập địa chỉ" maxLength={255} showCount />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={savingProfile} icon={<SaveOutlined />}>
                Lưu thông tin
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card className="mod-panel" title={<><LockOutlined /> Bảo mật tài khoản</>}>
            <Text className="mod-page-subtitle">Mật khẩu mới phải có tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</Text>
            <Divider style={{ margin: "12px 0 16px" }} />

            <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
              <Form.Item
                name="currentPassword"
                label="Mật khẩu hiện tại"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại" }]}
              >
                <Input.Password placeholder="Nhập mật khẩu hiện tại" />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="Mật khẩu mới"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu mới" },
                  {
                    pattern: STRONG_PASSWORD_REGEX,
                    message: STRONG_PASSWORD_MESSAGE
                  }
                ]}
              >
                <Input.Password placeholder="Nhập mật khẩu mới" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu mới"
                dependencies={["newPassword"]}
                rules={[
                  { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Xác nhận mật khẩu không khớp"));
                    }
                  })
                ]}
              >
                <Input.Password placeholder="Nhập lại mật khẩu mới" />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={savingPassword}>
                Đổi mật khẩu
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ModProfile;
