import React from 'react';
import ProductCard from './ProductCard';
import './ProductComponents.css';

/**
 * ProductList Component
 * Displays a grid of products
 * Design: Chợ Tốt marketplace style with responsive grid
 */
function ProductList({ products, loading }) {
  if (loading) {
    return (
      <div className="product-list">
        <div className="product-list__loading">
          <div className="spinner"></div>
          <p>Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="product-list">
        <div className="product-list__empty">
          <p>Không tìm thấy sản phẩm nào</p>
          <span>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</span>
        </div>
      </div>
    );
  }

  return (
    <div className="product-list">
      <div className="product-list__grid">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default ProductList;
