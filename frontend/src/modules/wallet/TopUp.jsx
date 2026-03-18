import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import vnpayService from '../../services/vnpay.service';
import './TopUp.css';

const TopUp = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [amount, setAmount] = useState('');
  const [orderInfo, setOrderInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Predefined amounts
  const predefinedAmounts = [
    50000, 100000, 200000, 500000, 1000000, 2000000
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value);
    
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const handlePredefinedAmount = (value) => {
    setAmount(value.toString());
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const amountNum = Number(amount);

    if (!amount || !Number.isFinite(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Vui lòng nhập số tiền hợp lệ';
    } else if (!Number.isInteger(amountNum)) {
      newErrors.amount = 'Số tiền nạp phải là số nguyên VND';
    } else if (amountNum < 10000) {
      newErrors.amount = 'Số tiền nạp tối thiểu là 10,000 VNĐ';
    } else if (amountNum > 500000000) {
      newErrors.amount = 'Số tiền nạp tối đa là 500,000,000 VNĐ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const normalizedAmount = Number(amount);
      const paymentData = {
        amount: normalizedAmount,
        orderInfo: orderInfo?.trim() || `Nạp ${normalizedAmount.toLocaleString('vi-VN')} VNĐ vào ví`
      };

      const result = await vnpayService.createPayment(paymentData);
      
      // Chuyen huong sang trang thanh toan VNPay
      window.location.href = result.paymentUrl;
    } catch (error) {
      alert(error.message || 'Không thể tạo thanh toán. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <div className="topup-container">
      <div className="topup-header">
        <button
          onClick={() => navigate('/wallet')}
          className="back-btn"
        >
          ← Quay lại
        </button>
        <h1>Nạp tiền vào ví</h1>
        <p>Chọn số tiền bạn muốn nạp vào ví</p>
      </div>

      <div className="topup-content">
        <form onSubmit={handleSubmit} className="topup-form">
          {/* Predefined Amounts */}
          <div className="form-section">
            <h2>Chọn nhanh</h2>
            <div className="amount-grid">
              {predefinedAmounts.map(value => (
                <button
                  key={value}
                  type="button"
                  className={`amount-btn ${amount === value.toString() ? 'active' : ''}`}
                  onClick={() => handlePredefinedAmount(value)}
                >
                  {formatPrice(value)} VNĐ
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="form-section">
            <h2>Hoặc nhập số tiền khác</h2>
            <div className="form-group">
              <label htmlFor="amount">Số tiền (VNĐ) <span className="required">*</span></label>
              <div className="amount-input-wrapper">
                <input
                  type="text"
                  id="amount"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="VD: 100000"
                  className={errors.amount ? 'error' : ''}
                />
                <span className="currency">VNĐ</span>
              </div>
              {errors.amount && <p className="error-text">{errors.amount}</p>}
              <p className="help-text">
                Số tiền nạp từ 10,000 VNĐ đến 500,000,000 VNĐ
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="orderInfo">Ghi chú (tùy chọn)</label>
              <input
                type="text"
                id="orderInfo"
                value={orderInfo}
                onChange={(e) => setOrderInfo(e.target.value)}
                placeholder="VD: Nạp tiền mua sản phẩm"
                maxLength={100}
              />
            </div>
          </div>

          {/* Payment Summary */}
          {amount && parseInt(amount) >= 10000 && (
            <div className="payment-summary">
              <h3>Thông tin thanh toán</h3>
              <div className="summary-row">
                <span>Số tiền nạp:</span>
                <span className="amount-display">{formatPrice(parseInt(amount))} VNĐ</span>
              </div>
              <div className="summary-row">
                <span>Phí giao dịch:</span>
                <span>Miễn phí</span>
              </div>
              <div className="summary-row total">
                <span>Tổng thanh toán:</span>
                <span className="total-amount">{formatPrice(parseInt(amount))} VNĐ</span>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="form-section">
            <h2>Phương thức thanh toán</h2>
            <div className="payment-method">
              <div className="method-card active">
                <img
                  src="/images/vnpay-logo.png"
                  alt="VNPay"
                  className="method-logo"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/logo/logo.png';
                  }}
                />
                <div className="method-info">
                  <h4>VNPay</h4>
                  <p>Thanh toán qua ngân hàng, ví điện tử</p>
                </div>
                <div className="method-check">✓</div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/wallet')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !amount || parseInt(amount) < 10000}
            >
              {loading ? 'Đang xử lý...' : 'Thanh toán'}
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="security-notice">
          <h3>🔒 Bảo mật thanh toán</h3>
          <ul>
            <li>Giao dịch được mã hóa SSL 256-bit</li>
            <li>Không lưu trữ thông tin thẻ ngân hàng</li>
            <li>Tuân thủ tiêu chuẩn bảo mật PCI DSS</li>
            <li>Hỗ trợ 24/7 cho mọi vấn đề thanh toán</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TopUp;