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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    try {
      // Gọi API yêu cầu cấp mật khẩu tạm thời
      await forgotPassword(email);
      // Hiển thị câu thông báo thành công
      setSuccess('Mật khẩu tạm thời đã được gửi vào email của bạn. Vui lòng kiểm tra hộp thư.');
    } catch (err) {
      setError(err.message || 'Yêu cầu cấp lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Quên mật khẩu</h2>
        <p className="auth-description">
          Nhập email của bạn để nhận mật khẩu tạm thời.
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