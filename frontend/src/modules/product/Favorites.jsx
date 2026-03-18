import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import favoriteService from '../../services/favorite.service';
import { getImageUrl, handleImageError } from '../../utils/imageHelper';
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

  // ✅ FIX: dùng useCallback
  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);

      const res = await favoriteService.getFavorites({
        page: pagination.page,
        limit: pagination.limit
      });

      const data = res.data;

      setFavorites(data.favorites);
      setPagination(prev => ({
        ...prev,
        total: data.total,
        totalPages: data.totalPages
      }));

    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  // ✅ FIX: dependency chuẩn
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchFavorites();
  }, [user, navigate, fetchFavorites]);

  const handleRemoveFavorite = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Xóa khỏi yêu thích?')) return;

    try {
      await favoriteService.removeFavorite(id);

      // reload lại data
      fetchFavorites();

    } catch (err) {
      console.error(err);
      alert('Lỗi xoá');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading && favorites.length === 0) {
    return (
      <div className="favorites-container">
        <div className="favorites-loading">Đang tải danh sách tin đã lưu...</div>
      </div>
    );
  }

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <div>
          <h1>Tin đã lưu</h1>
          <p className="favorites-subtitle">Quản lý nhanh các sản phẩm bạn đang quan tâm</p>
        </div>
        <div className="favorites-stat">
          <span className="favorites-stat__value">{pagination.total}</span>
          <span className="favorites-stat__label">sản phẩm</span>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">♡</div>
          <h2>Chưa có tin đã lưu</h2>
          <p>Hãy khám phá sản phẩm và nhấn lưu để xem lại tại đây.</p>
          <Link to="/" className="favorites-explore-btn">
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <>
          <div className="favorites-grid">
            {favorites.map(fav => {
              const p = fav.product;
              if (!p) return null;

              const productImage = getImageUrl(p.images?.[0]) || '/images/placeholders/product-placeholder.svg';

              return (
                <div key={fav._id} className="favorite-card">

                  <Link to={`/product/${p._id}`}>
                    <div className="product-image">
                      <img
                        src={productImage}
                        alt={p.title}
                        loading="lazy"
                        onError={(e) => handleImageError(e, 'product')}
                      />
                      <div className="favorite-badge">Đã lưu</div>
                    </div>

                    <div className="product-info">
                      <div className="product-title">{p.title}</div>
                      <div className="product-price">{formatPrice(Number(p.price || 0))}</div>
                      <div className="product-meta">
                        <span>{p.location?.district || 'N/A'}</span>
                        <span>{p.location?.city || 'N/A'}</span>
                      </div>
                      <div className="product-seller">
                        Người bán: <strong>{p.seller?.fullName || 'N/A'}</strong>
                      </div>
                    </div>
                  </Link>

                  <button
                    className="remove-favorite-btn"
                    onClick={(e) => handleRemoveFavorite(p._id, e)}
                    title="Xóa khỏi yêu thích"
                  >
                    Bỏ lưu
                  </button>
                </div>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={pagination.page === 1}
                onClick={() =>
                  setPagination(prev => ({ ...prev, page: prev.page - 1 }))
                }
              >
                Trang trước
              </button>

              <span className="pagination-text">
                Trang {pagination.page} / {pagination.totalPages}
              </span>

              <button
                className="pagination-btn"
                disabled={pagination.page === pagination.totalPages}
                onClick={() =>
                  setPagination(prev => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Trang sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Favorites;