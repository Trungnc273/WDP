import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './ProductComponents.css';

/**
 * FilterPanel Component
 * Provides filters for products: category, price range, location
 * Implements Requirements 7-10: Filter by category, price, location, and combine filters
 */
function FilterPanel({ onFilterChange, initialFilters = {} }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || '');
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice || '');
  const [selectedCity, setSelectedCity] = useState(initialFilters.city || '');
  const [isExpanded, setIsExpanded] = useState(false);

  // Common cities in Vietnam
  const cities = [
    'Hà Nội',
    'Hồ Chí Minh',
    'Đà Nẵng',
    'Hải Phòng',
    'Cần Thơ',
    'Biên Hòa',
    'Nha Trang',
    'Huế',
    'Vũng Tàu',
    'Buôn Ma Thuột'
  ];

  // Tai danh muc khi component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
  };

  const handleMinPriceChange = (e) => {
    const value = e.target.value;
    setMinPrice(value);
  };

  const handleMaxPriceChange = (e) => {
    const value = e.target.value;
    setMaxPrice(value);
  };

  const handleCityChange = (e) => {
    const value = e.target.value;
    setSelectedCity(value);
  };

  const handleApplyFilters = () => {
    const filters = {
      category: selectedCategory || null,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      city: selectedCity || null
    };

    if (onFilterChange) {
      onFilterChange(filters);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedCity('');

    if (onFilterChange) {
      onFilterChange({
        category: null,
        minPrice: null,
        maxPrice: null,
        city: null
      });
    }
  };

  const hasActiveFilters = selectedCategory || minPrice || maxPrice || selectedCity;

  return (
    <div className="filter-panel">
      <div className="filter-panel__header">
        <h3>Bộ lọc</h3>
        <button
          className="filter-panel__toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      <div className={`filter-panel__content ${isExpanded ? 'expanded' : ''}`}>
        {/* Category Filter */}
        <div className="filter-panel__section">
          <label htmlFor="category-select" className="filter-panel__label">Danh mục</label>
          <select
            id="category-select"
            className="filter-panel__select"
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range Filter */}
        <div className="filter-panel__section">
          <label className="filter-panel__label">Khoảng giá</label>
          <div className="filter-panel__price-range">
            <input
              type="number"
              className="filter-panel__input"
              placeholder="Giá tối thiểu"
              value={minPrice}
              onChange={handleMinPriceChange}
              min="0"
              aria-label="Giá tối thiểu"
            />
            <span className="filter-panel__separator">-</span>
            <input
              type="number"
              className="filter-panel__input"
              placeholder="Giá tối đa"
              value={maxPrice}
              onChange={handleMaxPriceChange}
              min="0"
              aria-label="Giá tối đa"
            />
          </div>
        </div>

        {/* Location Filter */}
        <div className="filter-panel__section">
          <label htmlFor="city-select" className="filter-panel__label">Khu vực</label>
          <select
            id="city-select"
            className="filter-panel__select"
            value={selectedCity}
            onChange={handleCityChange}
          >
            <option value="">Toàn quốc</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="filter-panel__actions">
          <button
            className="filter-panel__button filter-panel__button--primary"
            onClick={handleApplyFilters}
          >
            Áp dụng
          </button>
          
          {hasActiveFilters && (
            <button
              className="filter-panel__button filter-panel__button--secondary"
              onClick={handleClearFilters}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FilterPanel;
