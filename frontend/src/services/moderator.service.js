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

export async function getModeratorRevenueReport(params = {}) {
  const normalizedParams = {};
  if (params.from) {
    normalizedParams.from = params.from;
  }
  if (params.to) {
    normalizedParams.to = params.to;
  }

  const response = await api.get('/moderator/revenue-report', { params: normalizedParams });
  return response.data?.data || {};
}

export async function getModeratorReports(params = {}) {
  // Luong bao cao: lay danh sach report cho man hinh moderator.
  const response = await api.get('/moderator/reports', { params: normalizePaginationParams(params) });
  return normalizeListResponse(response.data, 'reports');
}

export async function getModeratorReportById(reportId) {
  // Luong bao cao: lay chi tiet 1 report.
  ensureObjectId(reportId, 'Mã báo cáo');
  const response = await api.get(`/moderator/reports/${reportId}`);
  return response.data?.data;
}

export async function resolveModeratorReport(reportId, payload) {
  // Luong bao cao: moderator chot quyet dinh xu ly report.
  ensureObjectId(reportId, 'Mã báo cáo');
  const { status, moderatorDecision, moderatorReply, moderatorReplyToReportedUser } = payload || {};

  if (!['resolved', 'dismissed'].includes(status)) {
    throw new Error('status phải là resolved hoặc dismissed');
  }

  if (!['remove_content', 'warn_user', 'ban_user', 'reply_feedback'].includes(moderatorDecision)) {
    throw new Error('moderatorDecision không hợp lệ');
  }

  if (status === 'dismissed' && moderatorDecision !== 'reply_feedback') {
    throw new Error('Khi bỏ qua báo cáo chỉ được dùng quyết định trả lời phản hồi');
  }

  if (moderatorDecision === 'reply_feedback') {
    const hasReply = Boolean(String(moderatorReply || '').trim());
    const hasReplyToReportedUser = Boolean(String(moderatorReplyToReportedUser || '').trim());
    if (!hasReply && !hasReplyToReportedUser) {
      throw new Error('Quyết định trả lời phản hồi cần ít nhất 1 nội dung phản hồi');
    }
  }

  if (moderatorReply && moderatorReply.trim().length > 500) {
    throw new Error('Phản hồi cho người dùng không được vượt quá 500 ký tự');
  }

  if (moderatorReplyToReportedUser && moderatorReplyToReportedUser.trim().length > 500) {
    throw new Error('Phản hồi cho người bị báo cáo không được vượt quá 500 ký tự');
  }
//Api
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
  // Luong danh gia: lay danh sach review cho moderation.
  const normalizedParams = normalizePaginationParams(params);
  if (normalizedParams.assessment !== undefined) {
    const allowedAssessment = ['pending', 'good', 'bad'];
    if (!allowedAssessment.includes(normalizedParams.assessment)) {
      throw new Error('assessment chỉ được là pending, good hoặc bad');
    }
  }

  const response = await api.get('/moderator/reviews', { params: normalizedParams });
  return normalizeListResponse(response.data, 'reviews');
}

export async function hideModeratorReview(reviewId) {
  // Luong danh gia: an review vi pham.
  ensureObjectId(reviewId, 'Mã đánh giá');
  const response = await api.patch(`/moderator/reviews/${reviewId}/hide`);
  return response.data?.data;
}

export async function markBadModeratorReview(reviewId, note) {
  // Luong danh gia: danh dau review xau de ap dung penalty seller.
  ensureObjectId(reviewId, 'Mã đánh giá');
  const normalizedNote = String(note || '').trim();
  if (normalizedNote.length < 10) {
    throw new Error('Ghi chú đánh giá xấu phải có ít nhất 10 ký tự');
  }

  const response = await api.patch(`/moderator/reviews/${reviewId}/mark-bad`, {
    note: normalizedNote
  });

  return response.data?.data;
}

export async function markGoodModeratorReview(reviewId, note = '') {
  // Luong danh gia: danh dau review hop le (khong phat).
  ensureObjectId(reviewId, 'Mã đánh giá');
  const normalizedNote = String(note || '').trim();
  if (normalizedNote.length > 500) {
    throw new Error('Ghi chú không được vượt quá 500 ký tự');
  }

  const response = await api.patch(`/moderator/reviews/${reviewId}/mark-good`, {
    note: normalizedNote
  });

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
  // Luong tranh chap: lay danh sach tranh chap cho moderator.
  const response = await api.get('/moderator/disputes', { params });
  return normalizeListResponse(response.data, 'disputes');
}

export async function getModeratorDisputeById(disputeId) {
  // Luong tranh chap: lay chi tiet de tham dinh bang chung 2 ben.
  ensureObjectId(disputeId, 'Mã tranh chấp');
  const response = await api.get(`/moderator/disputes/${disputeId}`);
  return response.data?.data;
}

// Luong tranh chap: buoc trung gian tiep nhan dieu tra.
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
  // Luong tranh chap: quyet dinh cuoi refund/release (anh huong dong tien escrow).
  ensureObjectId(disputeId, 'Mã tranh chấp');
  const { resolution, moderatorNotes } = payload || {};

  if (!['refund', 'release'].includes(resolution)) {
    throw new Error('Kết quả xử lý chỉ được chọn Hoàn tiền hoặc Nhả tiền');
  }

  if (moderatorNotes && moderatorNotes.trim().length > 500) {
    throw new Error('moderatorNotes không được vượt quá 500 ký tự');
  }

  const response = await api.put(`/moderator/disputes/${disputeId}/resolve`, {
    resolution,
    moderatorNotes: String(moderatorNotes || '').trim()
  });

  return response.data?.data;
}

export async function sendModeratorDisputeMessage(disputeId, content) {
  ensureObjectId(disputeId, 'Mã tranh chấp');
  const normalizedContent = String(content || '').trim();

  if (!normalizedContent) {
    throw new Error('Vui lòng nhập nội dung tin nhắn');
  }

  if (normalizedContent.length > 1000) {
    throw new Error('Nội dung tin nhắn không được vượt quá 1000 ký tự');
  }

  const response = await api.post(`/moderator/disputes/${disputeId}/message`, {
    content: normalizedContent
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
  markBadModeratorReview,
  markGoodModeratorReview,
  getModeratorWithdrawals,
  updateModeratorWithdrawalStatus,
  getModeratorDisputes,
  getModeratorDisputeById,
  markModeratorDisputeInvestigating,
  sendModeratorDisputeMessage,
  resolveModeratorDispute
};

export default moderatorService;
