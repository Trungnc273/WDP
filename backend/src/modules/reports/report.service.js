const Report = require('./report.model');
const Dispute = require('./dispute.model');
const Product = require('../products/product.model');
const Order = require('../orders/order.model');
const User = require('../users/user.model');
const notificationService = require('../notifications/notification.service');

const PRODUCT_WARN_THRESHOLD = 3;

function getReportWarningPenalty(nextWarningCount) {
  if (nextWarningCount <= 0 || nextWarningCount % 3 !== 0) {
    return {
      shouldSuspendNow: false,
      level: Math.floor(Math.max(0, nextWarningCount) / 3),
      durationMs: 0,
      label: ''
    };
  }

  const level = Math.floor(nextWarningCount / 3);
  if (level === 1) {
    return {
      shouldSuspendNow: true,
      level,
      durationMs: 24 * 60 * 60 * 1000,
      label: '24 giờ'
    };
  }

  if (level === 2) {
    return {
      shouldSuspendNow: true,
      level,
      durationMs: 7 * 24 * 60 * 60 * 1000,
      label: '1 tuần'
    };
  }

  return {
    shouldSuspendNow: true,
    level: Math.min(level, 3),
    durationMs: 365 * 24 * 60 * 60 * 1000,
    label: '1 năm'
  };
}

async function pushReportNotification(userId, title, message, reportId) {
  if (!userId) return;
  await notificationService.createNotification(userId, {
    type: 'report_update',
    title,
    message,
    reportId
  });
}

async function pushDisputeNotification(userId, title, message, disputeId) {
  if (!userId) return;
  await notificationService.createNotification(userId, {
    type: 'dispute_update',
    title,
    message,
    disputeId
  });
}

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
    throw new Error('Vui lòng cung cấp ít nhất 1 tệp bằng chứng (ảnh hoặc video)');
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
  
  // Seller can ONLY provide evidence when moderator has moved dispute to 'investigating'
  // (Must wait for moderator to explicitly approve investigation)
  if (dispute.status === 'pending') {
    throw new Error('Moderator chưa bắt đầu điều tra khiếu nại. Vui lòng đợi moderator chuyển sang giai đoạn điều tra.');
  }
  
  // Cannot provide evidence if already resolved
  if (dispute.status === 'resolved') {
    throw new Error('Khiếu nại này đã được xử lý rồi');
  }
  
  // Update dispute (status should already be 'investigating' from moderator action)
  dispute.sellerResponse = response.trim();
  if (evidenceImages?.length) {
    dispute.sellerEvidenceImages = [
      ...(dispute.sellerEvidenceImages || []),
      ...evidenceImages
    ].slice(0, 10);
  }
  
  // Keep existing status (don't auto-transition)
  await dispute.save();
  
  return dispute;
}

/**
 * Buyer adds follow-up evidence/notes to an existing dispute.
 * Can only be done AFTER moderator has moved dispute to 'investigating' status.
 */
async function addBuyerFollowUp(disputeId, buyerId, note = '', evidenceImages = []) {
  const dispute = await Dispute.findById(disputeId);

  if (!dispute) {
    throw new Error('Khiếu nại không tồn tại');
  }

  if (dispute.buyerId.toString() !== buyerId.toString()) {
    throw new Error('Bạn không phải người mua của đơn hàng này');
  }

  // Buyer can ONLY provide follow-up evidence when moderator has moved to 'investigating'
  if (dispute.status === 'pending') {
    throw new Error('Moderator chưa bắt đầu điều tra. Vui lòng đợi moderator xác nhận để gửi bằng chứng bổ sung.');
  }

  if (dispute.status === 'resolved') {
    throw new Error('Khiếu nại này đã được xử lý rồi');
  }

  const trimmedNote = String(note || '').trim();
  if (!trimmedNote && (!evidenceImages || evidenceImages.length === 0)) {
    throw new Error('Vui lòng nhập ghi chú hoặc tải lên ít nhất 1 tệp bằng chứng');
  }

  if (trimmedNote) {
    dispute.buyerFollowUpNote = trimmedNote;
  }

  if (evidenceImages?.length) {
    dispute.buyerAdditionalEvidenceImages = [
      ...(dispute.buyerAdditionalEvidenceImages || []),
      ...evidenceImages
    ].slice(0, 10);
  }

  dispute.buyerFollowUpUpdatedAt = new Date();
  await dispute.save();

  if (dispute.moderatorId) {
    await pushDisputeNotification(
      dispute.moderatorId,
      'Người mua bổ sung bằng chứng',
      'Người mua vừa bổ sung ghi chú hoặc bằng chứng mới cho tranh chấp đang xử lý.',
      dispute._id
    );
  }

  return getDisputeById(disputeId, buyerId);
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
async function resolveReport(
  reportId,
  moderatorId,
  status,
  decision,
  notes,
  reply = '',
  replyToReportedUser = ''
) {
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
  report.moderatorReplyToReportedUser = replyToReportedUser;
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
    // Cảnh báo người dùng: chỉ khóa ở các mốc 3/6/9, tăng dần 24h/1 tuần/1 năm.
    const user = await User.findById(report.reportedUserId);
    if (user) {
      const nextWarningCount = Number(user.violationCount || 0) + 1;
      const penalty = getReportWarningPenalty(nextWarningCount);

      user.violationCount = nextWarningCount;
      if (penalty.shouldSuspendNow) {
        user.isSuspended = true;
        const suspendUntil = new Date();
        suspendUntil.setTime(suspendUntil.getTime() + penalty.durationMs);
        user.suspendedUntil = suspendUntil;
        user.suspendedReason = `Tài khoản bị khóa do vi phạm từ báo cáo ở mốc ${nextWarningCount} cảnh báo (mức ${penalty.level}) trong ${penalty.label}.`;
      }
      await user.save();
    }

    // Nếu là báo cáo sản phẩm và đã bị cảnh báo đủ ngưỡng thì tự động gỡ bài.
    if (report.productId) {
      const warnResolvedCount = await Report.countDocuments({
        productId: report.productId,
        status: 'resolved',
        moderatorDecision: 'warn_user'
      });

      if (warnResolvedCount >= PRODUCT_WARN_THRESHOLD) {
        const product = await Product.findById(report.productId);
        if (product && !['rejected', 'hidden', 'deleted'].includes(product.status)) {
          product.status = 'rejected';
          await product.save();
        }
      }
    }
  } else if (status === 'resolved' && decision === 'ban_user' && report.reportedUserId) {
    // Nếu quyết định là khóa tài khoản người vi phạm
    const user = await User.findById(report.reportedUserId);
    if (user) {
      user.isSuspended = true; // Khóa tài khoản
      user.suspendedReason = notes || 'Tài khoản bị khóa trực tiếp theo quyết định ban_user của moderator.';
      await user.save();
    }
  }

  await report.save();

  // Gửi thông báo cho người tố cáo.
  if (report.reporterId) {
    const reporterMessage = reply || 'Báo cáo của bạn đã được moderator xử lý.';
    await pushReportNotification(
      report.reporterId,
      'Cập nhật báo cáo',
      reporterMessage,
      report._id
    );
  }

  // Gửi thông báo cho người bị báo cáo.
  if (report.reportedUserId) {
    const reportedMessage = replyToReportedUser || 'Bạn có cập nhật mới liên quan đến một báo cáo vi phạm.';
    await pushReportNotification(
      report.reportedUserId,
      'Thông báo xử lý báo cáo',
      reportedMessage,
      report._id
    );
  }

  return report;
}

/**
 * Get dispute by order ID (accessible to buyer, seller, mod, admin)
 */
async function getDisputeByOrderId(orderId, userId) {
  const dispute = await Dispute.findOne({ orderId })
    .populate('orderId', 'agreedAmount totalToPay status')
    .populate('buyerId', 'fullName email avatar phone')
    .populate('sellerId', 'fullName email avatar phone')
    .populate('productId', 'title price images description')
    .populate('moderatorId', 'fullName email');

  if (!dispute) {
    throw new Error('Không tìm thấy khiếu nại cho đơn hàng này');
  }

  if (userId) {
    const user = await User.findById(userId);
    const isAuthorized =
      dispute.buyerId._id.toString() === userId.toString() ||
      dispute.sellerId._id.toString() === userId.toString() ||
      (user && (user.role === 'moderator' || user.role === 'admin'));
    if (!isAuthorized) {
      throw new Error('Bạn không có quyền xem khiếu nại này');
    }
  }

  return dispute;
}

/**
 * Seller confirms they have received the returned item (Th3 return flow)
 */
async function confirmSellerReturn(disputeId, sellerId) {
  const dispute = await Dispute.findById(disputeId);
  if (!dispute) throw new Error('Khiếu nại không tồn tại');
  if (dispute.sellerId.toString() !== sellerId.toString())
    throw new Error('Bạn không phải người bán của đơn hàng này');
  if (dispute.reason !== 'return_request')
    throw new Error('Chỉ áp dụng cho yêu cầu hoàn hàng');
  if (dispute.status !== 'investigating')
    throw new Error('Chỉ xác nhận khi tranh chấp đang trong giai đoạn điều tra');
  if (dispute.sellerConfirmedReturnAt)
    throw new Error('Đã xác nhận nhận lại hàng trước đó');

  dispute.sellerConfirmedReturnAt = new Date();
  await dispute.save();
  return dispute;
}

module.exports = {
  createProductReport,
  createUserReport,
  getReports,
  getReportById,
  createDispute,
  getDisputes,
  getDisputeById,
  getDisputeByOrderId,
  addSellerResponse,
  addBuyerFollowUp,
  confirmSellerReturn,
  getUserReports,
  getUserDisputes,
  getAllReports,
  resolveReport
};
