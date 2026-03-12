import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getKYCStatus, submitKYC } from '../../services/user.service';
import './KYC.css';

const KYC = () => {
  const navigate = useNavigate();
  
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [documents, setDocuments] = useState({
    idCardFront: null,
    idCardBack: null,
    selfie: null
  });
  
  const [previews, setPreviews] = useState({
    idCardFront: '',
    idCardBack: '',
    selfie: ''
  });

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      setLoading(true);
      const response = await getKYCStatus();
      setKycStatus(response.data);
      setError('');
    } catch (error) {
      setError('Không thể tải trạng thái KYC');
      console.error('Error fetching KYC status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (documentType) => (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Kích thước ảnh không được vượt quá 10MB');
        return;
      }
      
      setDocuments(prev => ({
        ...prev,
        [documentType]: file
      }));
      
      // Tao anh xem truoc
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => ({
          ...prev,
          [documentType]: e.target.result
        }));
      };
      reader.readAsDataURL(file);
      
      setError('');
    }
  };

  const removeDocument = (documentType) => {
    setDocuments(prev => ({
      ...prev,
      [documentType]: null
    }));
    setPreviews(prev => ({
      ...prev,
      [documentType]: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kiem tra da tai len day du giay to chua
    if (!documents.idCardFront || !documents.idCardBack || !documents.selfie) {
      setError('Vui lòng cung cấp đầy đủ 3 ảnh: CMND/CCCD mặt trước, mặt sau và ảnh selfie');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Trong he thong that, ban can upload file len dich vu luu tru truoc
      // Tam thoi dung URL preview lam du lieu thay the
      const kycData = {
        idCardFront: previews.idCardFront,
        idCardBack: previews.idCardBack,
        selfie: previews.selfie
      };

      await submitKYC(kycData);
      
      setSuccess('Gửi yêu cầu xác thực thành công! Chúng tôi sẽ xem xét trong 1-3 ngày làm việc.');
      
      // Tai lai trang thai KYC
      await fetchKYCStatus();
      
      // Chuyen huong sau 3 giay
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu xác thực');
    } finally {
      setSubmitting(false);
    }
  };

  const getKYCStatusText = (status) => {
    const statusMap = {
      'not_submitted': 'Chưa gửi',
      'pending': 'Đang xử lý',
      'approved': 'Đã duyệt',
      'rejected': 'Bị từ chối'
    };
    return statusMap[status] || status;
  };

  const getKYCStatusClass = (status) => {
    const classMap = {
      'not_submitted': 'kyc-not-submitted',
      'pending': 'kyc-pending',
      'approved': 'kyc-approved',
      'rejected': 'kyc-rejected'
    };
    return classMap[status] || '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="kyc-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="kyc-container">
      <div className="page-header">
        <button onClick={() => navigate('/profile')} className="back-button">
          <i className="fas fa-arrow-left"></i>
          Quay lại
        </button>
        <h1>Xác thực danh tính (KYC)</h1>
      </div>

      <div className="kyc-content">
        {/* Current Status */}
        <div className="kyc-status-card">
          <h2>Trạng thái hiện tại</h2>
          <div className="status-info">
            <span className={`kyc-status ${getKYCStatusClass(kycStatus?.status)}`}>
              {getKYCStatusText(kycStatus?.status)}
            </span>
            
            {kycStatus?.submittedAt && (
              <div className="status-detail">
                <strong>Ngày gửi:</strong> {formatDate(kycStatus.submittedAt)}
              </div>
            )}
            
            {kycStatus?.approvedAt && (
              <div className="status-detail">
                <strong>Ngày duyệt:</strong> {formatDate(kycStatus.approvedAt)}
              </div>
            )}
            
            {kycStatus?.rejectedAt && (
              <div className="status-detail">
                <strong>Ngày từ chối:</strong> {formatDate(kycStatus.rejectedAt)}
              </div>
            )}
            
            {kycStatus?.rejectionReason && (
              <div className="rejection-reason">
                <strong>Lý do từ chối:</strong> {kycStatus.rejectionReason}
              </div>
            )}
          </div>
        </div>

        {/* Show form if not approved or pending */}
        {kycStatus?.status !== 'approved' && kycStatus?.status !== 'pending' && (
          <>
            {/* Instructions */}
            <div className="kyc-instructions">
              <h2>Hướng dẫn xác thực</h2>
              <div className="instructions-content">
                <div className="instruction-item">
                  <div className="instruction-icon">
                    <i className="fas fa-id-card"></i>
                  </div>
                  <div className="instruction-text">
                    <h3>CMND/CCCD mặt trước</h3>
                    <p>Chụp rõ nét, đầy đủ 4 góc, không bị mờ hay chói sáng</p>
                  </div>
                </div>
                
                <div className="instruction-item">
                  <div className="instruction-icon">
                    <i className="fas fa-id-card"></i>
                  </div>
                  <div className="instruction-text">
                    <h3>CMND/CCCD mặt sau</h3>
                    <p>Chụp rõ nét, đầy đủ 4 góc, thông tin có thể đọc được</p>
                  </div>
                </div>
                
                <div className="instruction-item">
                  <div className="instruction-icon">
                    <i className="fas fa-user"></i>
                  </div>
                  <div className="instruction-text">
                    <h3>Ảnh selfie cầm CMND/CCCD</h3>
                    <p>Chụp rõ mặt và CMND/CCCD, đảm bảo thông tin có thể đọc được</p>
                  </div>
                </div>
              </div>
              
              <div className="kyc-warning">
                <div className="warning-icon">⚠️</div>
                <div className="warning-text">
                  <strong>Lưu ý quan trọng:</strong>
                  <ul>
                    <li>Tất cả ảnh phải rõ nét, không bị mờ hoặc chói sáng</li>
                    <li>Thông tin trên CMND/CCCD phải khớp với thông tin tài khoản</li>
                    <li>Không sử dụng ảnh đã qua chỉnh sửa</li>
                    <li>Thời gian xử lý: 1-3 ngày làm việc</li>
                    <li>Thông tin sẽ được bảo mật tuyệt đối</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleSubmit} className="kyc-form">
              <h2>Tải lên tài liệu</h2>
              
              {/* ID Card Front */}
              <div className="document-upload">
                <label>CMND/CCCD mặt trước *</label>
                <div className="upload-area">
                  {previews.idCardFront ? (
                    <div className="document-preview">
                      <img src={previews.idCardFront} alt="CMND/CCCD mặt trước" />
                      <button 
                        type="button" 
                        className="remove-btn"
                        onClick={() => removeDocument('idCardFront')}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <label className="upload-placeholder">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange('idCardFront')}
                        hidden
                      />
                      <i className="fas fa-cloud-upload-alt"></i>
                      <span>Chọn ảnh CMND/CCCD mặt trước</span>
                    </label>
                  )}
                </div>
              </div>

              {/* ID Card Back */}
              <div className="document-upload">
                <label>CMND/CCCD mặt sau *</label>
                <div className="upload-area">
                  {previews.idCardBack ? (
                    <div className="document-preview">
                      <img src={previews.idCardBack} alt="CMND/CCCD mặt sau" />
                      <button 
                        type="button" 
                        className="remove-btn"
                        onClick={() => removeDocument('idCardBack')}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <label className="upload-placeholder">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange('idCardBack')}
                        hidden
                      />
                      <i className="fas fa-cloud-upload-alt"></i>
                      <span>Chọn ảnh CMND/CCCD mặt sau</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Selfie */}
              <div className="document-upload">
                <label>Ảnh selfie cầm CMND/CCCD *</label>
                <div className="upload-area">
                  {previews.selfie ? (
                    <div className="document-preview">
                      <img src={previews.selfie} alt="Ảnh selfie" />
                      <button 
                        type="button" 
                        className="remove-btn"
                        onClick={() => removeDocument('selfie')}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <label className="upload-placeholder">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange('selfie')}
                        hidden
                      />
                      <i className="fas fa-cloud-upload-alt"></i>
                      <span>Chọn ảnh selfie cầm CMND/CCCD</span>
                    </label>
                  )}
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => navigate('/profile')}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting || !documents.idCardFront || !documents.idCardBack || !documents.selfie}
                >
                  {submitting ? 'Đang gửi...' : 'Gửi yêu cầu xác thực'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Pending Message */}
        {kycStatus?.status === 'pending' && (
          <div className="kyc-pending-card">
            <div className="pending-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="pending-content">
              <h3>Yêu cầu đang được xử lý</h3>
              <p>Chúng tôi đã nhận được yêu cầu xác thực của bạn và đang tiến hành xem xét. Vui lòng chờ 1-3 ngày làm việc để nhận kết quả.</p>
              <div className="submitted-date">
                Ngày gửi: {formatDate(kycStatus.submittedAt)}
              </div>
            </div>
          </div>
        )}

        {/* Approved Message */}
        {kycStatus?.status === 'approved' && (
          <div className="kyc-approved-card">
            <div className="approved-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="approved-content">
              <h3>Xác thực thành công!</h3>
              <p>Tài khoản của bạn đã được xác thực thành công. Bạn có thể sử dụng đầy đủ các tính năng của hệ thống.</p>
              <div className="approved-date">
                Ngày duyệt: {formatDate(kycStatus.approvedAt)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KYC;