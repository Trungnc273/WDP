import api from './api';

// Kiểm tra ObjectId đầu vào ở phía frontend để báo lỗi sớm.
function ensureObjectId(id, fieldName) {
  if (!id || typeof id !== 'string' || id.trim().length !== 24) {
    throw new Error(`${fieldName} không hợp lệ`);
  }
}

function normalizeListResponse(response, key) {
  return {
    items: response?.data?.[key] || [],
    pagination: response?.data?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    }
  };
}

function normalizePaginationParams(params = {}) {
  // Chuẩn hóa tham số truy vấn cho toàn bộ màn hình moderator list.
  const next = { ...params };

  if (next.page !== undefined) {
    const page = Number(next.page);
    if (!Number.isInteger(page) || page < 1) {
      throw new Error('page phải là số nguyên >= 1');
    }
    next.page = page;
  }

  if (next.limit !== undefined) {
    const limit = Number(next.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('limit phải là số nguyên trong khoảng 1-100');
    }
    next.limit = limit;
  }

  if (next.keyword !== undefined) {
    const keyword = String(next.keyword || '').trim();
    if (keyword.length > 100) {
      throw new Error('keyword không được vượt quá 100 ký tự');
    }
    if (!keyword) {
      delete next.keyword;
    } else {
      next.keyword = keyword;
    }
  }

  return next;
}

export async function getModeratorDashboard() {
  const response = await api.get('/moderator/dashboard');
  return response.data?.data || {};
}

export async function getModeratorReports(params = {}) {
  const response = await api.get('/moderator/reports', { params: normalizePaginationParams(params) });
  return normalizeListResponse(response.data, 'reports');
}

export async function getModeratorReportById(reportId) {
  ensureObjectId(reportId, 'Mã báo cáo');
  const response = await api.get(`/moderator/reports/${reportId}`);
  return response.data?.data;
}

export async function resolveModeratorReport(reportId, payload) {
  ensureObjectId(reportId, 'Mã báo cáo');
  const { status, moderatorDecision, moderatorReply, moderatorReplyToReportedUser } = payload || {};

  if (!['resolved', 'dismissed'].includes(status)) {
    throw new Error('status phải là resolved hoặc dismissed');
  }

  if (!['remove_content', 'warn_user', 'ban_user', 'reply_feedback'].includes(moderatorDecision)) {
    throw new Error('moderatorDecision không hợp lệ');
  }

  if (moderatorReply && moderatorReply.trim().length > 500) {
    throw new Error('Phản hồi cho người dùng không được vượt quá 500 ký tự');
  }

  if (moderatorReplyToReportedUser && moderatorReplyToReportedUser.trim().length > 500) {
    throw new Error('Phản hồi cho người bị báo cáo không được vượt quá 500 ký tự');
  }

  const response = await api.put(`/moderator/reports/${reportId}/resolve`, {
    status,
    moderatorDecision,
    moderatorReply: moderatorReply || '',
    moderatorReplyToReportedUser: moderatorReplyToReportedUser || ''
  });

  return response.data?.data;
}

export async function getModeratorOrders(params = {}) {
  const response = await api.get('/moderator/orders', { params: normalizePaginationParams(params) });
  return normalizeListResponse(response.data, 'orders');
}

export async function getModeratorOrderById(orderId) {
  ensureObjectId(orderId, 'Mã đơn hàng');
  const response = await api.get(`/moderator/orders/${orderId}`);
  return response.data?.data;
}

export async function forceCancelModeratorOrder(orderId, reason) {
  ensureObjectId(orderId, 'Mã đơn hàng');
  if (!reason || reason.trim().length < 10) {
    throw new Error('Lý do hủy đơn phải có ít nhất 10 ký tự');
  }

  const response = await api.post(`/moderator/orders/${orderId}/force-cancel`, {
    reason: reason.trim()
  });

  return response.data?.data;
}

// Cập nhật trạng thái đơn hàng theo luồng backend cho phép.
export async function updateModeratorOrderStatus(orderId, nextStatus, note = '') {
  ensureObjectId(orderId, 'Mã đơn hàng');

  if (!['paid', 'shipped', 'completed', 'cancelled', 'disputed'].includes(nextStatus)) {
    throw new Error('Trạng thái cập nhật không hợp lệ');
  }

  if (nextStatus === 'cancelled' && (!note || note.trim().length < 10)) {
    throw new Error('Khi hủy đơn, lý do phải có ít nhất 10 ký tự');
  }

  const response = await api.patch(`/moderator/orders/${orderId}/status`, {
    nextStatus,
    note: note.trim()
  });

  return response.data?.data;
}

export async function getModeratorReviews(params = {}) {
  const response = await api.get('/moderator/reviews', { params });
  return normalizeListResponse(response.data, 'reviews');
}

export async function hideModeratorReview(reviewId) {
  ensureObjectId(reviewId, 'Mã đánh giá');
  const response = await api.patch(`/moderator/reviews/${reviewId}/hide`);
  return response.data?.data;
}

export async function getModeratorWithdrawals(params = {}) {
  const response = await api.get('/moderator/withdrawals', { params });
  return normalizeListResponse(response.data, 'withdrawals');
}

export async function updateModeratorWithdrawalStatus(withdrawalId, status, note = '') {
  ensureObjectId(withdrawalId, 'Mã yêu cầu rút tiền');

  if (!['completed', 'failed', 'cancelled'].includes(status)) {
    throw new Error('status phải là completed, failed hoặc cancelled');
  }

  if ((status === 'failed' || status === 'cancelled') && (!note || note.trim().length < 5)) {
    throw new Error('Lý do phải có tối thiểu 5 ký tự');
  }

  const response = await api.patch(`/moderator/withdrawals/${withdrawalId}/status`, {
    status,
    note: note.trim()
  });

  return response.data?.data;
}

export async function getModeratorDisputes(params = {}) {
  const response = await api.get('/moderator/disputes', { params });
  return normalizeListResponse(response.data, 'disputes');
}

export async function getModeratorDisputeById(disputeId) {
  ensureObjectId(disputeId, 'Mã tranh chấp');
  const response = await api.get(`/moderator/disputes/${disputeId}`);
  return response.data?.data;
}

// Bước trung gian: moderator nhận xử lý trước khi ra quyết định cuối cùng.
export async function markModeratorDisputeInvestigating(disputeId, moderatorNotes = '') {
  ensureObjectId(disputeId, 'Mã tranh chấp');
  if (moderatorNotes && moderatorNotes.trim().length > 500) {
    throw new Error('moderatorNotes không được vượt quá 500 ký tự');
  }

  const response = await api.patch(`/moderator/disputes/${disputeId}/investigating`, {
    moderatorNotes: moderatorNotes.trim()
  });

  return response.data?.data;
}

export async function resolveModeratorDispute(disputeId, payload) {
  ensureObjectId(disputeId, 'Mã tranh chấp');
  const { resolution, moderatorNotes } = payload || {};

  if (!['refund', 'release'].includes(resolution)) {
    throw new Error('resolution phải là refund hoặc release');
  }

  if (!moderatorNotes || moderatorNotes.trim().length < 10) {
    throw new Error('moderatorNotes tối thiểu 10 ký tự');
  }

  const response = await api.put(`/moderator/disputes/${disputeId}/resolve`, {
    resolution,
    moderatorNotes: moderatorNotes.trim()
  });

  return response.data?.data;
}

const moderatorService = {
  getModeratorDashboard,
  getModeratorReports,
  getModeratorReportById,
  resolveModeratorReport,
  getModeratorOrders,
  getModeratorOrderById,
  forceCancelModeratorOrder,
  updateModeratorOrderStatus,
  getModeratorReviews,
  hideModeratorReview,
  getModeratorWithdrawals,
  updateModeratorWithdrawalStatus,
  getModeratorDisputes,
  getModeratorDisputeById,
  markModeratorDisputeInvestigating,
  resolveModeratorDispute
};

export default moderatorService;
