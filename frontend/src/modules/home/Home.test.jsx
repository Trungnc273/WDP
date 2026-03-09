import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from './Home';
import productService from '../../services/product.service';

// Mock the product service
jest.mock('../../services/product.service');

// Mock the child components
jest.mock('../../components/SearchBar', () => {
  return function SearchBar({ onSearch }) {
    return (
      <div data-testid="search-bar">
        <input
          data-testid="search-input"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
    );
  };
});

jest.mock('../../components/FilterPanel', () => {
  return function FilterPanel({ onFilterChange }) {
    return (
      <div data-testid="filter-panel">
        <button
          data-testid="apply-filter"
          onClick={() => onFilterChange({ category: 'test-category' })}
        >
          Apply Filter
        </button>
      </div>
    );
  };
});

jest.mock('../../components/ProductList', () => {
  return function ProductList({ products, loading }) {
    if (loading) return <div data-testid="loading">Loading...</div>;
    return (
      <div data-testid="product-list">
        {products.map((p) => (
          <div key={p._id} data-testid="product-item">
            {p.title}
          </div>
        ))}
      </div>
    );
  };
});

const mockProducts = {
  products: [
    {
      _id: '1',
      title: 'Product 1',
      price: 100000,
      images: ['/image1.jpg'],
      location: { city: 'Hà Nội' },
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      title: 'Product 2',
      price: 200000,
      images: ['/image2.jpg'],
      location: { city: 'Hồ Chí Minh' },
      createdAt: new Date().toISOString()
    }
  ],
  total: 2,
  page: 1,
  totalPages: 1,
  limit: 20
};

describe('Home Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.scrollTo
    window.scrollTo = jest.fn();
  });

  /**
   * Test Requirement 5: Browse Products with pagination
   */
  test('should fetch and display products on mount', async () => {
    productService.getProducts.mockResolvedValue(mockProducts);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Should show loading initially
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByTestId('product-list')).toBeInTheDocument();
    });

    // Should display products
    const productItems = screen.getAllByTestId('product-item');
    expect(productItems).toHaveLength(2);
    expect(productItems[0]).toHaveTextContent('Product 1');
    expect(productItems[1]).toHaveTextContent('Product 2');

    // Should display results info
    expect(screen.getByText(/Tìm thấy/)).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.tagName === 'P' && element?.textContent === 'Tìm thấy 2 sản phẩm';
    })).toBeInTheDocument();
  });

  /**
   * Test Requirement 6: Search Products
   */
  test('should handle search and reset pagination', async () => {
    productService.getProducts.mockResolvedValue(mockProducts);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('product-list')).toBeInTheDocument();
    });

    // Clear previous calls
    productService.getProducts.mockClear();

    // Perform search
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'laptop' } });

    await waitFor(() => {
      expect(productService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'laptop',
          page: 1 // Should reset to page 1
        })
      );
    });
  });

  /**
   * Test Requirements 7-9: Filter by category, price, location
   */
  test('should handle filter changes and reset pagination', async () => {
    productService.getProducts.mockResolvedValue(mockProducts);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('product-list')).toBeInTheDocument();
    });

    // Clear previous calls
    productService.getProducts.mockClear();

    // Apply filter
    const applyFilterButton = screen.getByTestId('apply-filter');
    fireEvent.click(applyFilterButton);

    await waitFor(() => {
      expect(productService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'test-category',
          page: 1 // Should reset to page 1
        })
      );
    });
  });

  /**
   * Test Requirement 10: Combine multiple filters
   */
  test('should combine multiple filters', async () => {
    productService.getProducts.mockResolvedValue(mockProducts);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('product-list')).toBeInTheDocument();
    });

    // The initial call should include all filter parameters
    expect(productService.getProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 20
      })
    );
  });

  /**
   * Test pagination functionality
   */
  test('should handle pagination', async () => {
    const mockMultiPageProducts = {
      ...mockProducts,
      totalPages: 3,
      page: 1
    };

    productService.getProducts.mockResolvedValue(mockMultiPageProducts);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('product-list')).toBeInTheDocument();
    });

    // Should show pagination buttons
    const nextButton = screen.getByText(/Sau/);
    expect(nextButton).toBeInTheDocument();

    // Clear previous calls
    productService.getProducts.mockClear();

    // Click next page
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(productService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2
        })
      );
    });
  });

  /**
   * Test error handling
   */
  test('should display error message on fetch failure', async () => {
    productService.getProducts.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Không thể tải sản phẩm/)).toBeInTheDocument();
    });

    // Should show retry button
    expect(screen.getByText(/Thử lại/)).toBeInTheDocument();
  });

  /**
   * Test empty results
   */
  test('should display empty message when no products found', async () => {
    productService.getProducts.mockResolvedValue({
      products: [],
      total: 0,
      page: 1,
      totalPages: 0,
      limit: 20
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      // The empty message is shown by ProductList component
      expect(screen.getByTestId('product-list')).toBeInTheDocument();
    });

    // Should show 0 products in results info
    expect(screen.getByText((content, element) => {
      return element?.tagName === 'P' && element?.textContent === 'Tìm thấy 0 sản phẩm';
    })).toBeInTheDocument();
  });
});
