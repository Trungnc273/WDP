import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import productService from '../../services/product.service';
import { getImageUrl } from '../../utils/imageHelper';
import './MyProducts.css';

const PRODUCT_PLACEHOLDER = '/images/placeholders/product-placeholder.svg';

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
  const [visibilityModal, setVisibilityModal] = useState({
    show: false,
    productId: null,
    productTitle: '',
    nextStatus: 'hidden'
  });
  const [processingAction, setProcessingAction] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

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
      setFeedback({ type: '', message: '' });
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
      setProcessingAction(true);
      await productService.deleteProduct(deleteModal.productId);
      setFeedback({ type: 'success', message: 'Đã xóa tin đăng thành công.' });
      setDeleteModal({ show: false, productId: null, productTitle: '' });
      fetchMyProducts();
    } catch (error) {
      setFeedback({ type: 'error', message: error.response?.data?.message || 'Không thể xóa sản phẩm' });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleVisibilityChange = async () => {
    try {
      setProcessingAction(true);
      await productService.updateProductVisibility(visibilityModal.productId, visibilityModal.nextStatus);
      const isHidden = visibilityModal.nextStatus === 'hidden';
      setFeedback({
        type: 'success',
        message: isHidden ? 'Tin đăng đã được ẩn khỏi chợ.' : 'Tin đăng đã được hiển thị lại.'
      });
      setVisibilityModal({ show: false, productId: null, productTitle: '', nextStatus: 'hidden' });
      fetchMyProducts();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Không thể cập nhật trạng thái hiển thị'
      });
    } finally {
      setProcessingAction(false);
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

  const openVisibilityModal = (product, nextStatus) => {
    setVisibilityModal({
      show: true,
      productId: product._id,
      productTitle: product.title,
      nextStatus
    });
  };

  const closeVisibilityModal = () => {
    setVisibilityModal({ show: false, productId: null, productTitle: '', nextStatus: 'hidden' });
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
      'pending': { text: 'Đang giao dịch', class: 'status-pending' },
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

  const applyFilter = (nextFilter) => {
    setStatusFilter(nextFilter);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getVisibilityAction = (product) => {
    if (product.status === 'hidden') {
      return { label: 'Hiện', nextStatus: 'active', className: 'show-btn' };
    }
    return { label: 'Ẩn', nextStatus: 'hidden', className: 'hide-btn' };
  };

  if (loading && products.length === 0) {
    return (
      <div className="my-products-container">
        <div className="loading-state" aria-busy="true" aria-live="polite">
          <div className="spinner" />
          <div className="loading-text">Đang tải...</div>
        </div>
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
        <div className="my-products-cta">
          <Link to="/product/create" className="btn btn-primary">
            + Tạo tin mới
          </Link>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`my-products-feedback ${feedback.type === 'error' ? 'is-error' : 'is-success'}`}
          role="status"
          aria-live="polite"
        >
          {feedback.message}
        </div>
      )}

      {/* Filter */}
      <nav className="filter-bar" aria-label="Lọc tin đăng">
        <button
          className={`filter-btn ${statusFilter === '' ? 'active' : ''}`}
          onClick={() => applyFilter('')}
        >
          Tất cả ({pagination.total})
        </button>
        <button
          className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
          onClick={() => applyFilter('active')}
        >
          Đang bán
        </button>
        <button
          className={`filter-btn ${statusFilter === 'sold' ? 'active' : ''}`}
          onClick={() => applyFilter('sold')}
        >
          Đã bán
        </button>
        <button
          className={`filter-btn ${statusFilter === 'hidden' ? 'active' : ''}`}
          onClick={() => applyFilter('hidden')}
        >
          Đã ẩn
        </button>
        <button
          className={`filter-btn ${statusFilter === 'deleted' ? 'active' : ''}`}
          onClick={() => applyFilter('deleted')}
        >
          Đã xóa
        </button>
      </nav>

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
                    src={getImageUrl(product.images?.[0]) || PRODUCT_PLACEHOLDER}
                    alt={product.title}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = PRODUCT_PLACEHOLDER;
                    }}
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
                  {product.status !== 'deleted' ? (
                    (() => {
                      const isLockedAction = product.status === 'sold' || product.status === 'pending' || Boolean(product.isInActiveOrder);

                      if (isLockedAction) {
                        return (
                          <>
                            <Link to={`/product/${product._id}`} className="action-btn view-btn">
                              Xem
                            </Link>
                            <span className="action-chip action-chip--sold">
                              {product.status === 'sold'
                                ? 'Đã bán - chỉ xem'
                                : product.status === 'pending'
                                  ? 'Đang giao dịch - chỉ xem'
                                  : 'Đang trong đơn hàng - chỉ xem'}
                            </span>
                          </>
                        );
                      }

                      return (
                        <>
                          <Link to={`/product/${product._id}`} className="action-btn view-btn">
                            Xem
                          </Link>

                          <Link
                            to={`/product/${product._id}/edit`}
                            className="action-btn edit-btn"
                          >
                            Sửa
                          </Link>

                          {(product.status === 'active' || product.status === 'hidden') && (
                            <button
                              onClick={() => {
                                const action = getVisibilityAction(product);
                                openVisibilityModal(product, action.nextStatus);
                              }}
                              className={`action-btn ${getVisibilityAction(product).className}`}
                              aria-pressed={product.status === 'hidden'}
                            >
                              {getVisibilityAction(product).label}
                            </button>
                          )}

                          <button
                            onClick={() => openDeleteModal(product)}
                            className="action-btn delete-btn"
                          >
                            Xóa
                          </button>
                        </>
                      );
                    })()
                  ) : (
                    <div className="deleted-note">Tin đã xóa, không thể chỉnh sửa.</div>
                  )}
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
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <h3 id="delete-modal-title">Xác nhận xóa</h3>
            <p>Bạn có chắc chắn muốn xóa sản phẩm "{deleteModal.productTitle}"?</p>
            <div className="modal-actions">
              <button onClick={closeDeleteModal} className="btn btn-secondary">
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger"
                disabled={processingAction}
                aria-busy={processingAction}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {visibilityModal.show && (
        <div className="modal-overlay" onClick={closeVisibilityModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="visibility-modal-title"
          >
            <h3 id="visibility-modal-title">
              {visibilityModal.nextStatus === 'hidden' ? 'Ẩn tin đăng' : 'Hiện lại tin đăng'}
            </h3>
            <p>
              {visibilityModal.nextStatus === 'hidden'
                ? `Bạn có chắc muốn ẩn sản phẩm "${visibilityModal.productTitle}"?`
                : `Bạn có chắc muốn hiển thị lại sản phẩm "${visibilityModal.productTitle}"?`}
            </p>
            <div className="modal-actions">
              <button onClick={closeVisibilityModal} className="btn btn-secondary">
                Hủy
              </button>
              <button
                onClick={handleVisibilityChange}
                className="btn btn-primary"
                disabled={processingAction}
                aria-busy={processingAction}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProducts;
