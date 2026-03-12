import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const formatMoney = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return null;
  return `${number.toLocaleString('vi-VN')} VND`;
};

function VNPaySuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const message = params.get('message') || 'Nạp tiền thành công';
  const amount = params.get('amount');
  const transactionId = params.get('transactionId');

  return (
    <div className="wallet-container" style={{ maxWidth: 760, margin: '40px auto' }}>
      <div className="wallet-card" style={{ padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 46, marginBottom: 8 }}>✅</div>
        <h1 style={{ marginBottom: 8, color: '#1a7f37' }}>Thanh toán thành công</h1>
        <p style={{ marginBottom: 20 }}>{message}</p>

        <div style={{ background: '#f4f9ff', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'left' }}>
          {formatMoney(amount) && (
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Số tiền nạp:</strong> {formatMoney(amount)}
            </p>
          )}
          {transactionId && (
            <p style={{ margin: 0 }}>
              <strong>Mã giao dịch:</strong> {transactionId}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/wallet')}>
            Về ví của tôi
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/wallet/topup')}>
            Nạp thêm
          </button>
        </div>
      </div>
    </div>
  );
}

export default VNPaySuccess;
