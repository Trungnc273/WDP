import React, { useState } from 'react';
import './ProductComponents.css';

/**
 * SearchBar Component
 * Search input for products
 * Implements Requirement 6: Search Products
 */
function SearchBar({ onSearch, placeholder = 'Tìm kiếm sản phẩm...', initialValue = '' }) {
  const [searchValue, setSearchValue] = useState(initialValue);

  const handleChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchValue.trim());
    }
  };

  const handleClear = () => {
    setSearchValue('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className="search-bar">
      <form className="search-bar__form" onSubmit={handleSubmit}>
        <div className="search-bar__input-wrapper">
          <span className="search-bar__icon">🔍</span>
          
          <input
            type="text"
            className="search-bar__input"
            placeholder={placeholder}
            value={searchValue}
            onChange={handleChange}
          />
          
          {searchValue && (
            <button
              type="button"
              className="search-bar__clear"
              onClick={handleClear}
              aria-label="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>
        
        <button type="submit" className="search-bar__button">
          Tìm kiếm
        </button>
      </form>
    </div>
  );
}

export default SearchBar;
