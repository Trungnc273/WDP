const Report = require('./report.model');
const Dispute = require('./dispute.model');
const Product = require('../products/product.model');
const Order = require('../orders/order.model');
const User = require('../users/user.model');
const notificationService = require('../notifications/notification.service');

// Nguong canh bao de xu ly manh tay voi bai dang.
const PRODUCT_WARN_THRESHOLD = 3;
const USER_AUTO_SUSPEND_REPORT_THRESHOLD = 3;
const ACTIVE_ORDER_STATUSES = [
  'awaiting_seller_confirmation',
  'awaiting_payment',
  'paid',
  'shipped',
  'disputed'
];

async function hasActiveOrdersForUser(userId) {
  return Order.exists({
    status: { $in: ACTIVE_ORDER_STATUSES },
    $or: [
      { buyerId: userId },
      { sellerId: userId }
    ]
  });
}

async function tryAutoSuspendByReportThreshold(reportedUserId) {
  if (!reportedUserId) {
    return false;
  }

  const user = await User.findById(reportedUserId);
  if (!user || user.role === 'admin' || user.isSuspended) {
    return false;
  }

  const reportCount = await Report.countDocuments({
    reportedUserId,
    status: { $ne: 'dismissed' }
  });
  if (reportCount < USER_AUTO_SUSPEND_REPORT_THRESHOLD) {
    return false;
  }

  const hasActiveOrders = await hasActiveOrdersForUser(reportedUserId);
  if (hasActiveOrders) {
    return false;
  }

  user.isSuspended = true;
  user.suspendedUntil = undefined;
  user.suspendedReason = `Tài khoản bị khóa tự động do đã nhận từ ${USER_AUTO_SUSPEND_REPORT_THRESHOLD} báo cáo trở lên.`;
  user.violationCount = Math.max(Number(user.violationCount || 0), USER_AUTO_SUSPEND_REPORT_THRESHOLD);
  await user.save();
  return true;
}

// Tinh muc phat theo moc 3/6/9 canh bao.
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

// Gui thong bao cap nhat trang thai bao cao.
async function pushReportNotification(userId, title, message, reportId) {
  if (!userId) return;
  await notificationService.createNotification(userId, {
    type: 'report_update',
    title,
    message,
    reportId
  });
}

// Gui thong bao cap nhat tranh chap.
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
 * Service xu ly nghiep vu bao cao va tranh chap.
 */

/**
 * Tao bao cao san pham.
 */
async function createProductReport(reporterId, productId, reason, description, evidenceImages = []) {
  // Kiem tra du lieu dau vao.
  if (!reason || !description) {
    throw new Error('Lý do và mô tả không được để trống');
  }
  
  if (description.trim().length < 10) {
    throw new Error('Mô tả phải có ít nhất 10 ký tự');
  }
  
  // Lay san pham bi bao cao.
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Sản phẩm không tồn tại');
  }
  
  // Khong cho bao cao bai dang cua chinh minh.
  if (product.seller.toString() === reporterId.toString()) {
    throw new Error('Bạn không thể báo cáo sản phẩm của chính mình');
  }
  
  // Chan bao cao trung khi report truoc chua xu ly xong.
  const existingReport = await Report.findOne({
    reporterId: reporterId,
    productId: productId,
    status: { $in: ['pending', 'reviewing'] }
  });
  
  if (existingReport) {
    throw new Error('Bạn đã báo cáo sản phẩm này rồi');
  }
  
  // Tao ban ghi bao cao.
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
  
  // Bo sung thong tin lien quan de tra ve frontend.
  await report.populate([
    { path: 'reporterId', select: 'fullName email' },
    { path: 'reportedUserId', select: 'fullName email' },
    { path: 'productId', select: 'title price images' }
  ]);

  await tryAutoSuspendByReportThreshold(report.reportedUserId?._id || report.reportedUserId);
  
  return report;
}

/**
 * Tao bao cao nguoi dung.
 */
async function createUserReport(reporterId, reportedUserId, reason, description, evidenceImages = []) {
  // Kiem tra du lieu dau vao.
  if (!reason || !description) {
    throw new Error('Lý do và mô tả không được để trống');
  }
  
  if (description.trim().length < 10) {
    throw new Error('Mô tả phải có ít nhất 10 ký tự');
  }
  
  // Khong cho tu bao cao chinh minh.
  if (reporterId.toString() === reportedUserId.toString()) {
    throw new Error('Bạn không thể báo cáo chính mình');
  }
  
  // Xac nhan user bi bao cao ton tai.
  const reportedUser = await User.findById(reportedUserId);
  if (!reportedUser) {
    throw new Error('Người dùng không tồn tại');
  }
  
  // Tao ban ghi bao cao.
  const report = await Report.create({
    reporterId: reporterId,
    reportedUserId: reportedUserId,
    reportType: 'user',
    reason: reason,
    description: description.trim(),
    evidenceImages: evidenceImages,
    status: 'pending'
  });
  
  // Bo sung thong tin lien quan de tra ve frontend.
  await report.populate([
    { path: 'reporterId', select: 'fullName email' },
    { path: 'reportedUserId', select: 'fullName email' }
  ]);

  await tryAutoSuspendByReportThreshold(report.reportedUserId?._id || report.reportedUserId);
  
  return report;
}

/**
 * Lay danh sach bao cao theo bo loc + phan trang.
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
 * Lay chi tiet 1 bao cao.
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
 * Tao tranh chap cho don hang.
 */
async function createDispute(buyerId, orderId, reason, description, evidenceImages = []) {
  // Kiem tra du lieu dau vao.
  if (!reason || !description) {
    throw new Error('Lý do và mô tả không được để trống');
  }
  
  if (description.trim().length < 10) {
    throw new Error('Mô tả phải có ít nhất 10 ký tự');
  }
  
  if (!evidenceImages || evidenceImages.length === 0) {
    throw new Error('Vui lòng cung cấp ít nhất 1 tệp bằng chứng (ảnh hoặc video)');
  }
  
  // Lay don hang bi tranh chap.
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new Error('Đơn hàng không tồn tại');
  }
  
  // Chi buyer cua don moi duoc tao tranh chap.
  if (order.buyerId.toString() !== buyerId.toString()) {
    throw new Error('Bạn không phải người mua của đơn hàng này');
  }
  
  // Chi cho tranh chap khi don dang o trang thai da giao (shipped hoac delivered)
  if (!['shipped', 'delivered'].includes(order.status)) {
    throw new Error('Chỉ có thể khiếu nại đơn hàng đang giao hoặc đã giao đến nơi');
  }
  
  // Moi don chi duoc tao 1 tranh chap.
  const existingDispute = await Dispute.findOne({ orderId: orderId });
  if (existingDispute) {
    throw new Error('Đơn hàng này đã có khiếu nại rồi');
  }
  
  // Tao ban ghi tranh chap.
  const dispute = await Dispute.create({
    orderId: orderId,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    productId: order.productId,
    reason: reason,
    description: description.trim(),
    evidenceImages: evidenceImages,
    status: 'pending',
    disputeConversation: [
      {
        senderRole: 'buyer',
        senderId: order.buyerId,
        content: description.trim(),
        evidenceFiles: evidenceImages,
        createdAt: new Date()
      }
    ]
  });
  
  // Chuyen trang thai don sang disputed.
  order.status = 'disputed';
  await order.save();
  
  // Bo sung thong tin lien quan de tra ve frontend.
  await dispute.populate([
    { path: 'orderId', select: 'agreedAmount totalToPay status' },
    { path: 'buyerId', select: 'fullName email avatar' },
    { path: 'sellerId', select: 'fullName email avatar' },
    { path: 'productId', select: 'title price images' }
  ]);
  
  return dispute;
}

/**
 * Lay danh sach tranh chap theo bo loc + phan trang.
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
 * Lay chi tiet 1 tranh chap, kem kiem tra quyen xem.
 */
async function getDisputeById(disputeId, userId) {
  const dispute = await Dispute.findById(disputeId)
    .populate('orderId', 'agreedAmount totalToPay status')
    .populate('buyerId', 'fullName email avatar phone')
    .populate('sellerId', 'fullName email avatar phone')
    .populate('productId', 'title price images description')
    .populate('moderatorId', 'fullName email')
    .populate('disputeConversation.senderId', 'fullName email avatar');
  
  if (!dispute) {
    throw new Error('Khiếu nại không tồn tại');
  }
  
  // Chi buyer/seller/moderator/admin moi duoc xem.
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
 * Seller gui phan hoi va bang chung cho tranh chap.
 */
async function addSellerResponse(disputeId, sellerId, response, evidenceImages = []) {
  const dispute = await Dispute.findById(disputeId);
  
  if (!dispute) {
    throw new Error('Khiếu nại không tồn tại');
  }
  
  // Xac nhan dung seller cua don.
  if (dispute.sellerId.toString() !== sellerId.toString()) {
    throw new Error('Bạn không phải người bán của đơn hàng này');
  }
  
  // Chi cho gui khi moderator da chuyen sang investigating.
  if (dispute.status === 'pending') {
    throw new Error('Moderator chưa bắt đầu điều tra khiếu nại. Vui lòng đợi moderator chuyển sang giai đoạn điều tra.');
  }
  
  // Khong cho sua khi da resolved.
  if (dispute.status === 'resolved') {
    throw new Error('Khiếu nại này đã được xử lý rồi');
  }
  
  // Cap nhat noi dung phan hoi va gom them bang chung moi.
  dispute.sellerResponse = response.trim();
  if (evidenceImages?.length) {
    dispute.sellerEvidenceImages = [
      ...(dispute.sellerEvidenceImages || []),
      ...evidenceImages
    ].slice(0, 10);
  }
  dispute.sellerResponseUpdatedAt = new Date();
  dispute.disputeConversation = [
    ...(dispute.disputeConversation || []),
    {
      senderRole: 'seller',
      senderId: sellerId,
      content: response.trim(),
      evidenceFiles: evidenceImages || [],
      createdAt: dispute.sellerResponseUpdatedAt
    }
  ];
  
  // Giu nguyen status hien tai.
  await dispute.save();
  
  return dispute;
}

/**
 * Buyer bo sung ghi chu/bang chung sau khi da mo tranh chap.
 * Chi cho bo sung khi moderator da chuyen investigating.
 */
async function addBuyerFollowUp(disputeId, buyerId, note = '', evidenceImages = []) {
  const dispute = await Dispute.findById(disputeId);

  if (!dispute) {
    throw new Error('Khiếu nại không tồn tại');
  }

  if (dispute.buyerId.toString() !== buyerId.toString()) {
    throw new Error('Bạn không phải người mua của đơn hàng này');
  }

  // Chi cho bo sung khi moderator da tiep nhan dieu tra.
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
  dispute.disputeConversation = [
    ...(dispute.disputeConversation || []),
    {
      senderRole: 'buyer',
      senderId: buyerId,
      content: trimmedNote || 'Người mua gửi bổ sung bằng chứng',
      evidenceFiles: evidenceImages || [],
      createdAt: dispute.buyerFollowUpUpdatedAt
    }
  ];
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
 * Lay bao cao do user hien tai tao.
 */
async function getUserReports(userId, pagination = {}) {
  return getReports({ reporterId: userId }, pagination);
}

/**
 * Lay tranh chap cua user voi vai tro buyer.
 */
async function getUserDisputes(userId, pagination = {}) {
  return getDisputes({ buyerId: userId }, pagination);
}

/**
 * Lay toan bo bao cao (dung cho moderator/admin).
 */
async function getAllReports(filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;

  // Loai bo filter rong de query gon hon.
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
 * Xu ly bao cao theo quyet dinh moderator/admin.
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

  // Luu thong tin ket qua xu ly.
  report.status = status; // 'resolved' hoặc 'dismissed'
  report.moderatorDecision = decision; // 'remove_content', 'warn_user', 'ban_user'
  report.moderatorNotes = notes;
  report.moderatorReply = reply;
  report.moderatorReplyToReportedUser = replyToReportedUser;
  report.moderatorId = moderatorId;
  report.resolvedAt = new Date();

  // Ap dung hanh dong nghiep vu khi da resolved.
  if (status === 'resolved' && decision === 'remove_content' && report.productId) {
    // Goi bai dang vi pham.
    const product = await Product.findById(report.productId);
    if (product) {
      product.status = 'rejected'; // Goi bai dang khoi hien thi.
      await product.save();
    }
  } else if (status === 'resolved' && decision === 'warn_user' && report.reportedUserId) {
    // Tang canh bao user, khoa theo moc 3/6/9.
    const user = await User.findById(report.reportedUserId);
    if (user) {
      const nextWarningCount = Number(user.violationCount || 0) + 1;
      const penalty = getReportWarningPenalty(nextWarningCount);

      user.violationCount = nextWarningCount;
      if (penalty.shouldSuspendNow) {
        const hasActiveOrders = await hasActiveOrdersForUser(user._id);
        if (!hasActiveOrders) {
          user.isSuspended = true;
          const suspendUntil = new Date();
          suspendUntil.setTime(suspendUntil.getTime() + penalty.durationMs);
          user.suspendedUntil = suspendUntil;
          user.suspendedReason = `Tài khoản bị khóa do vi phạm từ báo cáo ở mốc ${nextWarningCount} cảnh báo (mức ${penalty.level}) trong ${penalty.label}.`;
        }
      }
      await user.save();
    }

    // Neu san pham bi warn du nguong thi tu dong go bai.
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
    // Khoa tai khoan truc tiep.
    const user = await User.findById(report.reportedUserId);
    if (user) {
      const hasActiveOrders = await hasActiveOrdersForUser(user._id);
      if (hasActiveOrders) {
        throw new Error('Không thể khóa tài khoản khi người dùng đang có đơn hàng đang xử lý');
      }
      user.isSuspended = true; // Khóa tài khoản
      user.suspendedReason = notes || 'Tài khoản bị khóa trực tiếp theo quyết định ban_user của moderator.';
      await user.save();
    }
  }

  await report.save();

  // Gui thong bao cho nguoi report.
  if (report.reporterId) {
    const reporterMessage = reply || 'Báo cáo của bạn đã được moderator xử lý.';
    await pushReportNotification(
      report.reporterId,
      'Cập nhật báo cáo',
      reporterMessage,
      report._id
    );
  }

  // Gui thong bao cho nguoi bi report.
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
 * Lay tranh chap theo orderId, kem kiem tra quyen truy cap.
 */
async function getDisputeByOrderId(orderId, userId) {
  const dispute = await Dispute.findOne({ orderId })
    .populate('orderId', 'agreedAmount totalToPay status')
    .populate('buyerId', 'fullName email avatar phone')
    .populate('sellerId', 'fullName email avatar phone')
    .populate('productId', 'title price images description')
    .populate('moderatorId', 'fullName email');

  if (!dispute) {
    return null;
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
 * Seller xac nhan da nhan lai hang trong luong return_request.
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
