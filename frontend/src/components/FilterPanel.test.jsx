import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FilterPanel from './FilterPanel';
import api from '../services/api';

// Mock the api module
jest.mock('../services/api');

describe('FilterPanel Component', () => {
  const mockCategories = [
    { _id: '1', name: 'Điện tử' },
    { _id: '2', name: 'Thời trang' },
    { _id: '3', name: 'Đồ gia dụng' }
  ];

  beforeEach(() => {
    // Mock successful API call
    api.get.mockResolvedValue({
      data: { data: mockCategories }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders filter panel with header', () => {
    render(<FilterPanel />);
    
    expect(screen.getByText('Bộ lọc')).toBeInTheDocument();
  });

  test('fetches and displays categories', async () => {
    render(<FilterPanel />);
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/categories');
    });
    
    // Expand the panel to see categories
    const toggleButton = screen.getByRole('button', { name: /▼/ });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Điện tử')).toBeInTheDocument();
      expect(screen.getByText('Thời trang')).toBeInTheDocument();
    });
  });

  test('toggles panel expansion', () => {
    render(<FilterPanel />);
    
    const toggleButton = screen.getByRole('button', { name: /▼/ });
    const content = document.querySelector('.filter-panel__content');
    
    // Initially not expanded
    expect(content).not.toHaveClass('expanded');
    
    // Click to expand
    fireEvent.click(toggleButton);
    expect(content).toHaveClass('expanded');
    
    // Click to collapse
    fireEvent.click(toggleButton);
    expect(content).not.toHaveClass('expanded');
  });

  test('calls onFilterChange with correct values when apply button clicked', async () => {
    const mockOnFilterChange = jest.fn();
    render(<FilterPanel onFilterChange={mockOnFilterChange} />);
    
    // Expand panel
    const toggleButton = screen.getByRole('button', { name: /▼/ });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Điện tử')).toBeInTheDocument();
    });
    
    // Select category
    const categorySelect = screen.getByLabelText(/danh mục/i);
    fireEvent.change(categorySelect, { target: { value: '1' } });
    
    // Set price range
    const minPriceInput = screen.getByLabelText(/giá tối thiểu/i);
    const maxPriceInput = screen.getByLabelText(/giá tối đa/i);
    fireEvent.change(minPriceInput, { target: { value: '100000' } });
    fireEvent.change(maxPriceInput, { target: { value: '500000' } });
    
    // Select city
    const citySelect = screen.getByLabelText(/khu vực/i);
    fireEvent.change(citySelect, { target: { value: 'Hà Nội' } });
    
    // Click apply
    const applyButton = screen.getByText('Áp dụng');
    fireEvent.click(applyButton);
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      category: '1',
      minPrice: 100000,
      maxPrice: 500000,
      city: 'Hà Nội'
    });
  });

  test('clears all filters when clear button clicked', async () => {
    const mockOnFilterChange = jest.fn();
    render(<FilterPanel onFilterChange={mockOnFilterChange} />);
    
    // Expand panel
    const toggleButton = screen.getByRole('button', { name: /▼/ });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Điện tử')).toBeInTheDocument();
    });
    
    // Set some filters
    const categorySelect = screen.getByLabelText(/danh mục/i);
    fireEvent.change(categorySelect, { target: { value: '1' } });
    
    const minPriceInput = screen.getByLabelText(/giá tối thiểu/i);
    fireEvent.change(minPriceInput, { target: { value: '100000' } });
    
    // Clear button should appear
    const clearButton = screen.getByText('Xóa bộ lọc');
    fireEvent.click(clearButton);
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      category: null,
      minPrice: null,
      maxPrice: null,
      city: null
    });
    
    // Check inputs are cleared
    expect(categorySelect.value).toBe('');
    expect(minPriceInput.value).toBe('');
  });

  test('shows clear button only when filters are active', async () => {
    render(<FilterPanel />);
    
    // Expand panel
    const toggleButton = screen.getByRole('button', { name: /▼/ });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Điện tử')).toBeInTheDocument();
    });
    
    // Initially no clear button
    expect(screen.queryByText(/xóa bộ lọc/i)).not.toBeInTheDocument();
    
    // Set a filter
    const categorySelect = screen.getByLabelText(/danh mục/i);
    fireEvent.change(categorySelect, { target: { value: '1' } });
    
    // Clear button should appear
    expect(screen.getByText(/xóa bộ lọc/i)).toBeInTheDocument();
  });

  test('initializes with initial filters', async () => {
    const initialFilters = {
      category: '1',
      minPrice: 100000,
      maxPrice: 500000,
      city: 'Hà Nội'
    };
    
    render(<FilterPanel initialFilters={initialFilters} />);
    
    // Expand panel
    const toggleButton = screen.getByRole('button', { name: /▼/ });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Điện tử')).toBeInTheDocument();
    });
    
    const categorySelect = screen.getByLabelText(/danh mục/i);
    const minPriceInput = screen.getByLabelText(/giá tối thiểu/i);
    const maxPriceInput = screen.getByLabelText(/giá tối đa/i);
    const citySelect = screen.getByLabelText(/khu vực/i);
    
    expect(categorySelect.value).toBe('1');
    expect(minPriceInput.value).toBe('100000');
    expect(maxPriceInput.value).toBe('500000');
    expect(citySelect.value).toBe('Hà Nội');
  });

  test('handles API error gracefully', async () => {
    // Mock API error
    api.get.mockRejectedValue(new Error('Network error'));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<FilterPanel />);
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching categories:',
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });
});
