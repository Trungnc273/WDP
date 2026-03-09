import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from './SearchBar';

describe('SearchBar Component', () => {
  test('renders search bar with placeholder', () => {
    render(<SearchBar placeholder="Search products" />);
    
    const input = screen.getByPlaceholderText('Search products');
    expect(input).toBeInTheDocument();
  });

  test('uses default placeholder when not provided', () => {
    render(<SearchBar />);
    
    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
    expect(input).toBeInTheDocument();
  });

  test('updates input value on change', () => {
    render(<SearchBar />);
    
    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
    fireEvent.change(input, { target: { value: 'laptop' } });
    
    expect(input.value).toBe('laptop');
  });

  test('calls onSearch with trimmed value on submit', () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
    const form = input.closest('form');
    
    fireEvent.change(input, { target: { value: '  laptop  ' } });
    fireEvent.submit(form);
    
    expect(mockOnSearch).toHaveBeenCalledWith('laptop');
  });

  test('shows clear button when input has value', () => {
    render(<SearchBar />);
    
    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
    
    // Initially no clear button
    expect(screen.queryByLabelText('Xóa tìm kiếm')).not.toBeInTheDocument();
    
    // Type something
    fireEvent.change(input, { target: { value: 'laptop' } });
    
    // Clear button should appear
    expect(screen.getByLabelText('Xóa tìm kiếm')).toBeInTheDocument();
  });

  test('clears input and calls onSearch with empty string when clear button clicked', () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
    
    // Type something
    fireEvent.change(input, { target: { value: 'laptop' } });
    
    // Click clear button
    const clearButton = screen.getByLabelText('Xóa tìm kiếm');
    fireEvent.click(clearButton);
    
    expect(input.value).toBe('');
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  test('initializes with initial value', () => {
    render(<SearchBar initialValue="laptop" />);
    
    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
    expect(input.value).toBe('laptop');
  });

  test('does not call onSearch if not provided', () => {
    render(<SearchBar />);
    
    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
    const form = input.closest('form');
    
    fireEvent.change(input, { target: { value: 'laptop' } });
    
    // Should not throw error
    expect(() => fireEvent.submit(form)).not.toThrow();
  });
});
