import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../../services/user.service';
import './ChangePassword.css';

const ChangePassword = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại');
      return false;
    }
    
    if (!formData.newPassword) {
      setError('Vui lòng nhập mật khẩu mới');
      return false;
    }
    
    if (formData.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return false;
    }
    
    if (formData.newPassword === formData.currentPassword) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại');
      return false;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Xác nhận mật khẩu không khớp');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await changePassword(formData.currentPassword, formData.newPassword);
      
      setSuccess('Đổi mật khẩu thành công!');
      
      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '' };
    
    let strength = 0;
    let text = '';
    let color = '';
    
    // Length check
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    
    // Character variety checks
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    if (strength <= 2) {
      text = 'Yếu';
      color = '#f44336';
    } else if (strength <= 4) {
      text = 'Trung bình';
      color = '#ff9800';
    } else {
      text = 'Mạnh';
      color = '#4caf50';
    }
    
    return { strength, text, color };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="change-password-container">
      <div className="page-header">
        <button onClick={() => navigate('/profile')} className="back-button">
          <i className="fas fa-arrow-left"></i>
          Quay lại
        </button>
        <h1>Đổi mật khẩu</h1>
      </div>

      <div className="change-password-content">
        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="form-section">
            <h2>Thay đổi mật khẩu</h2>
            <p className="section-description">
              Để bảo mật tài khoản, vui lòng sử dụng mật khẩu mạnh và không chia sẻ với người khác.
            </p>
            
            {/* Current Password */}
            <div className="form-group">
              <label htmlFor="currentPassword">Mật khẩu hiện tại *</label>
              <div className="password-input">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  <i className={`fas ${showPasswords.current ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-group">
              <label htmlFor="newPassword">Mật khẩu mới *</label>
              <div className="password-input">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  minLength="6"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  <i className={`fas ${showPasswords.new ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill" 
                      style={{ 
                        width: `${(passwordStrength.strength / 6) * 100}%`,
                        backgroundColor: passwordStrength.color
                      }}
                    ></div>
                  </div>
                  <span className="strength-text" style={{ color: passwordStrength.color }}>
                    Độ mạnh: {passwordStrength.text}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu mới *</label>
              <div className="password-input">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  <i className={`fas ${showPasswords.confirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="password-match">
                  {formData.newPassword === formData.confirmPassword ? (
                    <span className="match-success">
                      <i className="fas fa-check"></i>
                      Mật khẩu khớp
                    </span>
                  ) : (
                    <span className="match-error">
                      <i className="fas fa-times"></i>
                      Mật khẩu không khớp
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Password Requirements */}
            <div className="password-requirements">
              <h4>Yêu cầu mật khẩu:</h4>
              <ul>
                <li className={formData.newPassword.length >= 6 ? 'requirement-met' : ''}>
                  <i className={`fas ${formData.newPassword.length >= 6 ? 'fa-check' : 'fa-times'}`}></i>
                  Ít nhất 6 ký tự
                </li>
                <li className={/[a-z]/.test(formData.newPassword) ? 'requirement-met' : ''}>
                  <i className={`fas ${/[a-z]/.test(formData.newPassword) ? 'fa-check' : 'fa-times'}`}></i>
                  Chứa chữ thường (a-z)
                </li>
                <li className={/[A-Z]/.test(formData.newPassword) ? 'requirement-met' : ''}>
                  <i className={`fas ${/[A-Z]/.test(formData.newPassword) ? 'fa-check' : 'fa-times'}`}></i>
                  Chứa chữ hoa (A-Z)
                </li>
                <li className={/[0-9]/.test(formData.newPassword) ? 'requirement-met' : ''}>
                  <i className={`fas ${/[0-9]/.test(formData.newPassword) ? 'fa-check' : 'fa-times'}`}></i>
                  Chứa số (0-9)
                </li>
                <li className={/[^A-Za-z0-9]/.test(formData.newPassword) ? 'requirement-met' : ''}>
                  <i className={`fas ${/[^A-Za-z0-9]/.test(formData.newPassword) ? 'fa-check' : 'fa-times'}`}></i>
                  Chứa ký tự đặc biệt (!@#$%^&*)
                </li>
              </ul>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={() => navigate('/profile')}
              disabled={loading}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !validateForm()}
            >
              {loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;