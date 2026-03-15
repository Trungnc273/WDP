import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { validateStrongPassword } from '../../utils/passwordValidator';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import './Auth.css';

function ResetPassword() {
  const { resetPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [token, setToken] = useState(
    new URLSearchParams(location.search).get('token') || ''
  );
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Thiếu token đặt lại mật khẩu');
      return;
    }

    const passwordValidation = validateStrongPassword(newPassword);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess('Đặt lại mật khẩu thành công! Bạn sẽ được chuyển đến trang đăng nhập.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Đặt lại mật khẩu</h2>
        <p className="auth-description">
          Nhập token và mật khẩu mới của bạn.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="token">Token đặt lại mật khẩu</label>
            <input
              type="text"
              id="token"
              name="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Dán token đã nhận được"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">Mật khẩu mới</label>
            <div className="password-input-container">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={loading}
              >
                {showNewPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
          </div>

          <div className="password-requirements">
            <h4>Yêu cầu mật khẩu:</h4>
            <ul>
              <li className={newPassword.length >= 8 ? 'requirement-met' : ''}>
                <i className={`fas ${newPassword.length >= 8 ? 'fa-check' : 'fa-times'}`}></i>
                Ít nhất 8 ký tự
              </li>
              <li className={/[a-z]/.test(newPassword) ? 'requirement-met' : ''}>
                <i className={`fas ${/[a-z]/.test(newPassword) ? 'fa-check' : 'fa-times'}`}></i>
                Chứa chữ thường (a-z)
              </li>
              <li className={/[A-Z]/.test(newPassword) ? 'requirement-met' : ''}>
                <i className={`fas ${/[A-Z]/.test(newPassword) ? 'fa-check' : 'fa-times'}`}></i>
                Chứa chữ hoa (A-Z)
              </li>
              <li className={/[0-9]/.test(newPassword) ? 'requirement-met' : ''}>
                <i className={`fas ${/[0-9]/.test(newPassword) ? 'fa-check' : 'fa-times'}`}></i>
                Chứa số (0-9)
              </li>
              <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'requirement-met' : ''}>
                <i className={`fas ${/[^A-Za-z0-9]/.test(newPassword) ? 'fa-check' : 'fa-times'}`}></i>
                Chứa ký tự đặc biệt (!@#$%^&*)
              </li>
            </ul>
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
            {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Quay lại <Link to="/login">Trang đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;