import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

function TopUpResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const success = params.get('success') === 'true';
  const message =
    params.get('message') || (success ? 'Nạp tiền thành công vào ví của bạn.' : 'Giao dịch không thành công.');

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f7fb'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#fff',
          borderRadius: 12,
          padding: 32,
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}
      >
        {/* Logo */}
        

        {/* Icon trạng thái */}
        <div style={{ fontSize: 64, marginBottom: 16 }}>
          {success ? (
            <CheckCircleFilled style={{ color: '#52c41a' }} />
          ) : (
            <CloseCircleFilled style={{ color: '#ff4d4f' }} />
          )}
        </div>

        {/* Tiêu đề */}
        <h2
          style={{
            marginBottom: 10,
            fontWeight: 600,
            color: success ? '#389e0d' : '#cf1322'
          }}
        >
          {success ? 'Thanh toán thành công' : 'Thanh toán chưa thành công'}
        </h2>

        {/* Nội dung */}
        <p
          style={{
            color: '#666',
            fontSize: 15,
            marginBottom: 28
          }}
        >
          {message}
        </p>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => navigate('/wallet')}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#1677ff',
              color: '#fff',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Về ví của tôi
          </button>

          {!success && (
            <button
              onClick={() => navigate('/wallet/topup')}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid #d9d9d9',
                background: '#fff',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Thử nạp lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TopUpResult;