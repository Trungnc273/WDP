import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth as firebaseAuth } from "../../config/firebase";
import "./Auth.css";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Lấy hàm login và biến user từ AuthContext thông qua hook useAuth
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Hàm kiểm tra lỗi nhập liệu
  const validateForm = () => {
    const newErrors = {};

    // Kiểm tra định dạng Email
    if (!formData.email) {
      newErrors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    // Kiểm tra độ dài mật khẩu
    if (!formData.password) {
      newErrors.password = "Mật khẩu không được để trống";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Cập nhật giá trị khi người dùng gõ vào ô input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Xóa thông báo lỗi của ô đó ngay khi người dùng bắt đầu sửa lại
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(firebaseAuth, provider);
      const idToken = await userCredential.user.getIdToken();
      await loginWithGoogle(idToken);
      navigate("/");
    } catch (error) {
      setErrors({ submit: error.message || "Đăng nhập Google thất bại" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Chặn nếu form không hợp lệ
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 2. Gọi hàm login từ AuthContext
      // Thường hàm login này sẽ lưu user vào localStorage và cập nhật State trong Context
      const result = await login(formData.email, formData.password);

      // 3. Logic điều hướng dựa trên Role (Quyền)
      // Lấy thông tin user vừa đăng nhập thành công
      // Nếu login() của bạn không trả về user, ta có thể lấy từ localStorage
      const currentUser = result || JSON.parse(localStorage.getItem("user"));

      if (currentUser) {
        if (currentUser.role === "admin") {
          // Nếu là Admin thì đưa vào trang admin
          navigate("/admin");
        } else if (currentUser.role === "moderator") {
          // Nếu là Moderator thì đưa vào trang moderator
          navigate("/moderator/dashboard");
        } else {
          // Nếu là khách hàng bình thường thì về trang chủ
          navigate("/");
        }
      }
    } catch (error) {
      // Hiển thị lỗi từ phía Server (ví dụ: Sai mật khẩu, tài khoản bị khóa)
      setErrors({
        submit: error.message || "Đăng nhập thất bại. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Đăng nhập</h2>
        <form onSubmit={handleSubmit}>
          {/* Ô nhập Email */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email"
              disabled={loading} // Khóa input khi đang load để tránh nhấn lung tung
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          {/* Ô nhập Mật khẩu */}
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu"
                disabled={loading}
                className={errors.password ? "input-error" : ""}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          {/* Thông báo lỗi tổng quát từ Server */}
          {errors.submit && (
            <div className="error-banner">
              <i className="fas fa-exclamation-circle"></i> {errors.submit}
            </div>
          )}

          <div
            className="forgot-password-link"
            style={{ marginBottom: "15px" }}
          >
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span className="spinner">Đang xử lý...</span>
            ) : (
              "Đăng nhập"
            )}
          </button>

          <div className="auth-divider">
            <span>Hoặc</span>
          </div>

          <button
            type="button"
            className="btn-google"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="google-logo" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>

            {loading ? "Đang xử lý..." : "Đăng nhập với Google"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
