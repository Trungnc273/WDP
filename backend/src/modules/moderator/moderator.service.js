const mongoose = require("mongoose");

const Product = require("../products/product.model");
const User = require("../users/user.model");
const Report = require("../reports/report.model");
const Order = require("../orders/order.model");
const Review = require("../reports/review.model");
const Dispute = require("../reports/dispute.model");
const Transaction = require("../payments/transaction.model");
const reviewService = require("../reports/review.service");
const reportService = require("../reports/report.service");
const orderService = require("../orders/order.service");
const escrowService = require("../payments/escrow.service");
const EscrowHold = require("../payments/escrow-hold.model");
const walletService = require("../payments/wallet.service");
const notificationService = require("../notifications/notification.service");

// Luồng trạng thái đơn hàng cho moderator: chỉ đi tới trước, không cho quay ngược.
const MODERATOR_ORDER_TRANSITIONS = {
  awaiting_seller_confirmation: ["cancelled"],
  awaiting_payment: ["cancelled"],
  paid: ["shipped", "disputed", "cancelled"],
  shipped: ["completed", "disputed"],
  disputed: ["completed", "cancelled"],
  completed: [],
  cancelled: []
};

function getAllowedNextStatuses(currentStatus) {
  return MODERATOR_ORDER_TRANSITIONS[currentStatus] || [];
}

function parsePagination(pagination = {}) {
  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildRegexKeyword(keyword) {
  if (!keyword || typeof keyword !== "string") return null;
  return new RegExp(keyword.trim(), "i");
}

async function buildReportedUserStatsMap(reportedUserIds = []) {
  const uniqueIds = Array.from(
    new Set(
      reportedUserIds
        .filter(Boolean)
        .map((id) => String(id))
    )
  );

  if (!uniqueIds.length) {
    return {};
  }

  const objectIds = uniqueIds.map((id) => new mongoose.Types.ObjectId(id));

  const [reportCountAgg, users] = await Promise.all([
    Report.aggregate([
      { $match: { reportedUserId: { $in: objectIds } } },
      { $group: { _id: "$reportedUserId", totalReports: { $sum: 1 } } }
    ]),
    User.find({ _id: { $in: objectIds } })
      .select("_id violationCount isSuspended suspendedUntil")
      .lean()
  ]);

  const reportCountMap = reportCountAgg.reduce((acc, item) => {
    acc[String(item._id)] = item.totalReports || 0;
    return acc;
  }, {});

  const userMap = users.reduce((acc, user) => {
    acc[String(user._id)] = user;
    return acc;
  }, {});

  return uniqueIds.reduce((acc, id) => {
    const user = userMap[id] || {};
    const warningCount = Number(user.violationCount || 0);

    acc[id] = {
      warningCount,
      totalReports: Number(reportCountMap[id] || 0),
      isSuspended: Boolean(user.isSuspended),
      suspendedUntil: user.suspendedUntil || null,
      shouldLockAccount: warningCount > 0 && warningCount % 3 === 0
    };
    return acc;
  }, {});
}

async function buildProductStatsMap(productIds = []) {
  const uniqueIds = Array.from(
    new Set(
      productIds
        .filter(Boolean)
        .map((id) => String(id))
    )
  );

  if (!uniqueIds.length) {
    return {};
  }

  const objectIds = uniqueIds.map((id) => new mongoose.Types.ObjectId(id));

  const [reportCountAgg, warnResolvedAgg, products] = await Promise.all([
    Report.aggregate([
      { $match: { productId: { $in: objectIds } } },
      { $group: { _id: "$productId", totalReports: { $sum: 1 } } }
    ]),
    Report.aggregate([
      {
        $match: {
          productId: { $in: objectIds },
          status: 'resolved',
          moderatorDecision: 'warn_user'
        }
      },
      { $group: { _id: "$productId", warningActions: { $sum: 1 } } }
    ]),
    Product.find({ _id: { $in: objectIds } })
      .select('_id status')
      .lean()
  ]);

  const totalReportMap = reportCountAgg.reduce((acc, item) => {
    acc[String(item._id)] = Number(item.totalReports || 0);
    return acc;
  }, {});

  const warningMap = warnResolvedAgg.reduce((acc, item) => {
    acc[String(item._id)] = Number(item.warningActions || 0);
    return acc;
  }, {});

  const productMap = products.reduce((acc, product) => {
    acc[String(product._id)] = product;
    return acc;
  }, {});

  return uniqueIds.reduce((acc, id) => {
    const product = productMap[id] || {};
    const warningActions = Number(warningMap[id] || 0);

    acc[id] = {
      totalReports: Number(totalReportMap[id] || 0),
      warningActions,
      shouldRemoveContent: warningActions >= 3,
      isRemoved: ['rejected', 'hidden', 'deleted'].includes(product.status),
      currentStatus: product.status || 'unknown'
    };

    return acc;
  }, {});
}

async function attachReportedUserStats(reports = []) {
  const ids = reports
    .map((report) => report?.reportedUserId?._id || report?.reportedUserId)
    .filter(Boolean);

  const statsMap = await buildReportedUserStatsMap(ids);
  const productIds = reports
    .map((report) => report?.productId?._id || report?.productId)
    .filter(Boolean);
  const productStatsMap = await buildProductStatsMap(productIds);

  return reports.map((report) => {
    const userId = String(report?.reportedUserId?._id || report?.reportedUserId || "");
    const productId = String(report?.productId?._id || report?.productId || "");
    return {
      ...report,
      reportedUserStats: userId ? (statsMap[userId] || null) : null,
      productStats: productId ? (productStatsMap[productId] || null) : null
    };
  });
}

async function getDashboardStats() {
  const [
    pendingReports,
    reviewingReports,
    unresolvedReports,
    pendingWithdrawals,
    reportedReviews,
    openOrders,
    suspendedUsers,
    pendingDisputes,
    pendingProducts,
    pendingKYC,
    recentReports
  ] = await Promise.all([
    Report.countDocuments({ status: "pending" }),
    Report.countDocuments({ status: "reviewing" }),
    Report.countDocuments({ status: { $in: ["pending", "reviewing"] } }),
    Transaction.countDocuments({ type: "withdrawal", status: "pending" }),
    Review.countDocuments({ "moderatorEvaluation.evaluatedBy": null }),
    Order.countDocuments({ status: { $in: ["awaiting_seller_confirmation", "awaiting_payment", "paid", "shipped"] } }),
    User.countDocuments({ isSuspended: true }),
    Dispute.countDocuments({ status: { $in: ["pending", "investigating"] } }),
    Product.countDocuments({ status: "pending" }),
    User.countDocuments({ kycStatus: "pending" }),
    Review.countDocuments({ "moderatorEvaluation.isBad": { $ne: true } }), // Đếm đơn chưa đánh giá
    Review.countDocuments({ "moderatorEvaluation.isBad": true }),           // Đếm đơn đã đánh giá xấu
    Report.find({ status: { $in: ["pending", "reviewing"] } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("reporterId", "fullName email")
      .populate("reportedUserId", "fullName email")
      .populate("productId", "title")
  ]);

  return {
    pendingReports,
    reviewingReports,
    unresolvedReports,
    pendingWithdrawals,
    reportedReviews,
    openOrders,
    suspendedUsers,
    pendingDisputes,
    pendingProducts,
    pendingKYC,
    recentReports,
    badReviews
  };
}

async function getPendingProducts() {
  return Product.find({ status: "pending" }).populate("seller", "fullName email");
}

async function approvePendingProduct(productId) {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Sản phẩm không tồn tại");

  if (!["pending", "rejected"].includes(product.status)) {
    throw new Error("Chỉ có thể duyệt sản phẩm đang chờ hoặc đã bị từ chối trước đó");
  }

  product.status = "active";
  product.moderationStatus = "approved";
  product.rejectionReason = undefined;
  await product.save();

  return product;
}

async function rejectPendingProduct(productId, reason = "") {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Sản phẩm không tồn tại");

  if (!["pending", "active"].includes(product.status)) {
    throw new Error("Không thể từ chối sản phẩm ở trạng thái hiện tại");
  }

  product.status = "rejected";
  product.moderationStatus = "rejected";
  product.rejectionReason = String(reason || "").trim() || "Vi phạm chính sách nền tảng";
  await product.save();

  return product;
}

async function getPendingKYCRequests() {
  return User.find({ kycStatus: "pending" })
    .select("fullName email avatar kycStatus kycDocuments kycSubmittedAt")
    .sort({ kycSubmittedAt: 1 });
}

async function approveKYC(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error("Người dùng không tồn tại");

  if (user.kycStatus !== "pending") {
    throw new Error("Yêu cầu KYC không ở trạng thái chờ duyệt");
  }

  user.kycStatus = "approved";
  user.isVerified = true;
  user.kycApprovedAt = new Date();
  user.kycRejectedAt = undefined;
  user.kycRejectionReason = undefined;
  await user.save();

  return user;
}

async function rejectKYC(userId, reason = "") {
  const user = await User.findById(userId);
  if (!user) throw new Error("Người dùng không tồn tại");

  if (user.kycStatus !== "pending") {
    throw new Error("Yêu cầu KYC không ở trạng thái chờ duyệt");
  }

  user.kycStatus = "rejected";
  user.isVerified = false;
  user.kycRejectedAt = new Date();
  user.kycRejectionReason = String(reason || "").trim() || "Thông tin KYC không hợp lệ";
  await user.save();

  return user;
}

async function banUser(userId, suspendedReason = "") {
  const user = await User.findById(userId);
  if (!user) throw new Error("Người dùng không tồn tại");
  user.isSuspended = true;
  user.suspendedReason = String(suspendedReason || '').trim() || 'Tài khoản bị khóa bởi moderator.';
  user.violationCount = (user.violationCount || 0) + 1;
  await user.save();
  return {
    user,
    suspendedReason
  };
}

async function getReports(filters = {}, pagination = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.reportType) query.reportType = filters.reportType;

  const keywordRegex = buildRegexKeyword(filters.keyword);
  if (keywordRegex) {
    query.$or = [
      { reason: keywordRegex },
      { description: keywordRegex }
    ];
  }

  const { page, limit, skip } = parsePagination(pagination);
  const reports = await Report.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("reporterId", "fullName email avatar")
    .populate("reportedUserId", "fullName email avatar violationCount isSuspended suspendedUntil")
    .populate("productId", "title images")
    .lean();

  const reportsWithStats = await attachReportedUserStats(reports);

  const total = await Report.countDocuments(query);
  return {
    reports: reportsWithStats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function getReportById(reportId) {
  const report = await Report.findById(reportId)
    .populate("reporterId", "fullName email avatar")
    .populate("reportedUserId", "fullName email avatar violationCount isSuspended suspendedUntil")
    .populate("productId", "title images price")
    .lean();

  if (!report) {
    throw new Error("Báo cáo không tồn tại");
  }

  const reportWithStats = await attachReportedUserStats([report]);
  return reportWithStats[0];
}

async function resolveReport(reportId, moderatorId, payload) {
  const { status, moderatorDecision, moderatorNotes, moderatorReply, moderatorReplyToReportedUser } = payload;
  return reportService.resolveReport(
    reportId,
    moderatorId,
    status,
    moderatorDecision,
    moderatorNotes,
    moderatorReply,
    moderatorReplyToReportedUser
  );
}

async function getOrders(filters = {}, pagination = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;

  const keywordRegex = buildRegexKeyword(filters.keyword);
  const { page, limit, skip } = parsePagination(pagination);

  let orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("buyerId", "fullName email phone address")
    .populate("sellerId", "fullName email phone address")
    .populate("productId", "title images price")
    .lean();

  if (keywordRegex) {
    orders = orders.filter((order) => {
      const buyer = order.buyerId?.fullName || "";
      const seller = order.sellerId?.fullName || "";
      const product = order.productId?.title || "";
      return (
        keywordRegex.test(String(order._id)) ||
        keywordRegex.test(buyer) ||
        keywordRegex.test(seller) ||
        keywordRegex.test(product)
      );
    });
  }

  const total = await Order.countDocuments(query);
  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function getOrderById(orderId) {
  const order = await Order.findById(orderId)
    .populate("buyerId", "fullName email phone address avatar")
    .populate("sellerId", "fullName email phone address avatar")
    .populate("productId", "title images price")
    .populate("requestId");

  if (!order) {
    throw new Error("Đơn hàng không tồn tại");
  }

  return {
    ...order.toObject(),
    allowedNextStatuses: getAllowedNextStatuses(order.status)
  };
}

async function forceCancelOrder(orderId, moderatorId, reason) {
  return orderService.forceCancelOrder(orderId, moderatorId, reason);
}

// Cập nhật trạng thái đơn từ moderator, có kiểm soát chuyển trạng thái để tránh sai luồng.
async function updateOrderStatusByModerator(orderId, nextStatus, moderatorId, note = "") {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Đơn hàng không tồn tại");
  }

  const allowedNextStatuses = getAllowedNextStatuses(order.status);
  if (!allowedNextStatuses.includes(nextStatus)) {
    throw new Error(
      `Không thể chuyển từ ${order.status} sang ${nextStatus}. Trạng thái hợp lệ tiếp theo: ${allowedNextStatuses.join(", ") || "không có"}`
    );
  }

  if (nextStatus === "cancelled" && String(note || "").trim().length < 10) {
    throw new Error("Khi hủy đơn, ghi chú phải có ít nhất 10 ký tự");
  }

  order.status = nextStatus;

  if (nextStatus === "paid") {
    order.paymentStatus = "paid";
    order.paidAt = order.paidAt || new Date();
  }

  if (nextStatus === "shipped") {
    order.shippedAt = order.shippedAt || new Date();
  }

  if (nextStatus === "completed") {
    order.paymentStatus = "paid";
    order.completedAt = order.completedAt || new Date();

    if (order.productId) {
      await Product.findByIdAndUpdate(order.productId, { status: "sold" });
    }
  }

  if (nextStatus === "cancelled") {
    order.cancelledAt = new Date();
    order.cancellationReason = String(note).trim() || `Hủy bởi moderator ${moderatorId}`;

    if (order.productId) {
      const product = await Product.findById(order.productId);
      if (product && ["pending", "sold"].includes(product.status)) {
        product.status = "active";
        await product.save();
      }
    }
  }

  await order.save();
  return getOrderById(orderId);
}

async function getReviews(filters = {}, pagination = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;

  const { page, limit, skip } = parsePagination(pagination);
  const reviews = await Review.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("reviewerId", "fullName email")
    .populate("reviewedUserId", "fullName email isSuspended suspendedUntil modBadReviewCount")
    .populate("moderatorAssessment.moderatorId", "fullName email")
    .populate("productId", "title images")
    .populate("orderId", "status agreedAmount");

  const total = await Review.countDocuments(query);
  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function hideReview(reviewId) {
  const review = await Review.findById(reviewId);
  if (!review) throw new Error("Đánh giá không tồn tại");
  if (review.status === "hidden") throw new Error("Đánh giá đã bị ẩn trước đó");

  review.status = "hidden";
  await review.save();
  await reviewService.updateUserRating(review.reviewedUserId);
  return review;
}

function getModerationSuspensionConfig(level) {
  if (level === 1) {
    return { durationHours: 24, label: '24 giờ' };
  }
  if (level === 2) {
    return { durationHours: 24 * 7, label: '1 tuần' };
  }
  return { durationHours: 24 * 365, label: '1 năm' };
}

async function markSellerBadByReview(reviewId, moderatorId, note = '') {
  const review = await Review.findById(reviewId);
  if (!review) throw new Error('Đánh giá không tồn tại');

  if (review?.moderatorAssessment?.isBad) {
    throw new Error('Đánh giá này đã được moderator xử lý xấu trước đó');
  }

  const seller = await User.findById(review.reviewedUserId);
  if (!seller) throw new Error('Không tìm thấy người bán để xử lý');

  const nextCount = Number(seller.modBadReviewCount || 0) + 1;
  const penaltyLevel = Math.min(Math.floor(nextCount / 3), 3);
  const shouldSuspendNow = nextCount % 3 === 0;

  let suspensionConfig = null;
  let suspendUntil = seller.suspendedUntil || null;

  seller.modBadReviewCount = nextCount;

  if (shouldSuspendNow && penaltyLevel > 0) {
    suspensionConfig = getModerationSuspensionConfig(penaltyLevel);
    suspendUntil = new Date(Date.now() + suspensionConfig.durationHours * 60 * 60 * 1000);

    seller.isSuspended = true;
    seller.suspendedUntil = suspendUntil;
    seller.suspendedReason = `Vi phạm đánh giá do moderator xử lý (mức ${penaltyLevel}/3). ${String(note || '').trim()}`;
  }

  await seller.save();

  review.moderatorAssessment = {
    isBad: true,
    moderatorId,
    note,
    markedAt: new Date(),
    penaltyLevel
  };
  await review.save();

  try {
    const normalizedNote = String(note || '').trim();
    const detailMessage = normalizedNote
      ? `Nội dung từ moderator: ${normalizedNote}`
      : 'Vui lòng rà soát chất lượng sản phẩm và cách phục vụ.';

    const moderationResultMessage = shouldSuspendNow && suspensionConfig
      ? `Tài khoản bị khóa ${suspensionConfig.label} sau mốc ${nextCount} đánh giá xấu.`
      : `Đã ghi nhận ${nextCount} đánh giá xấu. Tài khoản sẽ bị khóa khi đạt các mốc 3/6/9.`;

    await notificationService.createNotification(seller._id, {
      type: 'system',
      senderId: moderatorId,
      reviewId: review._id,
      title: 'Tài khoản bị hạn chế do đánh giá kiểm duyệt',
      message: `Moderator đã đánh dấu 1 đánh giá xấu cho tài khoản của bạn. ${moderationResultMessage} ${detailMessage}`
    });
  } catch (notificationError) {
    console.error('Error sending seller moderation notification:', notificationError);
  }

  await review.populate([
    { path: 'reviewerId', select: 'fullName email' },
    { path: 'reviewedUserId', select: 'fullName email isSuspended suspendedUntil modBadReviewCount' },
    { path: 'moderatorAssessment.moderatorId', select: 'fullName email' },
    { path: 'productId', select: 'title images' },
    { path: 'orderId', select: 'status agreedAmount' }
  ]);

  return {
    review,
    sellerPenalty: {
      modBadReviewCount: nextCount,
      penaltyLevel,
      isSuspended: Boolean(seller.isSuspended),
      suspendedUntil: suspendUntil,
      suspensionLabel: suspensionConfig?.label || null,
      shouldSuspendNow
    }
  };
}

async function getWithdrawals(filters = {}, pagination = {}) {
  const query = { type: "withdrawal" };
  if (filters.status) query.status = filters.status;

  const { page, limit, skip } = parsePagination(pagination);
  const withdrawals = await Transaction.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "fullName email")
    .lean();

  const total = await Transaction.countDocuments(query);
  return {
    withdrawals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function updateWithdrawalStatus(withdrawalId, nextStatus, note = "") {
  const withdrawal = await Transaction.findById(withdrawalId);
  if (!withdrawal) throw new Error("Yeu cau rut tien khong ton tai");
  if (withdrawal.type !== "withdrawal") throw new Error("Giao dich khong phai yeu cau rut tien");
  if (withdrawal.status !== "pending") throw new Error("Chi duoc xu ly yeu cau dang cho duyet");

  withdrawal.status = nextStatus;
  if (nextStatus === "completed") {
    const wallet = await walletService.decrementBalance(
      withdrawal.userId,
      withdrawal.amount,
      "withdrawal",
      `Rút tiền theo yêu cầu #${withdrawal._id}`,
      { withdrawalId: withdrawal._id }
    );

    withdrawal.completedAt = new Date();
    withdrawal.balanceAfter = wallet.balance;
  }
  if (nextStatus === "failed") {
    withdrawal.failedAt = new Date();
    withdrawal.failureReason = note || "Tu choi boi moderator";
  }
  if (nextStatus === "cancelled") {
    withdrawal.cancelledAt = new Date();
    withdrawal.failureReason = note || "Huy boi moderator";
  }
  await withdrawal.save();
  return withdrawal;
}

async function getDisputes(filters = {}, pagination = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;

  const { page, limit, skip } = parsePagination(pagination);

  const populateDisputes = (builder) => builder
    .populate("orderId", "agreedAmount totalToPay status")
    .populate("buyerId", "fullName email avatar violationCount isSuspended")
    .populate("sellerId", "fullName email avatar violationCount isSuspended")
    .populate("productId", "title images")
    .populate("moderatorId", "fullName email");

  let disputes = [];
  let total = 0;

  if (filters.status) {
    disputes = await populateDisputes(
      Dispute.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    );
    total = await Dispute.countDocuments(query);
  } else {
    const unresolvedQuery = { status: { $in: ["pending", "investigating"] } };
    const resolvedQuery = { status: "resolved" };

    const [pendingTotal, unresolvedTotal, allTotal] = await Promise.all([
      Dispute.countDocuments({ status: "pending" }),
      Dispute.countDocuments(unresolvedQuery),
      Dispute.countDocuments({})
    ]);

    total = allTotal;

    if (skip < unresolvedTotal) {
      const unresolvedLimit = Math.min(limit, unresolvedTotal - skip);

      // In unresolved bucket, show pending first then investigating (newest first in each bucket).
      if (skip < pendingTotal) {
        const pendingItems = await populateDisputes(
          Dispute.find({ status: "pending" })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(unresolvedLimit)
        );

        const remaining = unresolvedLimit - pendingItems.length;
        if (remaining > 0) {
          const investigatingItems = await populateDisputes(
            Dispute.find({ status: "investigating" })
              .sort({ createdAt: -1 })
              .skip(0)
              .limit(remaining)
          );
          disputes = [...pendingItems, ...investigatingItems];
        } else {
          disputes = pendingItems;
        }
      } else {
        const investigatingSkip = skip - pendingTotal;
        disputes = await populateDisputes(
          Dispute.find({ status: "investigating" })
            .sort({ createdAt: -1 })
            .skip(investigatingSkip)
            .limit(unresolvedLimit)
        );
      }

      const remaining = limit - disputes.length;
      if (remaining > 0) {
        const resolvedItems = await populateDisputes(
          Dispute.find(resolvedQuery)
            .sort({ createdAt: -1 })
            .skip(0)
            .limit(remaining)
        );
        disputes = [...disputes, ...resolvedItems];
      }
    } else {
      const resolvedSkip = skip - unresolvedTotal;
      disputes = await populateDisputes(
        Dispute.find(resolvedQuery)
          .sort({ createdAt: -1 })
          .skip(resolvedSkip)
          .limit(limit)
      );
    }
  }

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

async function getDisputeById(disputeId) {
  const dispute = await Dispute.findById(disputeId)
    .populate("orderId", "agreedAmount totalToPay status paymentStatus")
    .populate("buyerId", "fullName email avatar violationCount isSuspended")
    .populate("sellerId", "fullName email avatar violationCount isSuspended")
    .populate("productId", "title images price")
    .populate("moderatorId", "fullName email");

  if (!dispute) {
    throw new Error("Khiếu nại không tồn tại");
  }

  return dispute;
}

async function increaseViolationAndMaybeSuspend(userId) {
  const user = await User.findById(userId);
  if (!user) return null;

  user.violationCount = (user.violationCount || 0) + 1;
  if (user.violationCount >= 3) {
    user.isSuspended = true;
    const suspendUntil = new Date();
    suspendUntil.setDate(suspendUntil.getDate() + 30);
    user.suspendedUntil = suspendUntil;
  }

  await user.save();
  return user;
}

async function resolveDispute(disputeId, moderatorId, payload) {
  const { resolution, moderatorNotes } = payload;
  const dispute = await Dispute.findById(disputeId);

  if (!dispute) {
    throw new Error("Khiếu nại không tồn tại");
  }

  if (dispute.status === "resolved") {
    throw new Error("Khiếu nại đã được xử lý trước đó");
  }

  const orderId = dispute.orderId.toString();
  const escrowHold = await EscrowHold.findOne({ orderId });

  if (!escrowHold) {
    throw new Error("Không tìm thấy tiền ký quỹ cho đơn hàng này");
  }

  if (resolution === "refund") {
    if (escrowHold.status === "held") {
      await escrowService.refundFunds(orderId, "Tranh chấp đã xử lý: Hoàn tiền cho người mua");
    } else if (escrowHold.status === "released") {
      throw new Error("Tiền đã nhả cho người bán, không thể hoàn tiền cho người mua");
    }
  } else if (resolution === "release") {
    if (escrowHold.status === "held") {
      await escrowService.releaseFunds(orderId, "Tranh chấp đã xử lý: Nhả tiền cho người bán", false);
    } else if (escrowHold.status === "refunded") {
      throw new Error("Tiền đã hoàn cho người mua, không thể nhả lại cho người bán");
    }

    const order = await Order.findById(orderId);
    if (order && order.status !== "completed") {
      order.status = "completed";
      order.paymentStatus = "paid";
      order.completedAt = new Date();
      await order.save();

      if (order.productId) {
        await Product.findByIdAndUpdate(order.productId, { status: "sold" });
      }
    }
  }

  dispute.status = "resolved";
  dispute.resolution = resolution;
  dispute.moderatorNotes = moderatorNotes || "";
  dispute.moderatorId = moderatorId;
  dispute.resolvedAt = new Date();
  await dispute.save();

  return getDisputeById(disputeId);
}

async function pushDisputeNotification(userId, title, msg, disputeId) {
  if (!userId) return;
  await notificationService.createNotification(userId, {
    type: 'dispute_update',
    title,
    message: msg,
    disputeId
  });
}

// Chuyển tranh chấp sang "investigating" để phản ánh giai đoạn điều tra trung gian.
async function markDisputeInvestigating(disputeId, moderatorId, note = "") {
  const dispute = await Dispute.findById(disputeId);

  if (!dispute) {
    throw new Error("Khiếu nại không tồn tại");
  }

  if (dispute.status === "resolved") {
    throw new Error("Khiếu nại đã được xử lý, không thể chuyển investigating");
  }

  dispute.status = "investigating";
  dispute.moderatorId = moderatorId;
  if (String(note || "").trim()) {
    dispute.moderatorNotes = String(note).trim();
  }

  await dispute.save();

  const isReturn = dispute.reason === 'return_request';
  const buyerMsg = isReturn
    ? 'Yêu cầu hoàn hàng của bạn đang được điều tra. Vui lòng gửi hàng lại cho người bán.'
    : 'Khiếu nại của bạn đang được điều tra. Vui lòng cung cấp thêm bằng chứng nếu có.';
  const sellerMsg = isReturn
    ? 'Người mua yêu cầu hoàn hàng. Chuẩn bị nhận lại hàng và xác nhận khi đã nhận được.'
    : 'Đơn hàng đang bị khiếu nại. Vui lòng cung cấp bằng chứng phản hồi trong hệ thống.';

  await Promise.all([
    pushDisputeNotification(dispute.buyerId, 'Tranh chấp đang điều tra', buyerMsg, disputeId),
    pushDisputeNotification(dispute.sellerId, 'Tranh chấp đang điều tra', sellerMsg, disputeId)
  ]);

  return getDisputeById(disputeId);
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

module.exports = {
  isValidObjectId,
  getDashboardStats,
  getPendingProducts,
  approvePendingProduct,
  rejectPendingProduct,
  getPendingKYCRequests,
  approveKYC,
  rejectKYC,
  banUser,
  getReports,
  getReportById,
  resolveReport,
  getOrders,
  getOrderById,
  forceCancelOrder,
  updateOrderStatusByModerator,
  getReviews,
  hideReview,
  markSellerBadByReview,
  getWithdrawals,
  updateWithdrawalStatus,
  getDisputes,
  getDisputeById,
  resolveDispute,
  markDisputeInvestigating
};