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
const walletService = require("../payments/wallet.service");

// Luồng trạng thái đơn hàng cho moderator: chỉ đi tới trước, không cho quay ngược.
const MODERATOR_ORDER_TRANSITIONS = {
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
      shouldLockAccount: warningCount >= 3
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
    recentReports
  ] = await Promise.all([
    Report.countDocuments({ status: "pending" }),
    Report.countDocuments({ status: "reviewing" }),
    Report.countDocuments({ status: { $in: ["pending", "reviewing"] } }),
    Transaction.countDocuments({ type: "withdrawal", status: "pending" }),
    Review.countDocuments({ status: "reported" }),
    Order.countDocuments({ status: { $in: ["awaiting_payment", "paid", "shipped", "disputed"] } }),
    User.countDocuments({ isSuspended: true }),
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
    recentReports
  };
}

async function getPendingProducts() {
  return Product.find({ status: "pending" }).populate("seller", "fullName email");
}

async function banUser(userId, suspendedReason = "") {
  const user = await User.findById(userId);
  if (!user) throw new Error("Người dùng không tồn tại");
  user.isSuspended = true;
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
    .populate("buyerId", "fullName email")
    .populate("sellerId", "fullName email")
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
    .populate("buyerId", "fullName email avatar")
    .populate("sellerId", "fullName email avatar")
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
  }

  if (nextStatus === "cancelled") {
    order.cancelledAt = new Date();
    order.cancellationReason = String(note).trim() || `Hủy bởi moderator ${moderatorId}`;
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
    .populate("reviewedUserId", "fullName email")
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
    withdrawal.completedAt = new Date();
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
  const disputes = await Dispute.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("orderId", "agreedAmount totalToPay status")
    .populate("buyerId", "fullName email avatar violationCount isSuspended")
    .populate("sellerId", "fullName email avatar violationCount isSuspended")
    .populate("productId", "title images")
    .populate("moderatorId", "fullName email");

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

  if (resolution === "refund") {
    await escrowService.refundFunds(orderId, "Dispute resolved: refund to buyer");
    await increaseViolationAndMaybeSuspend(dispute.sellerId);
  } else if (resolution === "release") {
    await escrowService.releaseFunds(orderId, "Dispute resolved: release to seller", false);

    // releaseFunds hiện chỉ nhả trạng thái giữ tiền, nên cần cộng ví người bán thủ công.
    const order = await Order.findById(orderId);
    if (order && order.status !== "completed") {
      await walletService.incrementBalance(
        order.sellerId,
        order.agreedAmount,
        "earning",
        `Thu nhập từ tranh chấp đã xử lý cho đơn #${orderId}`,
        { orderId }
      );

      order.status = "completed";
      order.paymentStatus = "paid";
      order.completedAt = new Date();
      await order.save();
    }

    await increaseViolationAndMaybeSuspend(dispute.buyerId);
  }

  dispute.status = "resolved";
  dispute.resolution = resolution;
  dispute.moderatorNotes = moderatorNotes || "";
  dispute.moderatorId = moderatorId;
  dispute.resolvedAt = new Date();
  await dispute.save();

  return getDisputeById(disputeId);
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
  return getDisputeById(disputeId);
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

module.exports = {
  isValidObjectId,
  getDashboardStats,
  getPendingProducts,
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
  getWithdrawals,
  updateWithdrawalStatus,
  getDisputes,
  getDisputeById,
  resolveDispute,
  markDisputeInvestigating
};