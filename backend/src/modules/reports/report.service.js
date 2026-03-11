const Report = require('./report.model');
const Dispute = require('./dispute.model');
const Product = require('../products/product.model');
const Order = require('../orders/order.model');
const User = require('../users/user.model');

/**
 * Report & Dispute Service
 * Handles product reports and order disputes
 */

/**
 * Create a product report
 */
async function createProductReport(reporterId, productId, reason, description, evidenceImages = []) {
  // Validate inputs
  if (!reason || !description) {
    throw new Error('Lý do và mô tả không được để trống');
  }
  
  if (description.trim().length < 10) {
    throw new Error('Mô tả phải có ít nhất 10 ký tự');
  }
  
  // Get product
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Sản phẩm không tồn tại');
  }
  
  // Check if reporter is trying to report their own product
  if (product.seller.toString() === reporterId.toString()) {
    throw new Error('Bạn không thể báo cáo sản phẩm của chính mình');
  }
  
  // Check if user already reported this product
  const existingReport = await Report.findOne({
    reporterId: reporterId,
    productId: productId,
    status: { $in: ['pending', 'reviewing'] }
  });
  
  if (existingReport) {
    throw new Error('Bạn đã báo cáo sản phẩm này rồi');
  }
  
  // Create report
  const report = await Report.create({
    reporterId: reporterId,
    reportedUserId: product.seller,
    productId: productId,
    reportType: 'product',
    reason: reason,
    description: description.trim(),
    evidenceImages: evidenceImages,
    status: 'pending'
  });
  
  // Populate details
  await report.populate([
    { path: 'reporterId', select: 'fullName email' },
    { path: 'reportedUserId', select: 'fullName email' },
    { path: 'productId', select: 'title price images' }
  ]);
  
  return report;
}

/**
 * Create a user report
 */
async function createUserReport(reporterId, reportedUserId, reason, description, evidenceImages = []) {
  // Validate inputs
  if (!reason || !description) {
    throw new Error('Lý do và mô tả không được để trống');
  }
  
  if (description.trim().length < 10) {
    throw new Error('Mô tả phải có ít nhất 10 ký tự');
  }
  
  // Check if reporter is trying to report themselves
  if (reporterId.toString() === reportedUserId.toString()) {
    throw new Error('Bạn không thể báo cáo chính mình');
  }
  
  // Check if reported user exists
  const reportedUser = await User.findById(reportedUserId);
  if (!reportedUser) {
    throw new Error('Người dùng không tồn tại');
  }
  
  // Create report
  const report = await Report.create({
    reporterId: reporterId,
    reportedUserId: reportedUserId,
    reportType: 'user',
    reason: reason,
    description: description.trim(),
    evidenceImages: evidenceImages,
    status: 'pending'
  });
  
  // Populate details
  await report.populate([
    { path: 'reporterId', select: 'fullName email' },
    { path: 'reportedUserId', select: 'fullName email' }
  ]);
  
  return report;
}

/**
 * Get reports
 */
async function getReports(filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;
  
  const query = {};
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.reportType) {
    query.reportType = filters.reportType;
  }
  
  if (filters.reporterId) {
    query.reporterId = filters.reporterId;
  }
  
  if (filters.reportedUserId) {
    query.reportedUserId = filters.reportedUserId;
  }
  
  const reports = await Report.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('reporterId', 'fullName email avatar')
    .populate('reportedUserId', 'fullName email avatar')
    .populate('productId', 'title price images status');
  
  const total = await Report.countDocuments(query);
  
  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get report by ID
 */
async function getReportById(reportId) {
  const report = await Report.findById(reportId)
    .populate('reporterId', 'fullName email avatar')
    .populate('reportedUserId', 'fullName email avatar')
    .populate('productId', 'title price images status description')
    .populate('moderatorId', 'fullName email');
  
  if (!report) {
    throw new Error('Báo cáo không tồn tại');
  }
  
  return report;
}

/**
 * Create a dispute (order issue)
 */
async function createDispute(buyerId, orderId, reason, description, evidenceImages = []) {
  // Validate inputs
  if (!reason || !description) {
    throw new Error('Lý do và mô tả không được để trống');
  }
  
  if (description.trim().length < 10) {
    throw new Error('Mô tả phải có ít nhất 10 ký tự');
  }
  
  if (!evidenceImages || evidenceImages.length === 0) {
    throw new Error('Vui lòng cung cấp ít nhất 1 ảnh bằng chứng');
  }
  
  // Get order
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new Error('Đơn hàng không tồn tại');
  }
  
  // Verify buyer
  if (order.buyerId.toString() !== buyerId.toString()) {
    throw new Error('Bạn không phải người mua của đơn hàng này');
  }
  
  // Check order status (can only dispute shipped orders)
  if (order.status !== 'shipped') {
    throw new Error('Chỉ có thể khiếu nại đơn hàng đã được giao');
  }
  
  // Check if dispute already exists
  const existingDispute = await Dispute.findOne({ orderId: orderId });
  if (existingDispute) {
    throw new Error('Đơn hàng này đã có khiếu nại rồi');
  }
  
  // Create dispute
  const dispute = await Dispute.create({
    orderId: orderId,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    productId: order.productId,
    reason: reason,
    description: description.trim(),
    evidenceImages: evidenceImages,
    status: 'pending'
  });
  
  // Update order status to disputed
  order.status = 'disputed';
  await order.save();
  
  // Populate details
  await dispute.populate([
    { path: 'orderId', select: 'agreedAmount totalToPay status' },
    { path: 'buyerId', select: 'fullName email avatar' },
    { path: 'sellerId', select: 'fullName email avatar' },
    { path: 'productId', select: 'title price images' }
  ]);
  
  return dispute;
}

/**
 * Get disputes
 */
async function getDisputes(filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;
  
  const query = {};
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.buyerId) {
    query.buyerId = filters.buyerId;
  }
  
  if (filters.sellerId) {
    query.sellerId = filters.sellerId;
  }
  
  const disputes = await Dispute.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('orderId', 'agreedAmount totalToPay status')
    .populate('buyerId', 'fullName email avatar')
    .populate('sellerId', 'fullName email avatar')
    .populate('productId', 'title price images');
  
  const total = await Dispute.countDocuments(query);
  
  return {
    disputes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get dispute by ID
 */
async function getDisputeById(disputeId, userId) {
  const dispute = await Dispute.findById(disputeId)
    .populate('orderId', 'agreedAmount totalToPay status')
    .populate('buyerId', 'fullName email avatar phone')
    .populate('sellerId', 'fullName email avatar phone')
    .populate('productId', 'title price images description')
    .populate('moderatorId', 'fullName email');
  
  if (!dispute) {
    throw new Error('Khiếu nại không tồn tại');
  }
  
  // Check authorization (buyer, seller, or moderator only)
  if (userId) {
    const user = await User.findById(userId);
    const isAuthorized = 
      dispute.buyerId._id.toString() === userId.toString() ||
      dispute.sellerId._id.toString() === userId.toString() ||
      user.role === 'moderator' ||
      user.role === 'admin';
    
    if (!isAuthorized) {
      throw new Error('Bạn không có quyền xem khiếu nại này');
    }
  }
  
  return dispute;
}

/**
 * Add seller response to dispute
 */
async function addSellerResponse(disputeId, sellerId, response, evidenceImages = []) {
  const dispute = await Dispute.findById(disputeId);
  
  if (!dispute) {
    throw new Error('Khiếu nại không tồn tại');
  }
  
  // Verify seller
  if (dispute.sellerId.toString() !== sellerId.toString()) {
    throw new Error('Bạn không phải người bán của đơn hàng này');
  }
  
  // Check if dispute is still pending
  if (dispute.status !== 'pending') {
    throw new Error('Khiếu nại này đã được xử lý rồi');
  }
  
  // Update dispute
  dispute.sellerResponse = response.trim();
  dispute.sellerEvidenceImages = evidenceImages;
  dispute.status = 'investigating';
  dispute.investigatingAt = new Date();
  await dispute.save();
  
  return dispute;
}

/**
 * Get user's reports
 */
async function getUserReports(userId, pagination = {}) {
  return getReports({ reporterId: userId }, pagination);
}

/**
 * Get user's disputes (as buyer)
 */
async function getUserDisputes(userId, pagination = {}) {
  return getDisputes({ buyerId: userId }, pagination);
}

/**
 * Lấy toàn bộ danh sách báo cáo (Dành cho Moderator/Admin)
 */
async function getAllReports(filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;

  // Lọc bỏ các filter không có giá trị (undefined)
  Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

  const reports = await Report.find(filters)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('reporterId', 'fullName email avatar')
    .populate('reportedUserId', 'fullName email avatar')
    .populate('productId', 'title images');

  const total = await Report.countDocuments(filters);

  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Xử lý báo cáo: Khóa user, xóa bài... (Dành cho Moderator/Admin)
 */
async function resolveReport(reportId, moderatorId, status, decision, notes, reply = '') {
  const report = await Report.findById(reportId);
  
  if (!report) {
    throw new Error('Báo cáo không tồn tại');
  }

  if (report.status === 'resolved' || report.status === 'dismissed') {
    throw new Error('Báo cáo này đã được xử lý trước đó rồi');
  }

  // Cập nhật thông tin xử lý vào database
  report.status = status; // 'resolved' hoặc 'dismissed'
  report.moderatorDecision = decision; // 'remove_content', 'warn_user', 'ban_user'
  report.moderatorNotes = notes;
  report.moderatorReply = reply;
  report.moderatorId = moderatorId;
  report.resolvedAt = new Date();

  // THỰC THI QUYẾT ĐỊNH CỦA MODERATOR (chỉ khi đánh dấu resolved)
  if (status === 'resolved' && decision === 'remove_content' && report.productId) {
    // Nếu quyết định là xóa nội dung vi phạm
    const product = await Product.findById(report.productId);
    if (product) {
      product.status = 'rejected'; // Chuyển trạng thái sản phẩm thành bị từ chối/ẩn
      await product.save();
    }
  } else if (status === 'resolved' && decision === 'warn_user' && report.reportedUserId) {
    // Cảnh báo người dùng: tăng vi phạm, đủ 3 lần thì khóa tài khoản
    const user = await User.findById(report.reportedUserId);
    if (user) {
      user.violationCount = (user.violationCount || 0) + 1;
      if (user.violationCount >= 3) {
        user.isSuspended = true;
        const suspendUntil = new Date();
        suspendUntil.setDate(suspendUntil.getDate() + 30);
        user.suspendedUntil = suspendUntil;
      }
      await user.save();
    }
  } else if (status === 'resolved' && decision === 'ban_user' && report.reportedUserId) {
    // Nếu quyết định là khóa tài khoản người vi phạm
    const user = await User.findById(report.reportedUserId);
    if (user) {
      user.isSuspended = true; // Khóa tài khoản
      await user.save();
    }
  }

  await report.save();
  return report;
}

module.exports = {
  createProductReport,
  createUserReport,
  getReports,
  getReportById,
  createDispute,
  getDisputes,
  getDisputeById,
  addSellerResponse,
  getUserReports,
  getUserDisputes,
  getAllReports,   
  resolveReport   
};
