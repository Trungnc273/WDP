import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth as firebaseAuth } from "../../config/firebase";
import { validateStrongPassword } from "../../utils/passwordValidator";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import "./Auth.css";

function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    address: "",
  });

  // State cho OTP và Đếm ngược
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const otpRefs = useRef([]);
  const [timeLeft, setTimeLeft] = useState(300); // 300 giây = 5 phút

  // Ẩn hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { requestRegisterOtp, verifyAndRegister, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const navigateRoute = (currentUser) => {
    let user = currentUser;
    if (!user) {
      try {
        user = JSON.parse(localStorage.getItem("user"));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }

    if (user?.role === "admin") {
      navigate("/admin/dashboard");
      return;
    }

    if (user?.role === "moderator") {
      navigate("/moderator/dashboard");
      return;
    }

    navigate("/");
  };

  // Hiệu ứng đếm ngược thời gian cho
  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
      return () => clearInterval(timerId); // Cleanup function tránh rò rỉ bộ nhớ
    }
  }, [step, timeLeft]);

  // Hàm format thời gian từ giây sang mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Họ tên không được để trống";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Số điện thoại không được để trống";
    } else if (!/^0\d{9,10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Địa chỉ không được để trống";
    } else if (formData.address.trim().length > 255) {
      newErrors.address = "Địa chỉ không được vượt quá 255 ký tự";
    }

    const passwordValidation = validateStrongPassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleChangeOtp = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.nextSibling && element.value !== "") {
      element.nextSibling.focus();
    }
  };

  const handleKeyDownOtp = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handlePasteOtp = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text/plain")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    const focusIndex = Math.min(pastedData.length, 5);
    otpRefs.current[focusIndex].focus();
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(firebaseAuth, provider);
      const idToken = await userCredential.user.getIdToken();
      const currentUser = await loginWithGoogle(idToken);
      navigateRoute(currentUser);
    } catch (error) {
      setErrors({ submit: error.message || "Đăng ký Google thất bại" });
    } finally {
      setLoading(false);
    }
  };

  // yêu cầu OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await requestRegisterOtp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phone,
        formData.address,
      );
      setSuccessMessage(res.message || "Mã OTP đã được gửi đến email của bạn.");
      setTimeLeft(300); // Reset đồng hồ về 5 phút
      setStep(2);
    } catch (error) {
      setErrors({ submit: error.message || "Không thể gửi mã OTP" });
    } finally {
      setLoading(false);
    }
  };

  // Nút Gửi lại mã OTP
  const handleResendOtp = async () => {
    setErrors({});
    setLoading(true);
    try {
      await requestRegisterOtp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phone,
        formData.address,
      );
      setSuccessMessage("Mã OTP mới đã được gửi đến email của bạn.");
      setTimeLeft(300); // Reset lại đồng hồ
      setOtp(new Array(6).fill("")); // Xóa trắng các ô OTP cũ
      otpRefs.current[0]?.focus(); // Focus lại vào ô đầu tiên
    } catch (error) {
      setErrors({ submit: error.message || "Không thể gửi lại mã OTP" });
    } finally {
      setLoading(false);
    }
  };

  // xác nhận OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrors({});

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setErrors({ otpCode: "Vui lòng nhập đủ 6 số xác thực" });
      return;
    }

    setLoading(true);
    try {
      await verifyAndRegister(formData.email, otpString);
      navigate("/");
    } catch (error) {
      setErrors({ submit: error.message || "Xác thực OTP thất bại" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{step === 1 ? "Đăng ký tài khoản" : "Xác thực Email"}</h2>

        {step === 1 && (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label htmlFor="fullName">Họ và tên</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nhập họ và tên"
                disabled={loading}
              />
              {errors.fullName && (
                <span className="error">{errors.fullName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập email"
                disabled={loading}
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Số điện thoại</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Nhập số điện thoại"
                disabled={loading}
              />
              {errors.phone && <span className="error">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="address">Địa chỉ</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Nhập địa chỉ"
                disabled={loading}
              />
              {errors.address && (
                <span className="error">{errors.address}</span>
              )}
            </div>

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
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </button>
              </div>
              {errors.password && (
                <span className="error">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeInvisibleOutlined />
                  ) : (
                    <EyeOutlined />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error">{errors.confirmPassword}</span>
              )}
            </div>

            {/* Checklist kiểm tra mật khẩu mạnh */}
            <div
              className="password-requirements"
              style={{ marginBottom: "24px" }}
            >
              <h4>Yêu cầu mật khẩu:</h4>
              <ul>
                <li
                  className={
                    formData.password.length >= 8 ? "requirement-met" : ""
                  }
                >
                  <i
                    className={`fas ${formData.password.length >= 8 ? "fa-check" : "fa-times"}`}
                  ></i>
                  Ít nhất 8 ký tự
                </li>
                <li
                  className={
                    /[a-z]/.test(formData.password) ? "requirement-met" : ""
                  }
                >
                  <i
                    className={`fas ${/[a-z]/.test(formData.password) ? "fa-check" : "fa-times"}`}
                  ></i>
                  Chứa chữ thường (a-z)
                </li>
                <li
                  className={
                    /[A-Z]/.test(formData.password) ? "requirement-met" : ""
                  }
                >
                  <i
                    className={`fas ${/[A-Z]/.test(formData.password) ? "fa-check" : "fa-times"}`}
                  ></i>
                  Chứa chữ hoa (A-Z)
                </li>
                <li
                  className={
                    /[0-9]/.test(formData.password) ? "requirement-met" : ""
                  }
                >
                  <i
                    className={`fas ${/[0-9]/.test(formData.password) ? "fa-check" : "fa-times"}`}
                  ></i>
                  Chứa số (0-9)
                </li>
                <li
                  className={
                    /[^A-Za-z0-9]/.test(formData.password)
                      ? "requirement-met"
                      : ""
                  }
                >
                  <i
                    className={`fas ${/[^A-Za-z0-9]/.test(formData.password) ? "fa-check" : "fa-times"}`}
                  ></i>
                  Chứa ký tự đặc biệt (!@#$%^&*)
                </li>
              </ul>
            </div>

            {errors.submit && (
              <div className="error-message">{errors.submit}</div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Đang gửi mã..." : "Đăng ký"}
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
              {loading ? "Đang xử lý..." : "Đăng ký với Google"}
            </button>
          </form>
        )}

        {/* Form nhập OTP 6 ô */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <p className="auth-description" style={{ marginBottom: "15px" }}>
              Chúng tôi đã gửi một mã xác thực 6 số đến email{" "}
              <strong>{formData.email}</strong>.
            </p>

            {successMessage && (
              <div className="success-banner" style={{ marginBottom: "20px" }}>
                <i className="fas fa-check-circle"></i> {successMessage}
              </div>
            )}

            {/* Đồng hồ đếm ngược */}
            <div
              style={{
                textAlign: "center",
                marginBottom: "20px",
                fontSize: "15px",
              }}
            >
              {timeLeft > 0 ? (
                <p style={{ color: "#666", margin: 0 }}>
                  Mã hết hạn sau:{" "}
                  <strong style={{ color: "#d9363e", fontSize: "18px" }}>
                    {formatTime(timeLeft)}
                  </strong>
                </p>
              ) : (
                <p style={{ color: "#d9363e", margin: 0, fontWeight: "bold" }}>
                  Mã OTP đã hết hạn!
                </p>
              )}
            </div>

            <div className="form-group">
              <label style={{ textAlign: "center", marginBottom: "15px" }}>
                Nhập mã OTP
              </label>
              <div className="otp-input-group">
                {otp.map((data, index) => {
                  return (
                    <input
                      className="otp-field"
                      type="text"
                      name="otp"
                      maxLength="1"
                      key={index}
                      value={data}
                      onChange={(e) => handleChangeOtp(e.target, index)}
                      onKeyDown={(e) => handleKeyDownOtp(e, index)}
                      onFocus={(e) => e.target.select()}
                      onPaste={handlePasteOtp}
                      ref={(ref) => (otpRefs.current[index] = ref)}
                      disabled={loading || timeLeft === 0} // Khóa ô nhập khi hết giờ
                    />
                  );
                })}
              </div>
              {errors.otpCode && (
                <span className="error" style={{ textAlign: "center" }}>
                  {errors.otpCode}
                </span>
              )}
            </div>

            {errors.submit && (
              <div className="error-message">{errors.submit}</div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || timeLeft === 0} // Khóa nút xác nhận khi hết giờ
              style={{ marginTop: "10px" }}
            >
              {loading ? "Đang xác thực..." : "Xác nhận và Tạo tài khoản"}
            </button>

            {/* Nút gửi lại mã & Quay lại */}
            <div
              style={{
                textAlign: "center",
                marginTop: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div>
                <span style={{ color: "#666", fontSize: "14px" }}>
                  Chưa nhận được mã?{" "}
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || timeLeft > 0} // Chỉ cho phép bấm khi đồng hồ về 0
                  style={{
                    background: "none",
                    border: "none",
                    color: timeLeft > 0 ? "#aaa" : "#1a1a1a",
                    textDecoration: timeLeft > 0 ? "none" : "underline",
                    cursor: timeLeft > 0 ? "default" : "pointer",
                    fontWeight: "600",
                    padding: 0,
                  }}
                >
                  Gửi lại mã
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#666",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                disabled={loading}
              >
                Quay lại sửa thông tin
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
