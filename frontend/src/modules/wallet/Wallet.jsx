import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import walletService from '../../services/wallet.service';
import './Wallet.css';

const Wallet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchWalletData = useCallback(async () => {
    try {
      setLoading(true);
      const balanceData = await walletService.getBalance();
      setBalance(balanceData);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setTransactionsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      const data = await walletService.getTransactions(params);
      setTransactions(data.transactions || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0
      }));
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchWalletData();
  }, [user, navigate, fetchWalletData]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(Math.abs(amount));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeText = (type) => {
    const types = {
      'deposit': 'Nạp tiền',
      'withdrawal': 'Rút tiền',
      'payment': 'Thanh toán',
      'refund': 'Hoàn tiền',
      'earning': 'Thu nhập',
      'fee': 'Phí nền tảng'
    };
    return types[type] || type;
  };

  const getTransactionIcon = (type) => {
    const icons = {
      'deposit': '↗️',
      'withdrawal': '↙️',
      'payment': '💳',
      'refund': '↩️',
      'earning': '💰',
      'fee': '🏦'
    };
    return icons[type] || '💱';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'completed': { text: 'Hoàn thành', class: 'status-completed' },
      'pending': { text: 'Đang xử lý', class: 'status-pending' },
      'failed': { text: 'Thất bại', class: 'status-failed' },
      'cancelled': { text: 'Đã hủy', class: 'status-cancelled' }
    };

    const badge = badges[status] || { text: status, class: '' };

    return (
      <span className={`status-badge ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  const renderTransactionDetails = (transaction) => {
    if (transaction.type !== 'withdrawal') {
      return null;
    }

    return (
      <div className="transaction-extra">
        {/* Phần div này bọc thông tin ngân hàng để giữ chúng trên cùng 1 dòng */}
        <div className="bank-info">
          <span>
            Ngân hàng: {transaction.metadata?.bankName || '---'} - {transaction.metadata?.bankAccount || '---'}
          </span>
          {transaction.metadata?.accountHolder && (
            <span style={{ marginLeft: '10px' }}>Chủ TK: {transaction.metadata.accountHolder}</span>
          )}
        </div>
        
        {/* Phần lỗi nằm ở div riêng để tự động rớt xuống dòng */}
        {transaction.failureReason && (
          <div className="transaction-extra__error" style={{ fontSize: '13px', marginTop: '4px' }}>
            <span style={{ color: '#cf1322', fontWeight: 600 }}>Lý do: {transaction.failureReason}</span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="wallet-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wallet-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchWalletData} className="btn btn-primary">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <h1>Ví của tôi</h1>
        <div className="wallet-actions">
          <Link to="/wallet/topup" className="btn btn-primary">
            Nạp tiền
          </Link>
          <Link to="/wallet/withdraw" className="btn btn-secondary">
            Rút tiền
          </Link>
        </div>
      </div>

      {/* Balance Card */}
      <div className="balance-card">
        <div className="balance-main">
          <h2>Số dư khả dụng</h2>
          <div className="balance-amount">
            {formatPrice(balance?.balance || 0)}
          </div>
        </div>

        <div className="balance-stats">
          <div className="stat-item">
            <span className="stat-label">Tổng nạp:</span>
            <span className="stat-value">{formatPrice(balance?.totalDeposited || 0)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Tổng rút:</span>
            <span className="stat-value">{formatPrice(balance?.totalWithdrawn || 0)}</span>
          </div>
          <div className="stat-item stat-item--highlight">
            <span className="stat-label">Đang chờ rút:</span>
            <span className="stat-value">{formatPrice(balance?.pendingWithdrawalAmount || 0)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Tổng chi:</span>
            <span className="stat-value">{formatPrice(balance?.totalSpent || 0)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Tổng thu:</span>
            <span className="stat-value">{formatPrice(balance?.totalEarned || 0)}</span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="transactions-section">
        <div className="section-header">
          <h2>Lịch sử giao dịch</h2>

          {/* Filters */}
          <div className="transaction-filters">
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">Tất cả loại</option>
              <option value="deposit">Nạp tiền</option>
              <option value="withdrawal">Rút tiền</option>
              <option value="payment">Thanh toán</option>
              <option value="refund">Hoàn tiền</option>
              <option value="earning">Thu nhập</option>
            </select>

            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="filter-input"
              placeholder="Từ ngày"
            />

            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="filter-input"
              placeholder="Đến ngày"
            />
          </div>
        </div>

        {/* Transaction List */}
        {transactionsLoading ? (
          <div className="loading">Đang tải giao dịch...</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <p>Chưa có giao dịch nào</p>
          </div>
        ) : (
          <>
            <div className="transactions-list">
              {transactions
                // CHẶN HIỂN THỊ CÁC BẢN GHI RÚT TIỀN HOẶC NẠP TIỀN THIẾU THÔNG TIN (Do lỗi cũ lưu lại trong DB)
                .filter((transaction) => {
                  if (transaction.type === 'withdrawal' && !transaction.metadata?.bankName) {
                    return false;
                  }
                  return true;
                })
                .map((transaction) => {
                  const rawAmount = Math.abs(Number(transaction?.amount) || 0);
                  const type = transaction?.type;
                  const status = transaction?.status;
                  const isPending = status === 'pending';
                  const isFailed = status === 'failed';
                  const isCompleted = status === 'completed';

                  let displayAmount = rawAmount; // Mặc định hiển thị đúng số tiền
                  let displaySign = '';
                  let displayClass = '';

                  const debitTypes = new Set(['withdrawal', 'payment', 'fee']);
                  const creditTypes = new Set(['deposit', 'refund', 'earning']);

                  // Logic cho Nạp tiền (deposit)
                  if (creditTypes.has(type)) {
                    if (isCompleted && rawAmount > 0) {
                      displayAmount = rawAmount;
                      displaySign = '+';
                      displayClass = 'positive';
                    } else {
                      // Nạp tiền chưa hoàn thành -> Chuyển thành 0đ, màu đen (class trống)
                      displayAmount = 0;
                      displaySign = '';
                      displayClass = '';
                    }
                  }

                  // Logic cho Rút tiền (withdrawal)
                  if (debitTypes.has(type)) {
                    if (isCompleted && rawAmount > 0) {
                      displayAmount = rawAmount;
                      displaySign = '-';
                      displayClass = 'negative';
                    } else if (isPending && rawAmount > 0) {
                      displayAmount = rawAmount;
                      displaySign = '-';
                      displayClass = 'pending-amount';
                    } else {
                      // Rút tiền thất bại -> Giữ nguyên số tiền, màu đen (class trống)
                      displayAmount = rawAmount;
                      displaySign = '';
                      displayClass = '';
                    }
                  }

                  return (
                    <div key={transaction._id} className="transaction-item">
                      <div className="transaction-icon">
                        {getTransactionIcon(transaction.type)}
                      </div>

                      <div className="transaction-info">
                        <div className="transaction-type">
                          {getTransactionTypeText(transaction.type)}
                        </div>
                        <div className="transaction-description">
                          {transaction.type === 'deposit' && transaction.status === 'completed' ? transaction.description : null}
                        </div>

                        {renderTransactionDetails(transaction)}
                        
                        <div className="transaction-date">
                          {formatDate(transaction.createdAt)}
                        </div>
                      </div>

                      <div className="transaction-amount">
                        <div className={`amount ${displayClass}`}>
                          {displaySign}{formatPrice(displayAmount)}
                        </div>
                        {getStatusBadge(transaction.status)}

                        {/* Show messages for withdrawals */}
                        {type === 'withdrawal' && isPending && (
                          <div style={{ color: '#d48806', fontSize: 13, fontWeight: 600, marginTop: 6 }}>
                            Đang xử lý
                          </div>
                        )}

                        {type === 'withdrawal' && isFailed && (
                          <div style={{ color: '#cf1322', fontSize: 13, fontWeight: 600, marginTop: 6 }}>
                            Bạn rút tiền không thành công
                          </div>
                        )}

                        {type === 'deposit' && (isFailed || isPending) && (
                          <div style={{ color: '#cf1322', fontSize: 13, fontWeight: 600, marginTop: 6 }}>
                            {formatPrice(rawAmount)} nạp thất bại
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="pagination-btn"
                >
                  ← Trước
                </button>

                <span className="pagination-info">
                  Trang {pagination.page} / {pagination.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="pagination-btn"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Wallet;