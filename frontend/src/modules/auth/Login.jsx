import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth as firebaseAuth } from "../../config/firebase";
import "./Auth.css";

function Login() {
  const [step, setStep] = useState(1); // 1: Login Form, 2: 2FA OTP
  const [formData, setFormData] = useState({ email: "", password: "" });

  // State cho OTP
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const otpRefs = useRef([]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 phút

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { login, verifyLogin2FA, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Đếm ngược thời gian
  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timerId);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email không được để trống";
    if (!formData.password) newErrors.password = "Mật khẩu không được để trống";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Logic 6 ô OTP
  const handleChangeOtp = (element, index) => {
    if (isNaN(element.value)) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.nextSibling && element.value !== "")
      element.nextSibling.focus();
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
    for (let i = 0; i < pastedData.length; i++) newOtp[i] = pastedData[i];
    setOtp(newOtp);
    otpRefs.current[Math.min(pastedData.length, 5)].focus();
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

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);

      // Nếu Backend báo yêu cầu 2FA
      if (result && result.requires2FA) {
        setSuccessMessage("Mã xác thực 2FA đã được gửi đến email của bạn.");
        setTimeLeft(300);
        setStep(2);
        setLoading(false);
        return;
      }

      navigateRoute(result.user);
    } catch (error) {
      setErrors({
        submit: error.message || "Đăng nhập thất bại. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setErrors({});
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setErrors({ otpCode: "Vui lòng nhập đủ 6 số xác thực" });
      return;
    }

    setLoading(true);
    try {
      const result = await verifyLogin2FA(formData.email, otpString);
      navigateRoute(result);
    } catch (error) {
      setErrors({ submit: error.message || "Xác thực 2FA thất bại" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setErrors({});
    setLoading(true);
    try {
      await login(formData.email, formData.password); // Gọi lại API login để sinh OTP mới
      setSuccessMessage("Mã OTP mới đã được gửi đến email của bạn.");
      setTimeLeft(300);
      setOtp(new Array(6).fill(""));
      otpRefs.current[0]?.focus();
    } catch (error) {
      setErrors({ submit: error.message || "Không thể gửi lại mã OTP" });
    } finally {
      setLoading(false);
    }
  };

  const navigateRoute = (currentUser) => {
    let user = currentUser;
    if (!user) {
      try {
        user = JSON.parse(localStorage.getItem("user"));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }

    if (user) {
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "moderator") navigate("/moderator/dashboard");
      else navigate("/");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{step === 1 ? "Đăng nhập" : "Bảo mật 2 Lớp (2FA)"}</h2>

        {step === 1 && (
          <form onSubmit={handleSubmitLogin}>
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
                className={errors.email ? "input-error" : ""}
              />
              {errors.email && (
                <span className="error-text">{errors.email}</span>
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
                  className={errors.password ? "input-error" : ""}
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
                <span className="error-text">{errors.password}</span>
              )}
            </div>

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
        )}

        {/* BƯỚC 2: Form 2FA OTP */}
        {step === 2 && (
          <form onSubmit={handleVerify2FA}>
            <p className="auth-description" style={{ marginBottom: "15px" }}>
              Vui lòng kiểm tra email <strong>{formData.email}</strong> để lấy
              mã xác thực 2 lớp.
            </p>

            {successMessage && (
              <div className="success-banner" style={{ marginBottom: "20px" }}>
                <i className="fas fa-check-circle"></i> {successMessage}
              </div>
            )}

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
                {otp.map((data, index) => (
                  <input
                    className="otp-field"
                    type="text"
                    maxLength="1"
                    key={index}
                    value={data}
                    onChange={(e) => handleChangeOtp(e.target, index)}
                    onKeyDown={(e) => handleKeyDownOtp(e, index)}
                    onFocus={(e) => e.target.select()}
                    onPaste={handlePasteOtp}
                    ref={(ref) => (otpRefs.current[index] = ref)}
                    disabled={loading || timeLeft === 0}
                  />
                ))}
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
              disabled={loading || timeLeft === 0}
              style={{ marginTop: "10px" }}
            >
              {loading ? "Đang xác thực..." : "Xác thực"}
            </button>

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
                  disabled={loading || timeLeft > 0}
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
                Hủy và Đăng nhập lại
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <div className="auth-footer">
            <p>
              Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
