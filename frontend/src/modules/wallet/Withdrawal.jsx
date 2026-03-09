import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import walletService from '../../services/wallet.service';
import './Withdrawal.css';

const Withdrawal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingBalance, setFetchingBalance] = useState(true);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    amount: '',
    bankAccount: {
      bankName: '',
      accountNumber: '',
      accountName: ''
    }
  });

  // Popular banks in Vietnam
  const popularBanks = [
    'Vietcombank', 'VietinBank', 'BIDV', 'Agribank', 'Techcombank',
    'MBBank', 'ACB', 'VPBank', 'SHB', 'Sacombank', 'TPBank', 'HDBank'
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBalance();
  }, [user, navigate]);

  const fetchBalance = async () => {
    try {
      setFetchingBalance(true);
      const balanceData = await walletService.getBalance();
      setBalance(balanceData);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setFetchingBalance(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('bankAccount.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bankAccount: {
          ...prev.bankAccount,
          [field]: value
        }
      }));
    } else if (name === 'amount') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, amount: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const amount = parseInt(formData.amount);

    // Amount validation
    if (!formData.amount || amount <= 0) {
      newErrors.amount = 'Vui lòng nhập số tiền hợp lệ';
    } else if (amount < 50000) {
      newErrors.amount = 'Số tiền rút tối thiểu là 50,000 VNĐ';
    } else if (balance && amount > balance.balance) {
      newErrors.amount = 'Số tiền rút không được vượt quá số dư khả dụng';
    }

    // Bank account validation
    if (!formData.bankAccount.bankName) {
      newErrors['bankAccount.bankName'] = 'Vui lòng chọn ngân hàng';
    }

    if (!formData.bankAccount.accountNumber) {
      newErrors['bankAccount.accountNumber'] = 'Vui lòng nhập số tài khoản';
    } else if (formData.bankAccount.accountNumber.length < 6) {
      newErrors['bankAccount.accountNumber'] = 'Số tài khoản phải có ít nhất 6 ký tự';
    }

    if (!formData.bankAccount.accountName) {
      newErrors['bankAccount.accountName'] = 'Vui lòng nhập tên chủ tài khoản';
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
      const withdrawalData = {
        amount: parseInt(formData.amount),
        bankAccount: formData.bankAccount
      };

      await walletService.createWithdrawal(withdrawalData);
      
      alert('Yêu cầu rút tiền đã được gửi thành công! Chúng tôi sẽ xử lý trong vòng 1-3 ngày làm việc.');
      navigate('/wallet');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể tạo yêu cầu rút tiền. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const calculateFee = (amount) => {
    // For now, withdrawal is free
    return 0;
  };

  const calculateTotal = (amount) => {
    return amount - calculateFee(amount);
  };

  if (fetchingBalance) {
    return (
      <div className="withdrawal-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="withdrawal-container">
      <div className="withdrawal-header">
        <button onClick={() => navigate('/wallet')} className="back-btn">
          ← Quay lại
        </button>
        <h1>Rút tiền từ ví</h1>
        <p>Tạo yêu cầu rút tiền về tài khoản ngân hàng</p>
      </div>

      <div className="withdrawal-content">
        <form onSubmit={handleSubmit} className="withdrawal-form">
          {/* Balance Info */}
          <div className="balance-info">
            <h3>Số dư khả dụng</h3>
            <div className="balance-amount">
              {formatPrice(balance?.balance || 0)} VNĐ
            </div>
          </div>

          {/* Amount Section */}
          <div className="form-section">
            <h2>Số tiền rút</h2>
            <div className="form-group">
              <label htmlFor="amount">Số tiền (VNĐ) <span className="required">*</span></label>
              <div className="amount-input-wrapper">
                <input
                  type="text"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="VD: 100000"
                  className={errors.amount ? 'error' : ''}
                />
                <span className="currency">VNĐ</span>
              </div>
              {errors.amount && <p className="error-text">{errors.amount}</p>}
              <p className="help-text">
                Số tiền rút tối thiểu: 50,000 VNĐ
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="quick-amounts">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, amount: '100000' }))}
                className="quick-btn"
              >
                100,000 VNĐ
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, amount: '500000' }))}
                className="quick-btn"
              >
                500,000 VNĐ
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, amount: balance?.balance?.toString() || '0' }))}
                className="quick-btn"
                disabled={!balance?.balance}
              >
                Tất cả
              </button>
            </div>
          </div>

          {/* Bank Account Section */}
          <div className="form-section">
            <h2>Thông tin tài khoản ngân hàng</h2>
            
            <div className="form-group">
              <label htmlFor="bankName">Ngân hàng <span className="required">*</span></label>
              <select
                id="bankName"
                name="bankAccount.bankName"
                value={formData.bankAccount.bankName}
                onChange={handleChange}
                className={errors['bankAccount.bankName'] ? 'error' : ''}
              >
                <option value="">Chọn ngân hàng</option>
                {popularBanks.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
              {errors['bankAccount.bankName'] && (
                <p className="error-text">{errors['bankAccount.bankName']}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="accountNumber">Số tài khoản <span className="required">*</span></label>
              <input
                type="text"
                id="accountNumber"
                name="bankAccount.accountNumber"
                value={formData.bankAccount.accountNumber}
                onChange={handleChange}
                placeholder="VD: 1234567890"
                className={errors['bankAccount.accountNumber'] ? 'error' : ''}
              />
              {errors['bankAccount.accountNumber'] && (
                <p className="error-text">{errors['bankAccount.accountNumber']}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="accountName">Tên chủ tài khoản <span className="required">*</span></label>
              <input
                type="text"
                id="accountName"
                name="bankAccount.accountName"
                value={formData.bankAccount.accountName}
                onChange={handleChange}
                placeholder="VD: NGUYEN VAN A"
                className={errors['bankAccount.accountName'] ? 'error' : ''}
              />
              {errors['bankAccount.accountName'] && (
                <p className="error-text">{errors['bankAccount.accountName']}</p>
              )}
              <p className="help-text">
                Tên phải khớp với tên trên tài khoản ngân hàng
              </p>
            </div>
          </div>

          {/* Withdrawal Summary */}
          {formData.amount && parseInt(formData.amount) >= 50000 && (
            <div className="withdrawal-summary">
              <h3>Thông tin rút tiền</h3>
              <div className="summary-row">
                <span>Số tiền rút:</span>
                <span className="amount-display">{formatPrice(parseInt(formData.amount))} VNĐ</span>
              </div>
              <div className="summary-row">
                <span>Phí giao dịch:</span>
                <span>Miễn phí</span>
              </div>
              <div className="summary-row total">
                <span>Số tiền nhận được:</span>
                <span className="total-amount">{formatPrice(calculateTotal(parseInt(formData.amount)))} VNĐ</span>
              </div>
            </div>
          )}

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
              disabled={loading || !formData.amount || parseInt(formData.amount) < 50000}
            >
              {loading ? 'Đang xử lý...' : 'Tạo yêu cầu rút tiền'}
            </button>
          </div>
        </form>

        {/* Important Notice */}
        <div className="withdrawal-notice">
          <h3>⚠️ Lưu ý quan trọng</h3>
          <ul>
            <li>Thời gian xử lý: 1-3 ngày làm việc</li>
            <li>Kiểm tra kỹ thông tin tài khoản trước khi gửi</li>
            <li>Không thể hủy yêu cầu sau khi đã gửi</li>
            <li>Liên hệ hỗ trợ nếu có vấn đề</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Withdrawal;