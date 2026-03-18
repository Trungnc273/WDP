import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from '../modules/home/Home';
import Login from '../modules/auth/Login';
import Register from '../modules/auth/Register';
import ForgotPassword from '../modules/auth/ForgotPassword';
import ResetPassword from '../modules/auth/ResetPassword';

import Profile from '../modules/profile/Profile';
import UserProfile from '../modules/profile/UserProfile';
import UserReviews from '../modules/profile/UserReviews';
import EditProfile from '../modules/profile/EditProfile';
import KYC from '../modules/profile/KYC';
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
import AdminProductList from "../modules/admin/products/AdminProductList";
import AdminWithdrawalList from "../modules/admin/withdrawals/AdminWithdrawalList";
import AdminDisputeList from "../modules/admin/disputes/AdminDisputeList";
import AdminDisputeDetail from "../modules/admin/disputes/AdminDisputeDetail";
import AdminKYCList from "../modules/admin/kyc/AdminKYCList";

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
import ModProductList from "../modules/moderator/products/ModProductList";
import ModKYCList from "../modules/moderator/kyc/ModKYCList";
// ====================================================


function AppRoutes() {
  return (
    <Routes>

      {/* Route công khai - mọi người đều truy cập được */}
      <Route path="/" element={<Home />} />
      

      {/* Route công khai - chuyển về trang chủ nếu đã đăng nhập */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />


      {/* Route bảo vệ - yêu cầu đăng nhập */}
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
      <Route path="/profile/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
      <Route path="/profile/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />


      {/* Route sản phẩm */}
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/product/create" element={<ProtectedRoute><CreateProduct /></ProtectedRoute>} />
      <Route path="/product/:id/edit" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
      <Route path="/my-products" element={<ProtectedRoute><MyProducts /></ProtectedRoute>} />
      <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />


      {/* Route ví */}
      <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
      <Route path="/wallet/topup" element={<ProtectedRoute><TopUp /></ProtectedRoute>} />
      <Route path="/wallet/topup-success" element={<ProtectedRoute><VNPaySuccess /></ProtectedRoute>} />
      <Route path="/wallet/topup-result" element={<ProtectedRoute><TopUpResult /></ProtectedRoute>} />
      <Route path="/wallet/withdraw" element={<ProtectedRoute><Withdrawal /></ProtectedRoute>} />


      {/* Route đơn hàng */}
      <Route path="/purchase-requests" element={<ProtectedRoute><PurchaseRequests /></ProtectedRoute>} />
      <Route path="/seller-orders" element={<ProtectedRoute><SellerOrders /></ProtectedRoute>} />
      <Route path="/orders/:id/pay" element={<ProtectedRoute><OrderPayment /></ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
      <Route path="/order-detail/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />


      {/* Route chat */}
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />



      <Route 
        path="/moderator" 
        element={
          <ProtectedRoute>
            <ModeratorLayout />
          </ProtectedRoute>
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

        {/* 6. Module Duyệt Sản phẩm */}
        <Route path="products" element={<ModProductList />} />

        {/* 7. Module Xác minh KYC */}
        <Route path="kyc" element={<ModKYCList />} />

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
        <Route path="products" element={<AdminProductList />} />
        <Route path="withdrawals" element={<AdminWithdrawalList />} />
        <Route path="disputes" element={<AdminDisputeList />} />
        <Route path="disputes/:id" element={<AdminDisputeDetail />} />
        <Route path="kyc" element={<AdminKYCList />} />
      </Route>


      {/* Route đánh giá */}
      <Route path="/user/:userId/reviews" element={<UserReviews />} />
      <Route path="/user/:userId" element={<UserProfile />} />

    </Routes>
  );
}

export default AppRoutes;