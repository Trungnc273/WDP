import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, uploadAvatar } from '../../services/user.service';
import './EditProfile.css';

const EditProfile = () => {
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    address: '',
    avatar: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getProfile();
      const userData = response.data;
      
      setProfile({
        fullName: userData.fullName || '',
        phone: userData.phone || '',
        address: userData.address || '',
        avatar: userData.avatar || ''
      });
      setAvatarPreview(userData.avatar || '');
      setError('');
    } catch (error) {
      setError('Không thể tải thông tin profile');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh');
        return;
      }
      
      // Kiem tra kich thuoc file (toi da 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      
      setAvatarFile(file);
      
      // Tao anh xem truoc
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kiem tra cac truong bat buoc
    if (!profile.fullName.trim()) {
      setError('Vui lòng nhập họ tên');
      return;
    }
    
    if (profile.phone && !/^[0-9]{10,11}$/.test(profile.phone)) {
      setError('Số điện thoại không hợp lệ (10-11 số)');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Upload avatar truoc neu co file moi
      let avatarUrl = profile.avatar;
      if (avatarFile) {
        // Trong he thong that, ban se upload len dich vu luu tru file
        // Tam thoi dung URL preview lam du lieu thay the
        avatarUrl = avatarPreview;
        await uploadAvatar(avatarUrl);
      }

      // Cap nhat thong tin ca nhan
      await updateProfile({
        fullName: profile.fullName.trim(),
        phone: profile.phone.trim(),
        address: profile.address.trim()
      });

      setSuccess('Cập nhật thông tin thành công!');
      
      // Chuyen huong sau 2 giay
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-profile-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="edit-profile-container">
      <div className="page-header">
        <button onClick={() => navigate('/profile')} className="back-button">
          <i className="fas fa-arrow-left"></i>
          Quay lại
        </button>
        <h1>Chỉnh sửa thông tin</h1>
      </div>

      <div className="edit-profile-content">
        <form onSubmit={handleSubmit} className="edit-profile-form">
          {/* Avatar Section */}
          <div className="form-section">
            <h2>Ảnh đại diện</h2>
            <div className="avatar-upload-section">
              <div className="avatar-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="avatar-image" />
                ) : (
                  <div className="avatar-placeholder">
                    {profile.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="avatar-upload-controls">
                <input
                  type="file"
                  id="avatar"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="avatar-input"
                />
                <label htmlFor="avatar" className="btn btn-outline">
                  <i className="fas fa-camera"></i>
                  Chọn ảnh
                </label>
                <div className="upload-note">
                  Định dạng: JPG, PNG. Tối đa 5MB.
                </div>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="form-section">
            <h2>Thông tin cơ bản</h2>
            
            <div className="form-group">
              <label htmlFor="fullName">Họ và tên *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={profile.fullName}
                onChange={handleInputChange}
                required
                maxLength="100"
                placeholder="Nhập họ và tên đầy đủ"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Số điện thoại</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profile.phone}
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại (10-11 số)"
                pattern="[0-9]{10,11}"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Địa chỉ</label>
              <textarea
                id="address"
                name="address"
                value={profile.address}
                onChange={handleInputChange}
                rows="3"
                maxLength="200"
                placeholder="Nhập địa chỉ của bạn"
              />
              <div className="char-count">{profile.address.length}/200</div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={() => navigate('/profile')}
              disabled={saving}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;