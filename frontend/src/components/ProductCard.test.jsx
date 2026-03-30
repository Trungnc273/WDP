import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from './ProductCard';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ProductCard Component', () => {
  const mockProduct = {
    _id: '123',
    title: 'Test Product',
    price: 1000000,
    images: ['/uploads/test.jpg'],
    location: {
      city: 'Hà Nội'
    },
    createdAt: new Date().toISOString(),
    seller: {
      fullName: 'Test Seller'
    }
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('renders product card with correct information', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/1.000.000/)).toBeInTheDocument();
    expect(screen.getByText(/Hà Nội/)).toBeInTheDocument();
  });

  test('navigates to product detail on click', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    const card = screen.getByText('Test Product').closest('.product-card');
    fireEvent.click(card);

    expect(mockNavigate).toHaveBeenCalledWith('/product/123');
  });

  test('returns null when product is not provided', () => {
    const { container } = render(
      <BrowserRouter>
        <ProductCard product={null} />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  test('formats price correctly', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    // Check that price is formatted as Vietnamese currency
    const priceElement = screen.getByText(/1.000.000/);
    expect(priceElement).toBeInTheDocument();
  });
});
