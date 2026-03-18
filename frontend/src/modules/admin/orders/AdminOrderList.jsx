import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getModeratorOrders } from '../../../services/moderator.service';
import '../AdminModules.css';

const AdminOrderList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ status: '', keyword: '' });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [message, setMessage] = useState('');

  const sanitizeKeyword = (keyword) => String(keyword || '').trim();

  const validateKeyword = (keyword) => {
    if (keyword.length > 100) {
      throw new Error('Từ khóa tìm kiếm không được vượt quá 100 ký tự');
    }
  };

  const fetchOrders = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const keyword = sanitizeKeyword(filters.keyword);
      validateKeyword(keyword);

      const result = await getModeratorOrders({
        page,
        limit: pageSize,
        status: filters.status || undefined,
        keyword: keyword || undefined
      });
      
      setOrders(result.items);
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.limit,
        total: result.pagination.total
      });
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({ status: '', keyword: '' });
    fetchOrders(1, pagination.pageSize);
  };

  useEffect(() => {
    fetchOrders(1, pagination.pageSize);
  }, [filters.status]);

  const STATUS_COLOR = {
    awaiting_seller_confirmation: 'blue',
    awaiting_payment: 'gold',
    paid: 'cyan',
    shipped: 'processing',
    completed: 'green',
    cancelled: 'red',
    disputed: 'orange'
  };

  const STATUS_LABEL = {
    awaiting_seller_confirmation: 'Chờ xác nhận',
    awaiting_payment: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    shipped: 'Đang giao',
    completed: 'Hoàn tất',
    cancelled: 'Đã hủy',
    disputed: 'Đang tranh chấp'
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  return (
    <div className="admin-module">
      <div className="admin-module__header">
        <h1>Quản lý đơn hàng</h1>
        <p>Theo dõi và xử lý đơn hàng trong hệ thống</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('thành công') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div className="admin-module__filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Tìm đơn hàng..."
            value={filters.keyword}
            onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            onKeyPress={(e) => e.key === 'Enter' && fetchOrders(1, pagination.pageSize)}
            className="filter-input"
          />
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="filter-select"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="awaiting_seller_confirmation">Chờ xác nhận</option>
            <option value="awaiting_payment">Chờ thanh toán</option>
            <option value="paid">Đã thanh toán</option>
            <option value="shipped">Đang giao</option>
            <option value="completed">Hoàn tất</option>
            <option value="cancelled">Đã hủy</option>
            <option value="disputed">Đang tranh chấp</option>
          </select>

          <div className="filter-actions">
            <button 
              className="btn btn-primary"
              onClick={() => fetchOrders(1, pagination.pageSize)}
            >
              <i className="fas fa-search"></i>
              Lọc
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleResetFilters}
            >
              <i className="fas fa-redo"></i>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="admin-module__content">
        {loading ? (
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i>
            Đang tải...
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã ĐH</th>
                    <th>Người mua</th>
                    <th>Người bán</th>
                    <th>Mã vận đơn</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order._id}>
                        <td>
                          <strong>
                            {order.orderCode || order._id?.slice(-8)?.toUpperCase()}
                          </strong>
                        </td>
                        <td>{order.buyerId?.fullName || 'N/A'}</td>
                        <td>{order.sellerId?.fullName || 'N/A'}</td>
                        <td>{order.trackingNumber || '-'}</td>
                        <td className="currency">{formatCurrency(order.totalToPay)}</td>
                        <td>
                          <span className={`status status-${order.status}`}>
                            {STATUS_LABEL[order.status] || order.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => navigate(`/admin/orders/${order._id}`)}
                          >
                            <i className="fas fa-eye"></i>
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination.total > pagination.pageSize && (
              <div className="pagination">
                <button
                  className="btn btn-sm"
                  onClick={() => fetchOrders(pagination.current - 1, pagination.pageSize)}
                  disabled={pagination.current === 1}
                >
                  Trước
                </button>
                
                <span className="page-info">
                  Trang {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize)}
                </span>
                
                <button
                  className="btn btn-sm"
                  onClick={() => fetchOrders(pagination.current + 1, pagination.pageSize)}
                  disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminOrderList;