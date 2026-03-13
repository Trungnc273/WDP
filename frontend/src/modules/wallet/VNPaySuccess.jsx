import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleFilled } from '@ant-design/icons';

const formatMoney = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return null;
  return `${number.toLocaleString('vi-VN')} VND`;
};

function VNPaySuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const message = params.get('message') || 'Nạp tiền thành công vào ví của bạn.';
  const amount = params.get('amount');
  const transactionId = params.get('transactionId');

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
          maxWidth: 560,
          background: '#fff',
          borderRadius: 14,
          padding: 36,
          boxShadow: '0 12px 35px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}
      >
        {/* Logo VNPay */}
        {/* <img
          src="/images/vnpay-logo.png"
          alt="VNPay"
          style={{ height: 36, marginBottom: 20 }}
        /> */}

        {/* Icon success */}
        <CheckCircleFilled
          style={{
            fontSize: 70,
            color: '#52c41a',
            marginBottom: 16
          }}
        />

        {/* Title */}
        <h2
          style={{
            marginBottom: 10,
            fontWeight: 600,
            color: '#389e0d'
          }}
        >
          Thanh toán thành công
        </h2>

        {/* Message */}
        <p
          style={{
            color: '#666',
            fontSize: 15,
            marginBottom: 26
          }}
        >
          {message}
        </p>

        {/* Transaction Info */}
        <div
          style={{
            background: '#f6faff',
            border: '1px solid #e6f4ff',
            borderRadius: 10,
            padding: 18,
            marginBottom: 28,
            textAlign: 'center'
          }}
        >
          {formatMoney(amount) && (
            <p style={{ margin: '0 0 10px 0', fontSize: 15 }}>
              <strong>Số tiền nạp:</strong>{' '}
              <span style={{ color: '#1677ff', fontWeight: 600 }}>
                {formatMoney(amount)}
              </span>
            </p>
          )}

          {transactionId && (
            <p style={{ margin: 0, fontSize: 14 }}>
              <strong>Mã giao dịch:</strong>{' '}
              <span style={{ fontFamily: 'monospace', color: '#333' }}>
                {transactionId}
              </span>
            </p>
          )}
        </div>

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
              padding: '10px 22px',
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

          <button
            onClick={() => navigate('/wallet/topup')}
            style={{
              padding: '10px 22px',
              borderRadius: 8,
              border: '1px solid #d9d9d9',
              background: '#fff',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Nạp thêm
          </button>
        </div>
      </div>
    </div>
  );
}

export default VNPaySuccess;