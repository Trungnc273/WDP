import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Auth.css';

function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResetToken('');

    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    try {
      //gọi API yêu cầu reset pass
      const data = await forgotPassword(email);
      setSuccess('Nếu email tồn tại, chúng tôi đã tạo token đặt lại mật khẩu.');
      //backend trả về resetToken, lưu vào state để hiển thị box hỗ trợ tester
      if (data?.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch (err) {
      setError(err.message || 'Yêu cầu đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Quên mật khẩu</h2>
        <p className="auth-description">
          Nhập email của bạn để nhận token đặt lại mật khẩu.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-banner">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          {success && (
            <div className="success-banner">
              <i className="fas fa-check-circle"></i> {success}
            </div>
          )}
        {/* bên dưới phần Render */}
          {resetToken && (
            <div className="token-box">
              <p><strong>Reset token (dùng để test):</strong></p>
              <code>{resetToken}</code>
              <p className="token-hint">
                Bạn có thể nhấn nút dưới đây để chuyển sang trang Đặt lại mật khẩu với token này.
              </p>
              <div className="token-action">
                <Link
                  to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                  className="btn-token-link"
                >
                  Đi đến trang Đặt lại mật khẩu
                </Link>
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Đã nhớ mật khẩu? <Link to="/login">Quay lại đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;

