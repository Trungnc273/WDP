import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import favoriteService from '../../services/favorite.service';
import './Favorites.css';

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchFavorites();
  }, [user, navigate, pagination.page]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };

      const response = await favoriteService.getFavorites(params);
      const data = response.data;
      
      setFavorites(data.favorites);
      setPagination(prev => ({
        ...prev,
        total: data.total,
        totalPages: data.totalPages
      }));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi danh sách yêu thích?')) {
      return;
    }

    try {
      await favoriteService.removeFavorite(productId);
      fetchFavorites();
    } catch (error) {
      alert('Không thể xóa sản phẩm');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo(0, 0);
  };

  if (loading && favorites.length === 0) {
    return (
      <div className="favorites-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <h1>❤️ Tin đăng đã lưu</h1>
        <p className="favorites-count">{pagination.total} sản phẩm</p>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🤍</div>
          <h2>Chưa có tin đăng yêu thích</h2>
          <p>Hãy lưu những tin đăng bạn quan tâm để xem lại sau</p>
          <Link to="/" className="btn btn-primary">
            Khám phá ngay
          </Link>
        </div>
      ) : (
        <>
          <div className="favorites-grid">
            {favorites.map(favorite => {
              const product = favorite.product;
              if (!product) return null;

              return (
                <div key={favorite._id} className="favorite-card">
                  <Link to={`/product/${product._id}`} className="product-link">
                    <div className="product-image">
                      <img 
                        src={product.images[0] || '/images/placeholder.png'} 
                        alt={product.title}
                      />
                    </div>
                    <div className="product-info">
                      <h3 className="product-title">{product.title}</h3>
                      <div className="product-price">{formatPrice(product.price)}</div>
                      <div className="product-meta">
                        <span className="product-location">
                          📍 {product.location?.district}, {product.location?.city}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <button 
                    className="remove-favorite-btn"
                    onClick={(e) => handleRemoveFavorite(product._id, e)}
                    title="Xóa khỏi yêu thích"
                  >
                    ❌
                  </button>
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
  );
};

export default Favorites;
