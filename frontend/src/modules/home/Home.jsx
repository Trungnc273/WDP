import React, { useState, useEffect, useRef } from 'react';
import productService from '../../services/product.service';
import locationService from '../../services/location.service';
import ProductList from '../../components/ProductList';
import './Home.css';

/**
 * Home Component (Landing Page)
 * Displays product listing with search, filters, and pagination
 * Implements Requirements 5-10: Browse, Search, Filter products
 * Design: Chợ Tốt marketplace style
 */
function Home() {
  // State for products
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // State for filters (Req 6-9)
  const [filters, setFilters] = useState({
    search: '',
    category: null,
    minPrice: null,
    maxPrice: null,
    cities: []
  });

  const [provinces, setProvinces] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationDropdownRef = useRef(null);

  // State phan trang (Yeu cau 5)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Tai danh muc tinh/thanh khi component mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    const data = await locationService.getProvinces();
    setProvinces(data);
  };

  // Dong dropdown khi click ra ngoai
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target)) {
        setShowLocationDropdown(false);
      }
    };
    if (showLocationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLocationDropdown]);

  // Tai san pham khi bo loc thay doi (reset ve trang 1)
  useEffect(() => {
    setProducts([]);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchProducts(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  /**
   * Tai danh sach san pham tu API
   * Trien khai Yeu cau 5: Duyet san pham co phan trang
   * Trien khai Yeu cau 10: Ket hop nhieu bo loc
   */
  const fetchProducts = async (page = 1, reset = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.cities && filters.cities.length > 0 && { cities: filters.cities })
      };

      const result = await productService.getProducts(params);

      if (reset) {
        setProducts(result.products || []);
      } else {
        setProducts(prev => [...prev, ...(result.products || [])]);
      }

      setPagination(prev => ({
        ...prev,
        page: page,
        total: result.total || 0,
        totalPages: result.totalPages || 0
      }));

      setHasMore(page < (result.totalPages || 0));
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Không thể tải sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle load more
   */
  const handleLoadMore = () => {
    const nextPage = pagination.page + 1;
    fetchProducts(nextPage, false);
  };

  /**
   * Handle search
   * Implements Requirement 6: Search Products
   * Resets pagination to page 1 when search changes
   */
  const handleSearch = (searchValue) => {
    setFilters(prev => ({ ...prev, search: searchValue }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  /**
   * Handle filter changes
   * Implements Requirements 7-9: Filter by category, price, location
   * Resets pagination to page 1 when filters change
   */
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const toggleCity = (cityName) => {
    const next = filters.cities.includes(cityName)
      ? filters.cities.filter(c => c !== cityName)
      : [...filters.cities, cityName];
    handleFilterChange({ cities: next });
  };

  const locationLabel = filters.cities && filters.cities.length > 0
    ? (filters.cities.length === 1 ? filters.cities[0] : `${filters.cities.length} tỉnh/thành`)
    : 'Chọn khu vực';

  // Categories data - Updated to match seed data
  const categories = [
    { id: 'books', name: 'Sách', icon: '📚' },
    { id: 'fashion', name: 'Quần áo', icon: '👕' },
    { id: 'electronics', name: 'Đồ điện tử', icon: '📱' },
    { id: 'home', name: 'Đồ gia dụng', icon: '🏠' },
    { id: 'beauty', name: 'Làm đẹp', icon: '💄' },
    { id: 'sports', name: 'Thể thao', icon: '⚽' },
    { id: 'toys', name: 'Đồ chơi', icon: '🧸' },
    { id: 'pets', name: 'Thú cưng', icon: '🐕' }
  ];

  return (
    <div className="home">
      {/* Hero Banner */}
      <div className="home__hero">
        <div className="home__hero-background">
          <img
            src="/images/banners/banner.png"
            alt="ReFlow Banner"
            className="home__hero-image"
          />
          <div className="home__hero-overlay"></div>
        </div>

        <div className="home__hero-content" style={{ marginTop: '60px' }}>
          <h1>Giá tốt, gần bạn, chốt nhanh!</h1>

          {/* Advanced Search Bar */}
          <div className="home__search-advanced">
            <div className="search-advanced">
              {/* Category Dropdown */}
              <div className="search-advanced__category">
                <select
                  className="search-advanced__select"
                  onChange={(e) => handleFilterChange({ category: e.target.value || null })}
                  value={filters.category || ''}
                >
                  <option value="">Danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Input */}
              <div className="search-advanced__input-wrapper">
                <span className="search-advanced__icon">🔍</span>
                <input
                  type="text"
                  className="search-advanced__input"
                  placeholder="Tìm sản phẩm..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(filters.search);
                    }
                  }}
                />
              </div>

              {/* Location Dropdown */}
              <div className="search-advanced__location" ref={locationDropdownRef} style={{ position: 'relative' }}>
                <span className="search-advanced__location-icon">📍</span>
                <button
                  type="button"
                  className="search-advanced__location-btn"
                  onClick={() => setShowLocationDropdown(prev => !prev)}
                >
                  {locationLabel}
                  <span style={{ marginLeft: '6px', fontSize: '10px' }}>▼</span>
                </button>
                {showLocationDropdown && (
                  <div className="location-dropdown-panel">
                    <div className="location-dropdown-panel__list">
                      {provinces.map((province) => (
                        <label key={province.code} className="location-dropdown-panel__item">
                          <input
                            type="checkbox"
                            checked={filters.cities.includes(province.name)}
                            onChange={() => toggleCity(province.name)}
                          />
                          {province.name}
                        </label>
                      ))}
                    </div>
                    {filters.cities.length > 0 && (
                      <button
                        className="location-dropdown-panel__clear"
                        onClick={() => handleFilterChange({ cities: [] })}
                      >
                        ✕ Xóa lựa chọn
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Search Button */}
              <button
                className="search-advanced__button"
                onClick={() => handleSearch(filters.search)}
              >
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Icons */}
      <div className="home__categories">
        <div className="home__categories-container">
          <div className="home__categories-grid">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="category-item"
                onClick={() => handleFilterChange({ category: cat.id })}
              >
                <div className="category-item__icon">{cat.icon}</div>
                <div className="category-item__name">{cat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="home__content">
        {/* Products Section */}
        <div className="home__products-container">
          <main className="home__main">
            {/* Error Message */}
            {error && (
              <div className="home__error">
                <p>{error}</p>
                <button onClick={() => fetchProducts(1, true)} className="home__retry-button">
                  Thử lại
                </button>
              </div>
            )}

            {/* Product List - Requirement 5 */}
            <ProductList products={products} loading={loading} />

            {/* Load More Button */}
            {!loading && !error && hasMore && products.length > 0 && (
              <div className="home__load-more">
                <button onClick={handleLoadMore} className="home__load-more-button">
                  Xem thêm
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Home;
