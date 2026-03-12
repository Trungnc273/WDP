import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import productService from '../../services/product.service';
import { getImageUrl } from '../../utils/imageHelper';
import './MyProducts.css';

const MyProducts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    productId: null,
    productTitle: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyProducts();
  }, [user, navigate, statusFilter, pagination.page]);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      const data = await productService.getMyProducts(params);
      
      setProducts(data.products || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await productService.deleteProduct(deleteModal.productId);
      alert('Sản phẩm đã được xóa thành công');
      setDeleteModal({ show: false, productId: null, productTitle: '' });
      fetchMyProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể xóa sản phẩm');
    }
  };

  const openDeleteModal = (product) => {
    setDeleteModal({
      show: true,
      productId: product._id,
      productTitle: product.title
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, productId: null, productTitle: '' });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'active': { text: 'Đang bán', class: 'status-active' },
      'sold': { text: 'Đã bán', class: 'status-sold' },
      'hidden': { text: 'Đã ẩn', class: 'status-hidden' },
      'deleted': { text: 'Đã xóa', class: 'status-deleted' }
    };
    
    const badge = badges[status] || { text: status, class: '' };
    
    return (
      <span className={`status-badge ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo(0, 0);
  };

  if (loading && products.length === 0) {
    return (
      <div className="my-products-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="my-products-container">
      <div className="my-products-header">
        <div className="my-products-header-content">
          <h1>Quản lý tin đăng</h1>
          <p>Theo dõi trạng thái và chỉnh sửa tin đăng của bạn tại một nơi.</p>
        </div>
        <Link to="/product/create" className="btn btn-primary">
          + Tạo tin mới
        </Link>
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <button
          className={`filter-btn ${statusFilter === '' ? 'active' : ''}`}
          onClick={() => setStatusFilter('')}
        >
          Tất cả ({pagination.total})
        </button>
        <button
          className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          Đang bán
        </button>
        <button
          className={`filter-btn ${statusFilter === 'sold' ? 'active' : ''}`}
          onClick={() => setStatusFilter('sold')}
        >
          Đã bán
        </button>
        <button
          className={`filter-btn ${statusFilter === 'hidden' ? 'active' : ''}`}
          onClick={() => setStatusFilter('hidden')}
        >
          Đã ẩn
        </button>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="empty-state">
          <h3>Chưa có tin đăng nào</h3>
          <p>Đăng tin đầu tiên để bắt đầu tiếp cận người mua.</p>
          <Link to="/product/create" className="btn btn-primary">
            Đăng tin ngay
          </Link>
        </div>
      ) : (
        <>
          <div className="products-grid">
            {products.map(product => (
              <div key={product._id} className="product-card">
                <Link to={`/product/${product._id}`} className="product-image">
                  <img 
                    src={getImageUrl(product.images?.[0]) || '/images/placeholders/product-placeholder.svg'} 
                    alt={product.title}
                  />
                  {getStatusBadge(product.status)}
                </Link>
                
                <div className="product-info">
                  <div className="product-detail-block">
                    <span className="product-label">Tiêu đề</span>
                    <Link to={`/product/${product._id}`} className="product-title">
                      {product.title}
                    </Link>
                  </div>

                  <div className="product-detail-grid">
                    <div className="product-detail-block product-detail-block--price">
                      <span className="product-label">Giá bán</span>
                      <div className="product-price">{formatPrice(product.price)}</div>
                    </div>

                    <div className="product-detail-block">
                      <span className="product-label">Danh mục</span>
                      <span className="product-category-chip">
                        {product.category?.name || 'Chưa phân loại'}
                      </span>
                    </div>
                  </div>

                  <div className="product-detail-block product-location-block">
                    <span className="product-label">Địa chỉ</span>
                    <div className="product-meta product-location-row">
                      <span className="product-meta-icon">📍</span>
                      <span>{product.location?.city || 'Chưa cập nhật vị trí'}</span>
                    </div>
                  </div>
                </div>

                <div className="product-actions">
                  <Link 
                    to={`/product/${product._id}/edit`} 
                    className="action-btn edit-btn"
                  >
                    Sửa
                  </Link>
                  <button 
                    onClick={() => openDeleteModal(product)}
                    className="action-btn delete-btn"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
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

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Xác nhận xóa</h3>
            <p>Bạn có chắc chắn muốn xóa sản phẩm "{deleteModal.productTitle}"?</p>
            <div className="modal-actions">
              <button onClick={closeDeleteModal} className="btn btn-secondary">
                Hủy
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProducts;
