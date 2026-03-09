import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductImageUrl, handleImageError } from '../utils/imageHelper';
import './ProductComponents.css';

/**
 * ProductCard Component
 * Displays a single product in card format
 * Design: Chợ Tốt marketplace style
 */
function ProductCard({ product }) {
  const navigate = useNavigate();

  if (!product) return null;

  const {
    _id,
    title,
    price,
    images,
    location,
    createdAt,
    seller
  } = product;

  // Format price to Vietnamese currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Format date to relative time
  const formatDate = (date) => {
    const now = new Date();
    const productDate = new Date(date);
    const diffTime = Math.abs(now - productDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
  };

  // Get image URL with fallback
  const imageUrl = getProductImageUrl(product);

  const handleClick = () => {
    navigate(`/product/${_id}`);
  };

  return (
    <div className="product-card" onClick={handleClick}>
      <div className="product-card__image">
        <img 
          src={imageUrl} 
          alt={title}
          onError={(e) => handleImageError(e, 'product')}
        />
        {images && images.length > 1 && (
          <div className="product-card__image-count">
            📷 {images.length}
          </div>
        )}
      </div>
      
      <div className="product-card__content">
        <h3 className="product-card__title">{title}</h3>
        
        <div className="product-card__price">
          {formatPrice(price)}
        </div>
        
        <div className="product-card__meta">
          <div className="product-card__location">
            {location?.city && (
              <span>{location.city}</span>
            )}
          </div>
          
          <div className="product-card__date">
            {formatDate(createdAt)}
          </div>
        </div>

        {seller?.isVerified && (
          <div className="product-card__badge">
            <span className="badge-verified">✓ Đã xác thực</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
