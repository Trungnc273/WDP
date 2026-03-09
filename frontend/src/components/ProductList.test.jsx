import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductList from './ProductList';

describe('ProductList Component', () => {
  const mockProducts = [
    {
      _id: '1',
      title: 'Product 1',
      price: 1000000,
      images: ['/uploads/test1.jpg'],
      location: { city: 'Hà Nội' },
      createdAt: new Date().toISOString(),
      seller: { fullName: 'Seller 1', isVerified: true }
    },
    {
      _id: '2',
      title: 'Product 2',
      price: 2000000,
      images: ['/uploads/test2.jpg'],
      location: { city: 'Hồ Chí Minh' },
      createdAt: new Date().toISOString(),
      seller: { fullName: 'Seller 2', isVerified: false }
    }
  ];

  test('renders loading state', () => {
    render(<ProductList products={[]} loading={true} />);
    
    expect(screen.getByText(/Đang tải sản phẩm/)).toBeInTheDocument();
  });

  test('renders empty state when no products', () => {
    render(<ProductList products={[]} loading={false} />);
    
    expect(screen.getByText(/Không tìm thấy sản phẩm nào/)).toBeInTheDocument();
    expect(screen.getByText(/Thử thay đổi bộ lọc/)).toBeInTheDocument();
  });

  test('renders product list with multiple products', () => {
    render(
      <BrowserRouter>
        <ProductList products={mockProducts} loading={false} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  test('renders correct number of product cards', () => {
    const { container } = render(
      <BrowserRouter>
        <ProductList products={mockProducts} loading={false} />
      </BrowserRouter>
    );
    
    const productCards = container.querySelectorAll('.product-card');
    expect(productCards).toHaveLength(2);
  });

  test('handles null products array', () => {
    render(<ProductList products={null} loading={false} />);
    
    expect(screen.getByText(/Không tìm thấy sản phẩm nào/)).toBeInTheDocument();
  });
});
