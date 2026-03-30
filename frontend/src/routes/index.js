import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../modules/home/Home';
import Login from '../modules/auth/Login';
import Register from '../modules/auth/Register';
import ForgotPassword from '../modules/auth/ForgotPassword';

import Profile from '../modules/profile/Profile';
import UserProfile from '../modules/profile/UserProfile';
import UserReviews from '../modules/profile/UserReviews';
import EditProfile from '../modules/profile/EditProfile';
import ChangePassword from '../modules/profile/ChangePassword';

import Favorites from '../modules/product/Favorites';
import ProductDetail from '../modules/product/ProductDetail';
import CreateProduct from '../modules/product/CreateProduct';
import EditProduct from '../modules/product/EditProduct';
import MyProducts from '../modules/product/MyProducts';

import Wallet from '../modules/wallet/Wallet';
import TopUp from '../modules/wallet/TopUp';
import TopUpResult from '../modules/wallet/TopUpResult';
import VNPaySuccess from '../modules/wallet/VNPaySuccess';
import Withdrawal from '../modules/wallet/Withdrawal';

import PurchaseRequests from '../modules/order/PurchaseRequests';
import OrderPayment from '../modules/order/OrderPayment';
import Orders from '../modules/order/Orders';
import OrderDetail from '../modules/order/OrderDetail';
import SellerOrders from '../modules/order/SellerOrders';

import Chat from '../modules/chat/Chat';

import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import AdminRoute from './AdminRoute';
import ModeratorRoute from './ModeratorRoute';
import { useAuth } from '../hooks/useAuth';


// ================= ADMIN IMPORT =================
import AdminLayout from "../modules/admin/layout/AdminLayout";
import AdminDashboard from "../modules/admin/dashboard/Dashboard";
import UserManagement from "../modules/admin/users/UserManagement";

// Admin module imports
import AdminOrderList from "../modules/admin/orders/AdminOrderList";
import AdminOrderDetail from "../modules/admin/orders/AdminOrderDetail";
import AdminReportList from "../modules/admin/reports/AdminReportList";
import AdminReportDetail from "../modules/admin/reports/AdminReportDetail";
import AdminReviewList from "../modules/admin/reviews/AdminReviewList";
import AdminWithdrawalList from "../modules/admin/withdrawals/AdminWithdrawalList";
import AdminDisputeList from "../modules/admin/disputes/AdminDisputeList";
import AdminDisputeDetail from "../modules/admin/disputes/AdminDisputeDetail";

// ================================================

// ================= IMPORT CHO MODERATOR =================
// Bố cục
import ModeratorLayout from "../modules/moderator/layout/ModeratorLayout";
import ModeratorDashboard from "../modules/moderator/dashboard/ModeratorDashboard";
import ModProfile from "../modules/moderator/profile/ModProfile";

// Báo cáo
import ModReportList from "../modules/moderator/reports/ModReportList";
import ModReportDetail from "../modules/moderator/reports/ModReportDetail";

// Đơn hàng
import ModOrderList from "../modules/moderator/orders/ModOrderList";
import ModOrderDetail from "../modules/moderator/orders/ModOrderDetail";

// Đánh giá
import ModReviewList from "../modules/moderator/reviews/ModReviewList";

// Yêu cầu rút tiền
import ModWithdrawalList from "../modules/moderator/withdrawals/ModWithdrawalList";
import ModDisputeList from "../modules/moderator/disputes/ModDisputeList";
import ModDisputeDetail from "../modules/moderator/disputes/ModDisputeDetail";
// ====================================================

function RoleLockedRoute({ children, requireAuth = false }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user?.role === 'moderator') {
    return <Navigate to="/moderator/dashboard" replace />;
  }

  return children;
}


function AppRoutes() {
  return (
    <Routes>

      {/* Route công khai - mọi người đều truy cập được */}
      <Route path="/" element={<RoleLockedRoute><Home /></RoleLockedRoute>} />
      

      {/* Route công khai - chuyển về trang chủ nếu đã đăng nhập */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />


      {/* Route bảo vệ - yêu cầu đăng nhập */}
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
      <Route path="/profile/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />


      {/* Route sản phẩm */}
      <Route path="/product/:id" element={<RoleLockedRoute><ProductDetail /></RoleLockedRoute>} />
      <Route path="/product/create" element={<RoleLockedRoute requireAuth><CreateProduct /></RoleLockedRoute>} />
      <Route path="/product/:id/edit" element={<RoleLockedRoute requireAuth><EditProduct /></RoleLockedRoute>} />
      <Route path="/my-products" element={<RoleLockedRoute requireAuth><MyProducts /></RoleLockedRoute>} />
      <Route path="/favorites" element={<RoleLockedRoute requireAuth><Favorites /></RoleLockedRoute>} />


      {/* Route ví */}
      <Route path="/wallet" element={<RoleLockedRoute requireAuth><Wallet /></RoleLockedRoute>} />
      <Route path="/wallet/topup" element={<RoleLockedRoute requireAuth><TopUp /></RoleLockedRoute>} />
      <Route path="/wallet/topup-success" element={<RoleLockedRoute requireAuth><VNPaySuccess /></RoleLockedRoute>} />
      <Route path="/wallet/topup-result" element={<RoleLockedRoute requireAuth><TopUpResult /></RoleLockedRoute>} />
      <Route path="/wallet/withdraw" element={<RoleLockedRoute requireAuth><Withdrawal /></RoleLockedRoute>} />


      {/* Route đơn hàng */}
      <Route path="/purchase-requests" element={<RoleLockedRoute requireAuth><PurchaseRequests /></RoleLockedRoute>} />
      <Route path="/seller-orders" element={<RoleLockedRoute requireAuth><SellerOrders /></RoleLockedRoute>} />
      <Route path="/orders/:id/pay" element={<RoleLockedRoute requireAuth><OrderPayment /></RoleLockedRoute>} />
      <Route path="/orders/:id" element={<RoleLockedRoute requireAuth><OrderDetail /></RoleLockedRoute>} />
      <Route path="/order-detail/:id" element={<RoleLockedRoute requireAuth><OrderDetail /></RoleLockedRoute>} />
      <Route path="/orders" element={<RoleLockedRoute requireAuth><Orders /></RoleLockedRoute>} />


      {/* Route chat */}
      <Route path="/chat" element={<RoleLockedRoute requireAuth><Chat /></RoleLockedRoute>} />
      <Route path="/chat/:conversationId" element={<RoleLockedRoute requireAuth><Chat /></RoleLockedRoute>} />



      <Route 
        path="/moderator" 
        element={
          <ModeratorRoute>
            <ModeratorLayout />
          </ModeratorRoute>
        }
      >

        {/* Mặc định khi truy cập /moderator sẽ hiển thị dashboard */}
        <Route index element={<ModeratorDashboard />} />
        <Route path="dashboard" element={<ModeratorDashboard />} />
        <Route path="profile" element={<ModProfile />} />

        {/* 1. Module Quản lý Báo cáo (Report) */}
        <Route path="reports" element={<ModReportList />} />
        <Route path="reports/:id" element={<ModReportDetail />} />

        {/* 2. Module Quản lý Đơn hàng */}
        <Route path="orders" element={<ModOrderList />} />
        <Route path="orders/:id" element={<ModOrderDetail />} />

        {/* 3. Module Quản lý Đánh giá */}
        <Route path="reviews" element={<ModReviewList />} />

        {/* 4. Module Quản lý Rút tiền */}
        <Route path="withdrawals" element={<ModWithdrawalList />} />

        {/* 5. Module Quản lý Tranh chấp */}
        <Route path="disputes" element={<ModDisputeList />} />
        <Route path="disputes/:id" element={<ModDisputeDetail />} />

      </Route>


      {/* Admin routes */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        
        {/* Admin module routes */}
        <Route path="reports" element={<AdminReportList />} />
        <Route path="reports/:id" element={<AdminReportDetail />} />
        <Route path="orders" element={<AdminOrderList />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="reviews" element={<AdminReviewList />} />
        <Route path="withdrawals" element={<AdminWithdrawalList />} />
        <Route path="disputes" element={<AdminDisputeList />} />
        <Route path="disputes/:id" element={<AdminDisputeDetail />} />
      </Route>


      {/* Route đánh giá */}
      <Route path="/user/:userId/reviews" element={<RoleLockedRoute><UserReviews /></RoleLockedRoute>} />
      <Route path="/user/:userId" element={<RoleLockedRoute><UserProfile /></RoleLockedRoute>} />

    </Routes>
  );
}

export default AppRoutes;