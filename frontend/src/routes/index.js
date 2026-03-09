import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../modules/home/Home';
import Login from '../modules/auth/Login';
import Register from '../modules/auth/Register';
import Profile from '../modules/profile/Profile';
import UserProfile from '../modules/profile/UserProfile';
import Favorites from '../modules/product/Favorites';
import ProductDetail from '../modules/product/ProductDetail';
import CreateProduct from '../modules/product/CreateProduct';
import EditProduct from '../modules/product/EditProduct';
import MyProducts from '../modules/product/MyProducts';
import Wallet from '../modules/wallet/Wallet';
import TopUp from '../modules/wallet/TopUp';
import Withdrawal from '../modules/wallet/Withdrawal';
import PurchaseRequests from '../modules/order/PurchaseRequests';
import OrderPayment from '../modules/order/OrderPayment';
import Orders from '../modules/order/Orders';
import OrderDetail from '../modules/order/OrderDetail';
import Chat from '../modules/chat/Chat';
import UserReviews from '../modules/profile/UserReviews';
import EditProfile from '../modules/profile/EditProfile';
import KYC from '../modules/profile/KYC';
import ChangePassword from '../modules/profile/ChangePassword';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

function AppRoutes() {
  return (
    <Routes>
      {/* Public route - accessible to everyone */}
      <Route path="/" element={<Home />} />
      
      {/* Public routes - redirect to home if already authenticated */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      
      {/* Protected route - requires authentication */}
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
      <Route path="/profile/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
      <Route path="/profile/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      
      {/* Product routes */}
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/product/create" element={<ProtectedRoute><CreateProduct /></ProtectedRoute>} />
      <Route path="/product/:id/edit" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
      <Route path="/my-products" element={<ProtectedRoute><MyProducts /></ProtectedRoute>} />
      <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
      
      {/* Wallet routes */}
      <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
      <Route path="/wallet/topup" element={<ProtectedRoute><TopUp /></ProtectedRoute>} />
      <Route path="/wallet/withdraw" element={<ProtectedRoute><Withdrawal /></ProtectedRoute>} />
      
      {/* Order routes */}
      <Route path="/purchase-requests" element={<ProtectedRoute><PurchaseRequests /></ProtectedRoute>} />
      <Route path="/orders/:id/pay" element={<ProtectedRoute><OrderPayment /></ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      
      {/* Chat routes */}
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      
      {/* Review routes */}
      <Route path="/user/:userId/reviews" element={<UserReviews />} />
      <Route path="/user/:userId" element={<UserProfile />} />
    </Routes>
  );
}

export default AppRoutes;
