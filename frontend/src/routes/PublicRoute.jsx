import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function PublicRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  // Hien thi trang thai tai trong luc kiem tra dang nhap
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p>Đang tải...</p>
      </div>
    );
  }

  // Chuyen ve trang chu neu da dang nhap
  if (isAuthenticated) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (user?.role === 'moderator') {
      return <Navigate to="/moderator/dashboard" replace />;
    }

    return <Navigate to="/" replace />;
  }

  // Hien thi component cong khai neu chua dang nhap
  return children;
}

export default PublicRoute;
