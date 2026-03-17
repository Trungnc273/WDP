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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Xóa khỏi yêu thích?')) return;

    try {
      await favoriteService.removeFavorite(id);
      fetchFavorites();
    } catch {
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
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <h1>❤️ Tin đã lưu</h1>
        <p className="favorites-count">{pagination.total} sản phẩm</p>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🤍</div>
          <h2>Chưa có sản phẩm</h2>
          <Link to="/" className="btn btn-primary">
            Khám phá
          </Link>
        </div>
      ) : (
        <>
          <div className="favorites-grid">
            {favorites.map(fav => {
              const p = fav.product;
              if (!p) return null;

              return (
                <div key={fav._id} className="favorite-card">
                  
                  {/* BADGE */}
                  <div className="favorite-badge">Yêu thích</div>

                  <Link to={`/product/${p._id}`}>
                    <div className="product-image">
                      <img
                        src={p.images?.[0] || '/images/placeholder.png'}
                        alt={p.title}
                      />
                    </div>

                    <div className="product-info">
                      <div className="product-title">{p.title}</div>
                      <div className="product-price">{formatPrice(p.price)}</div>
                      <div className="product-meta">
                        📍 {p.location?.district}, {p.location?.city}
                      </div>
                    </div>
                  </Link>

                  {/* REMOVE */}
                  <button
                    className="remove-favorite-btn"
                    onClick={(e) => handleRemoveFavorite(p._id, e)}
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>

          {/* PAGINATION */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={pagination.page === 1}
                onClick={() =>
                  setPagination(prev => ({ ...prev, page: prev.page - 1 }))
                }
              >
                ← Trước
              </button>

              <span>
                {pagination.page} / {pagination.totalPages}
              </span>

              <button
                className="pagination-btn"
                disabled={pagination.page === pagination.totalPages}
                onClick={() =>
                  setPagination(prev => ({ ...prev, page: prev.page + 1 }))
                }
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