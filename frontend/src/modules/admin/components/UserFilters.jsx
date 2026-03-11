import React, { useState } from 'react';

const UserFilters = ({
  search,
  roleFilter,
  statusFilter,
  onSearch,
  onFilterChange
}) => {
  const [searchInput, setSearchInput] = useState(search);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    if (e.target.value === '') {
      onSearch('');
    }
  };

  return (
    <div className="user-filters">
      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, email, số điện thoại..."
          value={searchInput}
          onChange={handleSearchChange}
          className="search-input"
        />
        <button type="submit" className="btn btn-primary">
          Tìm kiếm
        </button>
      </form>

      <div className="filter-controls">
        <select
          value={roleFilter}
          onChange={(e) => onFilterChange('role', e.target.value)}
          className="filter-select"
        >
          <option value="">Tất cả vai trò</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="user">Người dùng</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="filter-select"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="suspended">Bị khóa</option>
        </select>

        <button
          className="btn btn-secondary"
          onClick={() => {
            setSearchInput('');
            onSearch('');
            onFilterChange('role', '');
            onFilterChange('status', '');
          }}
        >
          Xóa bộ lọc
        </button>
      </div>
    </div>
  );
};

export default UserFilters;