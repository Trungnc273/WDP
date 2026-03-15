const moderatorService = require("./moderator.service");
const { sendSuccess, sendError } = require("../../common/utils/response.util");
const { createNotification } = require('../notifications/notification.service');

const REPORT_STATUS = ["pending", "reviewing", "resolved", "dismissed"];
const REPORT_TYPE = ["product", "user"];
// Danh sách quyết định xử lý báo cáo được phép từ moderator.
const REPORT_DECISIONS = ["remove_content", "warn_user", "ban_user", "reply_feedback"];
const ORDER_STATUS = ["awaiting_seller_confirmation", "awaiting_payment", "paid", "shipped", "completed", "cancelled", "disputed"];
const ORDER_STATUS_UPDATABLE = ["paid", "shipped", "completed", "cancelled", "disputed"];
const REVIEW_STATUS = ["active", "hidden", "reported"];
const WITHDRAWAL_STATUS = ["pending", "completed", "failed", "cancelled"];
const WITHDRAWAL_RESOLVE_STATUS = ["completed", "failed", "cancelled"];
const DISPUTE_STATUS = ["pending", "investigating", "resolved"];
const DISPUTE_RESOLUTION = ["refund", "release"];

function ensureObjectId(id, fieldName) {
  if (!id || !moderatorService.isValidObjectId(id)) {
    return `${fieldName} không hợp lệ`;
  }
  return null;
}

function ensureInList(value, list, fieldName) {
  if (!value) return null;
  if (!list.includes(value)) {
    return `${fieldName} không hợp lệ`;
  }
  return null;
}

function ensureValidPageLimit(page, limit) {
  // Validate phân trang để tránh truy vấn không hợp lệ hoặc quá tải.
  if (page !== undefined) {
    const pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      return "page phải là số nguyên >= 1";
    }
  }

  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      return "limit phải là số nguyên trong khoảng 1-100";
    }
  }

  return null;
}

function ensureValidKeyword(keyword) {
  // Validate độ dài keyword để đồng bộ rule với frontend.
  if (keyword === undefined) return null;
  if (String(keyword).trim().length > 100) {
    return "keyword không được vượt quá 100 ký tự";
  }
  return null;
}

async function getDashboardStats(req, res) {
  try {
    const stats = await moderatorService.getDashboardStats();
    return sendSuccess(res, 200, stats);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function getPendingProducts(req, res) {
  try {
    const products = await moderatorService.getPendingProducts();
    return sendSuccess(res, 200, products);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function approvePendingProduct(req, res) {
  try {
    const { id } = req.params;
    const validationError = ensureObjectId(id, "Mã sản phẩm");
    if (validationError) return sendError(res, 400, validationError);

    const product = await moderatorService.approvePendingProduct(id);
    return sendSuccess(res, 200, product, "Đã duyệt tin đăng thành công");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

async function rejectPendingProduct(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const validationError = ensureObjectId(id, "Mã sản phẩm");
    if (validationError) return sendError(res, 400, validationError);

    if (!reason || String(reason).trim().length < 10) {
      return sendError(res, 400, "Lý do từ chối phải có ít nhất 10 ký tự");
    }

    const product = await moderatorService.rejectPendingProduct(id, String(reason).trim());
    return sendSuccess(res, 200, product, "Đã từ chối tin đăng");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

async function getPendingKYCRequests(req, res) {
  try {
    const users = await moderatorService.getPendingKYCRequests();
    return sendSuccess(res, 200, users);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function approveKYC(req, res) {
  try {
    const { userId } = req.params;
    const validationError = ensureObjectId(userId, "Mã người dùng");
    if (validationError) return sendError(res, 400, validationError);

    const user = await moderatorService.approveKYC(userId);

    // Send notification for KYC approval
    await createNotification(userId, {
      type: 'system',
      title: 'Xác thực danh tính thành công',
      message: 'Yêu cầu xác thực danh tính của bạn đã được phê duyệt. Tài khoản của bạn giờ đây đã được xác thực.'
    });

    return sendSuccess(res, 200, user, "Đã cấp tích xanh cho người dùng");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

async function rejectKYC(req, res) {
  try {
    const { userId } = req.params;
    const { reason } = req.body || {};

    const validationError = ensureObjectId(userId, "Mã người dùng");
    if (validationError) return sendError(res, 400, validationError);

    if (!reason || String(reason).trim().length < 10) {
      return sendError(res, 400, "Lý do từ chối KYC phải có ít nhất 10 ký tự");
    }

    const user = await moderatorService.rejectKYC(userId, String(reason).trim());

    // Send notification for KYC rejection
    await createNotification(userId, {
      type: 'system',
      title: 'Xác thực danh tính bị từ chối',
      message: `Yêu cầu xác thực danh tính của bạn đã bị từ chối. Lý do: ${String(reason).trim()}`
    });

    return sendSuccess(res, 200, user, "Đã từ chối hồ sơ KYC");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

async function banUser(req, res) {
  try {
    const { id } = req.params;
    const validationError = ensureObjectId(id, "Mã người dùng");
    if (validationError) return sendError(res, 400, validationError);

    const suspendedReason = String(req.body?.reason || "").trim();
    const result = await moderatorService.banUser(id, suspendedReason);
    return sendSuccess(res, 200, result, "Đã khóa tài khoản người dùng");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

async function getReports(req, res) {
  try {
    const { status, reportType, page, limit, keyword } = req.query;

    const statusError = ensureInList(status, REPORT_STATUS, "Trạng thái báo cáo");
    if (statusError) return sendError(res, 400, statusError);

    const typeError = ensureInList(reportType, REPORT_TYPE, "Loại báo cáo");
    if (typeError) return sendError(res, 400, typeError);

    const pageLimitError = ensureValidPageLimit(page, limit);
    if (pageLimitError) return sendError(res, 400, pageLimitError);

    const keywordError = ensureValidKeyword(keyword);
    if (keywordError) return sendError(res, 400, keywordError);

    const result = await moderatorService.getReports(
      { status, reportType, keyword },
      { page, limit }
    );
    return sendSuccess(res, 200, result);
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

async function getReportById(req, res) {
  try {
    const { reportId } = req.params;
    const idError = ensureObjectId(reportId, "Mã báo cáo");
    if (idError) return sendError(res, 400, idError);

    const report = await moderatorService.getReportById(reportId);
    return sendSuccess(res, 200, report);
  } catch (error) {
    return sendError(res, 404, error.message);
  }
}

async function resolveReport(req, res) {
  try {
    const { reportId } = req.params;
    const { status, moderatorDecision, moderatorNotes, moderatorReply, moderatorReplyToReportedUser } = req.body;

    const idError = ensureObjectId(reportId, "Mã báo cáo");
    if (idError) return sendError(res, 400, idError);

    if (!["resolved", "dismissed"].includes(status)) {
      return sendError(res, 400, "status phải là resolved hoặc dismissed");
    }

    const decisionError = ensureInList(moderatorDecision, REPORT_DECISIONS, "moderatorDecision");
    if (decisionError) return sendError(res, 400, decisionError);

    if (moderatorNotes && String(moderatorNotes).trim().length > 500) {
      return sendError(res, 400, "moderatorNotes không được vượt quá 500 ký tự");
    }

    if (moderatorReply && String(moderatorReply).trim().length > 500) {
      return sendError(res, 400, "moderatorReply không được vượt quá 500 ký tự");
    }

    if (moderatorReplyToReportedUser && String(moderatorReplyToReportedUser).trim().length > 500) {
      return sendError(res, 400, "moderatorReplyToReportedUser không được vượt quá 500 ký tự");
    }

    const report = await moderatorService.resolveReport(reportId, req.user.userId, {
      status,
      moderatorDecision,
      moderatorNotes: moderatorNotes ? String(moderatorNotes).trim() : "",
      moderatorReply: moderatorReply ? String(moderatorReply).trim() : "",
      moderatorReplyToReportedUser: moderatorReplyToReportedUser ? String(moderatorReplyToReportedUser).trim() : ""
    });

    return sendSuccess(res, 200, report, "Đã xử lý báo cáo thành công");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

async function getOrders(req, res) {
  try {
    const { status, page, limit, keyword } = req.query;

    const statusError = ensureInList(status, ORDER_STATUS, "Trạng thái đơn hàng");
    if (statusError) return sendError(res, 400, statusError);

    const pageLimitError = ensureValidPageLimit(page, limit);
    if (pageLimitError) return sendError(res, 400, pageLimitError);

    const keywordError = ensureValidKeyword(keyword);
    if (keywordError) return sendError(res, 400, keywordError);

    const result = await moderatorService.getOrders({ status, keyword }, { page, limit });
    return sendSuccess(res, 200, result);
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const idError = ensureObjectId(id, "Mã đơn hàng");
    if (idError) return sendError(res, 400, idError);

    const order = await moderatorService.getOrderById(id);
    return sendSuccess(res, 200, order);
  } catch (error) {
    return sendError(res, 404, error.message);
  }
}

async function forceCancelOrder(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const idError = ensureObjectId(id, "Mã đơn hàng");
    if (idError) return sendError(res, 400, idError);

    if (!reason || String(reason).trim().length < 10) {
      return sendError(res, 400, "Lý do hủy đơn phải có ít nhất 10 ký tự");
    }

    const order = await moderatorService.forceCancelOrder(
      id,
      req.user.userId,
      String(reason).trim()
    );
    return sendSuccess(res, 200, order, "Đã ép hủy đơn hàng thành công");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

// Cập nhật trạng thái đơn hàng theo luồng một chiều để tránh chuyển ngược trạng thái.
async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { nextStatus, note } = req.body || {};

    const idError = ensureObjectId(id, "Mã đơn hàng");
    if (idError) return sendError(res, 400, idError);

    if (!ORDER_STATUS_UPDATABLE.includes(nextStatus)) {
      return sendError(res, 400, "nextStatus không hợp lệ");
    }

    if (String(note || "").trim().length > 500) {
      return sendError(res, 400, "note không được vượt quá 500 ký tự");
    }

    const order = await moderatorService.updateOrderStatusByModerator(
      id,
      nextStatus,
      req.user.userId,
      String(note || "").trim()
    );

    return sendSuccess(res, 200, order, "Đã cập nhật trạng thái đơn hàng");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

async function getReviews(req, res) {
  try {
    const { status, page, limit } = req.query;

    const statusError = ensureInList(status, REVIEW_STATUS, "Trạng thái đánh giá");
    if (statusError) return sendError(res, 400, statusError);

    const result = await moderatorService.getReviews({ status }, { page, limit });
    return sendSuccess(res, 200, result);
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

async function hideReview(req, res) {
  try {
    const { reviewId } = req.params;
    const idError = ensureObjectId(reviewId, "Mã đánh giá");
    if (idError) return sendError(res, 400, idError);

    const review = await moderatorService.hideReview(reviewId);
    return sendSuccess(res, 200, review, "Đã ẩn đánh giá vi phạm");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

async function markSellerBadByReview(req, res) {
  try {
    const { reviewId } = req.params;
    const { note } = req.body || {};

    const idError = ensureObjectId(reviewId, "Mã đánh giá");
    if (idError) return sendError(res, 400, idError);

    const normalizedNote = String(note || '').trim();
    if (normalizedNote.length < 10) {
      return sendError(res, 400, "Vui lòng nhập ghi chú tối thiểu 10 ký tự");
    }
    if (normalizedNote.length > 500) {
      return sendError(res, 400, "Ghi chú không được vượt quá 500 ký tự");
    }

    const result = await moderatorService.markSellerBadByReview(
      reviewId,
      req.user.userId,
      normalizedNote
    );

    return sendSuccess(res, 200, result, "Đã đánh giá xấu và áp dụng xử lý cho người bán");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

async function getWithdrawals(req, res) {
  try {
    const { status, page, limit } = req.query;

    const statusError = ensureInList(status, WITHDRAWAL_STATUS, "Trạng thái rút tiền");
    if (statusError) return sendError(res, 400, statusError);

    const result = await moderatorService.getWithdrawals({ status }, { page, limit });
    return sendSuccess(res, 200, result);
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

async function updateWithdrawalStatus(req, res) {
  try {
    const { withdrawalId } = req.params;
    const { status, note } = req.body;

    const idError = ensureObjectId(withdrawalId, "Mã yêu cầu rút tiền");
    if (idError) return sendError(res, 400, idError);

    if (!WITHDRAWAL_RESOLVE_STATUS.includes(status)) {
      return sendError(res, 400, "status phải là completed, failed hoặc cancelled");
    }

    if (["failed", "cancelled"].includes(status) && (!note || String(note).trim().length < 5)) {
      return sendError(res, 400, "Vui lòng nhập lý do tối thiểu 5 ký tự cho thao tác này");
    }

    const result = await moderatorService.updateWithdrawalStatus(
      withdrawalId,
      status,
      String(note || "").trim()
    );
    return sendSuccess(res, 200, result, "Đã cập nhật trạng thái yêu cầu rút tiền");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

async function getDisputes(req, res) {
  try {
    const { status, page, limit } = req.query;

    const statusError = ensureInList(status, DISPUTE_STATUS, "Trạng thái khiếu nại");
    if (statusError) return sendError(res, 400, statusError);

    const result = await moderatorService.getDisputes({ status }, { page, limit });
    return sendSuccess(res, 200, result);
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

async function getDisputeById(req, res) {
  try {
    const { disputeId } = req.params;
    const idError = ensureObjectId(disputeId, "Mã tranh chấp");
    if (idError) return sendError(res, 400, idError);

    const dispute = await moderatorService.getDisputeById(disputeId);
    return sendSuccess(res, 200, dispute);
  } catch (error) {
    return sendError(res, 404, error.message);
  }
}

async function resolveDispute(req, res) {
  try {
    const { disputeId } = req.params;
    const { resolution, moderatorNotes } = req.body;

    const idError = ensureObjectId(disputeId, "Mã tranh chấp");
    if (idError) return sendError(res, 400, idError);

    const resolutionError = ensureInList(resolution, DISPUTE_RESOLUTION, "resolution");
    if (resolutionError) return sendError(res, 400, resolutionError);

    if (moderatorNotes && String(moderatorNotes).trim().length > 500) {
      return sendError(res, 400, "moderatorNotes không được vượt quá 500 ký tự");
    }

    const dispute = await moderatorService.resolveDispute(disputeId, req.user.userId, {
      resolution,
      moderatorNotes: String(moderatorNotes || "").trim()
    });

    return sendSuccess(res, 200, dispute, "Đã xử lý khiếu nại thành công");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

// Thao tác nhận xử lý tranh chấp trước khi đưa ra quyết định cuối cùng.
async function markDisputeInvestigating(req, res) {
  try {
    const { disputeId } = req.params;
    const { moderatorNotes } = req.body || {};

    const idError = ensureObjectId(disputeId, "Mã tranh chấp");
    if (idError) return sendError(res, 400, idError);

    if (moderatorNotes && String(moderatorNotes).trim().length > 500) {
      return sendError(res, 400, "moderatorNotes không được vượt quá 500 ký tự");
    }

    const dispute = await moderatorService.markDisputeInvestigating(
      disputeId,
      req.user.userId,
      String(moderatorNotes || "").trim()
    );

    return sendSuccess(res, 200, dispute, "Đã chuyển tranh chấp sang investigating");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
}

module.exports = {
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
  updateOrderStatus,
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