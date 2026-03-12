import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function TopUpResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const success = params.get('success') === 'true';
  const message = params.get('message') || (success ? 'Nạp tiền thành công' : 'Nạp tiền thất bại');

  return (
    <div className="wallet-container" style={{ maxWidth: 720, margin: '40px auto' }}>
      <div className="wallet-card" style={{ padding: 24, textAlign: 'center' }}>
        <h1 style={{ marginBottom: 12 }}>
          {success ? 'Thanh toán thành công' : 'Thanh toán chưa thành công'}
        </h1>
        <p style={{ marginBottom: 24 }}>{message}</p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/wallet')}>
            Về ví của tôi
          </button>
          {!success && (
            <button className="btn btn-secondary" onClick={() => navigate('/wallet/topup')}>
              Thử nạp lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TopUpResult;
