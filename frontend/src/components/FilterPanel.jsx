import React, { useState, useEffect } from 'react';
import api from '../services/api';
import locationService from '../services/location.service';
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
  
  // Xử lý selectedCities dạng mảng để cho phép chọn nhiều tỉnh/thành
  const [selectedCities, setSelectedCities] = useState(() => {
    if (Array.isArray(initialFilters.cities)) return initialFilters.cities;
    if (initialFilters.city) return [initialFilters.city];
    return [];
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [provinces, setProvinces] = useState([]);

  // Tai danh muc va tinh/thanh khi component mount
  useEffect(() => {
    fetchCategories();
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    const data = await locationService.getProvinces();
    setProvinces(data);
  };

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
    const options = e.target.options;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setSelectedCities(selectedValues);
  };

  const handleApplyFilters = () => {
    const filters = {
      category: selectedCategory || null,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      cities: selectedCities.length > 0 ? selectedCities : null
    };

    if (onFilterChange) {
      onFilterChange(filters);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedCities([]);

    if (onFilterChange) {
      onFilterChange({
        category: null,
        minPrice: null,
        maxPrice: null,
        cities: null
      });
    }
  };

  const hasActiveFilters = selectedCategory || minPrice || maxPrice || selectedCities.length > 0;

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
          <label htmlFor="city-select" className="filter-panel__label">Khu vực (Có thể chọn nhiều)</label>
          <select
            id="city-select"
            className="filter-panel__select filter-panel__select--multiple"
            multiple
            value={selectedCities}
            onChange={handleCityChange}
            style={{ height: '120px' }}
          >
            {provinces.map((province) => (
              <option key={province.code} value={province.name}>
                {province.name}
              </option>
            ))}
          </select>
          <small style={{ display: 'block', marginTop: '4px', color: '#666', fontSize: '12px' }}>Giữ Ctrl/Cmd để chọn nhiều tỉnh/thành</small>
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
