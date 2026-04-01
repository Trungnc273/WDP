import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import sePayService from '../../services/sepay.service';

const SEPayOrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'failed'
  const [message, setMessage] = useState('Đang kiểm tra kết quả giao dịch...');
  const [details, setDetails] = useState(null);
  
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    
    const transactionId = searchParams.get('transactionId');
    
    if (!transactionId) {
      setStatus('failed');
      setMessage('Không tìm thấy mã giao dịch cục bộ');
      hasChecked.current = true;
      return;
    }

    const checkStatus = async () => {
      hasChecked.current = true;
      try {
        const result = await sePayService.checkOrderTransactionStatus(transactionId);
        
        if (result.success && result.status === 'completed') {
          setStatus('success');
          setMessage(result.message || 'Thanh toán đơn hàng thành công!');
          setDetails({
            amount: result.amount,
            orderId: result.orderId,
            transactionId: result.transactionId
          });
        } else if (result.status === 'pending') {
          setStatus('processing');
          setMessage('Hệ thống đang xử lý giao dịch. Vui lòng chờ trong giây lát (có thể mất 1-2 phút tuỳ ngân hàng).');
          
          // Poll every 5s until success or failed (demo loop, max 6 times)
          let attempts = 0;
          const pollInterval = setInterval(async () => {
            attempts++;
            const pollResult = await sePayService.checkOrderTransactionStatus(transactionId);
            if (pollResult.status === 'completed') {
              clearInterval(pollInterval);
              setStatus('success');
              setMessage(pollResult.message || 'Thanh toán đơn hàng thành công!');
              setDetails({
                amount: pollResult.amount,
                orderId: pollResult.orderId,
                transactionId: pollResult.transactionId
              });
            } else if (pollResult.status === 'failed' || attempts >= 6) {
              clearInterval(pollInterval);
              if (pollResult.status !== 'completed') {
                setStatus('failed');
                setMessage('Hệ thống chưa nhận được tiền hoặc giao dịch thất bại.');
              }
            }
          }, 5000);

        } else {
          setStatus('failed');
          setMessage(result.message || 'Giao dịch thanh toán thất bại');
        }
      } catch (error) {
        setStatus('failed');
        setMessage(error.response?.data?.message || 'Có lỗi xảy ra khi kiểm tra giao dịch');
      }
    };

    checkStatus();
  }, [searchParams]);

  const formatPrice = (price) => {
    if (!price) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="payment-result-container" style={{
      maxWidth: '600px', margin: '50px auto', padding: '30px',
      backgroundColor: '#fff', borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center'
    }}>
      {status === 'processing' && (
        <div className="result-processing">
          <div className="spinner" style={{
            width: '60px', height: '60px', border: '5px solid #f3f3f3',
            borderTop: '5px solid #3498db', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 20px'
          }}></div>
          <h2 style={{color: '#3498db', marginBottom: '15px'}}>Đang kiểm tra...</h2>
          <p style={{color: '#666', lineHeight: '1.6'}}>{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="result-success">
          <div className="icon" style={{
            width: '80px', height: '80px', backgroundColor: '#e8f5e9',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 20px', color: '#2e7d32', fontSize: '40px'
          }}>
            <i className="fas fa-check"></i>
          </div>
          <h2 style={{color: '#2e7d32', marginBottom: '15px'}}>Thanh toán thành công!</h2>
          <p style={{color: '#666', marginBottom: '25px'}}>{message}</p>
          
          {details && (
            <div className="details-box" style={{
              backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px',
              textAlign: 'left', marginBottom: '30px'
            }}>
              <p style={{margin: '10px 0', display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: '#666'}}>Số tiền:</span>
                <span style={{fontWeight: 'bold', color: '#2e7d32'}}>{formatPrice(details.amount)}</span>
              </p>
              <p style={{margin: '10px 0', display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: '#666'}}>Mã giao dịch:</span>
                <span style={{fontFamily: 'monospace'}}>{details.transactionId.substring(0, 8).toUpperCase()}</span>
              </p>
            </div>
          )}
          
          <button 
            onClick={() => navigate('/orders')} 
            className="btn btn-primary"
            style={{padding: '12px 30px', fontSize: '16px', borderRadius: '8px', minWidth: '200px'}}
          >
            Về danh sách đơn hàng
          </button>
        </div>
      )}

      {status === 'failed' && (
        <div className="result-failed">
          <div className="icon" style={{
            width: '80px', height: '80px', backgroundColor: '#ffebee',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 20px', color: '#c62828', fontSize: '40px'
          }}>
            <i className="fas fa-times"></i>
          </div>
          <h2 style={{color: '#c62828', marginBottom: '15px'}}>Thanh toán không thành công</h2>
          <p style={{color: '#666', marginBottom: '30px'}}>{message}</p>
          
          <div className="actions" style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
            <button 
              onClick={() => navigate('/orders')} 
              className="btn btn-secondary"
            >
              Về danh sách đơn hàng
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default SEPayOrderSuccess;
