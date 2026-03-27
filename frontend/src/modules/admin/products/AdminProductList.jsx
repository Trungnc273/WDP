import React, { useState, useEffect } from 'react';
import { 
  getModeratorPendingProducts, 
  approveModeratorProduct, 
  rejectModeratorProduct 
} from '../../../services/moderator.service';
import { getImageUrl } from '../../../utils/imageHelper';
import { formatCategoryText } from '../../../utils/categoryHelper';
import '../AdminModules.css';

const AdminProductList = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ keyword: '' });
  const [message, setMessage] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getModeratorPendingProducts();
      setProducts(data);
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Không tải được danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleApprove = async (id) => {
    try {
      await approveModeratorProduct(id);
      setMessage('Đã duyệt sản phẩm thành công');
      fetchProducts();
    } catch (error) {
      setMessage(error.message || 'Không thể duyệt sản phẩm');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    setSubmitting(true);
    try {
      await rejectModeratorProduct(rejectTarget, rejectReason);
      setMessage('Đã từ chối sản phẩm thành công');
      setRejectTarget(null);
      setRejectReason('');
      fetchProducts();
    } catch (error) {
      setMessage(error.message || 'Không thể từ chối sản phẩm');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = filters.keyword
    ? products.filter((p) => {
        const title = (p.title || '').toLowerCase();
        // Ho tro ca schema cu (sellerId) va schema moi (seller).
        const seller = (p.seller?.fullName || p.seller?.email || p.sellerId?.fullName || p.sellerId?.email || '').toLowerCase();
        const kw = filters.keyword.toLowerCase();
        return title.includes(kw) || seller.includes(kw);
      })
    : products;

  const conditionMap = { 
    new: 'Mới', 
    'like-new': 'Như mới', 
    good: 'Tốt', 
    fair: 'Khá', 
    poor: 'Kém' 
  };

  return (
    <div className="admin-module">
      <div className="admin-module__header">
        <h1>Duyệt sản phẩm</h1>
        <p>Xem xét và phê duyệt sản phẩm chờ duyệt</p>
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
            placeholder="Tìm theo tên sản phẩm, người đăng..."
            value={filters.keyword}
            onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            className="filter-input"
          />
          
          <div className="filter-actions">
            <span className="status status-orange">
              {filteredProducts.length} chờ duyệt
            </span>
            <button 
              className="btn btn-secondary"
              onClick={() => { setFilters({ keyword: '' }); fetchProducts(); }}
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
          <div className="table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th style={{width: '80px'}}>Ảnh</th>
                  <th style={{width: '200px'}}>Tên sản phẩm</th>
                  <th style={{width: '140px'}}>Người đăng</th>
                  <th style={{width: '120px', textAlign: 'right'}}>Giá</th>
                  <th style={{width: '100px'}}>Tình trạng</th>
                  <th style={{width: '100px'}}>Ngày đăng</th>
                  <th style={{width: '140px'}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-data">
                      Không có sản phẩm nào chờ duyệt
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <img
                          src={getImageUrl(product.images?.[0]) || '/images/placeholder.png'}
                          alt={product.title}
                          style={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 4,
                            border: '1px solid #e0e0e0'
                          }}
                          onError={(e) => {
                            e.target.src = '/images/placeholder.png';
                          }}
                        />
                      </td>
                      <td>
                        <div>
                          <div style={{fontWeight: '500', marginBottom: '4px'}}>
                            {product.title}
                          </div>
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            {/* Hien thi nhieu danh muc dong bo voi man moderator/user. */}
                            {formatCategoryText(product)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{fontWeight: '500'}}>
                          {product.seller?.fullName || product.seller?.email || product.sellerId?.fullName || product.sellerId?.email || 'N/A'}
                        </div>
                      </td>
                      <td style={{textAlign: 'right', fontWeight: '600', color: '#52c41a'}}>
                        {Number(product.price || 0).toLocaleString('vi-VN')} ₫
                      </td>
                      <td>
                        <span className="status status-blue">
                          {conditionMap[product.condition] || product.condition}
                        </span>
                      </td>
                      <td>
                        <div style={{fontSize: '13px'}}>
                          {product.createdAt ? new Date(product.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleApprove(product._id)}
                            style={{ background: '#52c41a' }}
                          >
                            <i className="fas fa-check"></i>
                            Duyệt
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setRejectTarget(product._id)}
                          >
                            <i className="fas fa-times"></i>
                            Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="modal-overlay" onClick={() => !submitting && setRejectTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Lý do từ chối</h3>
              <button 
                className="modal-close" 
                onClick={() => !submitting && setRejectTarget(null)}
                disabled={submitting}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Nhập lý do từ chối sản phẩm</label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối (tối thiểu 10 ký tự)"
                  className="form-control"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setRejectTarget(null)}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                className="btn btn-danger"
                onClick={handleRejectConfirm}
                disabled={submitting || rejectReason.trim().length < 10}
              >
                {submitting ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-times"></i>
                )}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductList;