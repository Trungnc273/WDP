import React, { useState } from 'react';

const SuspendModal = ({ onSubmit, onCancel }) => {
  const [suspendData, setSuspendData] = useState({
    suspendedUntil: '',
    reason: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!suspendData.reason.trim()) {
      newErrors.reason = 'Lý do khóa là bắt buộc';
    }

    if (suspendData.suspendedUntil) {
      const suspendDate = new Date(suspendData.suspendedUntil);
      const now = new Date();
      if (suspendDate <= now) {
        newErrors.suspendedUntil = 'Thời gian khóa phải sau thời điểm hiện tại';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      reason: suspendData.reason,
      ...(suspendData.suspendedUntil && { 
        suspendedUntil: suspendData.suspendedUntil 
      })
    };

    onSubmit(submitData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSuspendData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content suspend-modal">
        <div className="modal-header">
          <h2>Khóa người dùng</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="suspend-form">
          <div className="form-group">
            <label htmlFor="reason">Lý do khóa *</label>
            <textarea
              id="reason"
              name="reason"
              value={suspendData.reason}
              onChange={handleChange}
              placeholder="Nhập lý do khóa tài khoản..."
              rows="4"
              className={errors.reason ? 'error' : ''}
            />
            {errors.reason && <span className="error-message">{errors.reason}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="suspendedUntil">
              Khóa đến ngày (để trống nếu khóa vĩnh viễn)
            </label>
            <input
              type="datetime-local"
              id="suspendedUntil"
              name="suspendedUntil"
              value={suspendData.suspendedUntil}
              onChange={handleChange}
              className={errors.suspendedUntil ? 'error' : ''}
            />
            {errors.suspendedUntil && <span className="error-message">{errors.suspendedUntil}</span>}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-warning"
            >
              Khóa tài khoản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuspendModal;