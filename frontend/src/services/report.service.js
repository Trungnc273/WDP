import api from './api';

/**
 * Service báo cáo và tranh chấp
 * Xử lý các API liên quan đến báo cáo vi phạm và tranh chấp đơn hàng
 */

/**
 * Tạo báo cáo cho sản phẩm
 * @param {string} productId - Mã sản phẩm
 * @param {string} reason - Lý do báo cáo
 * @param {string} description - Nội dung mô tả
 * @param {Array} evidenceImages - Danh sách ảnh bằng chứng
 */
export const createProductReport = async (productId, reason, description, evidenceImages = []) => {
  const response = await api.post('/reports/product', {
    productId,
    reason,
    description,
    evidenceImages
  });
  return response.data;
};

/**
 * Tạo báo cáo cho người dùng
 * @param {string} reportedUserId - Mã người dùng bị báo cáo
 * @param {string} reason - Lý do báo cáo
 * @param {string} description - Nội dung mô tả
 * @param {Array} evidenceImages - Danh sách ảnh bằng chứng
 */
export const createUserReport = async (reportedUserId, reason, description, evidenceImages = []) => {
  const response = await api.post('/reports/user', {
    reportedUserId,
    reason,
    description,
    evidenceImages
  });
  return response.data;
};

/**
 * Lấy danh sách báo cáo của người dùng hiện tại
 * @param {object} pagination - Thông tin phân trang
 */
export const getMyReports = async (pagination = {}) => {
  const params = new URLSearchParams();
  
  if (pagination.page) params.append('page', pagination.page);
  if (pagination.limit) params.append('limit', pagination.limit);
  
  const response = await api.get(`/reports/my-reports?${params}`);
  return response.data;
};

/**
 * Tạo tranh chấp cho một đơn hàng
 * @param {string} orderId - Mã đơn hàng
 * @param {string} reason - Lý do tranh chấp
 * @param {string} description - Nội dung tranh chấp
 * @param {Array} evidenceImages - Danh sách ảnh bằng chứng
 */
export const createDispute = async (orderId, reason, description, evidenceImages) => {
  const response = await api.post(`/orders/${orderId}/dispute`, {
    reason,
    description,
    evidenceImages
  });
  return response.data;
};

/**
 * Lấy danh sách tranh chấp của người dùng hiện tại
 * @param {object} pagination - Thông tin phân trang
 */
export const getMyDisputes = async (pagination = {}) => {
  const params = new URLSearchParams();
  
  if (pagination.page) params.append('page', pagination.page);
  if (pagination.limit) params.append('limit', pagination.limit);
  
  const response = await api.get(`/disputes/my-disputes?${params}`);
  return response.data;
};

/**
 * Thêm phản hồi của người bán vào tranh chấp
 * @param {string} disputeId - Mã tranh chấp
 * @param {string} response - Nội dung phản hồi của người bán
 * @param {Array} evidenceImages - Danh sách ảnh bằng chứng
 */
export const addSellerResponse = async (disputeId, response, evidenceImages = []) => {
  const response_data = await api.post(`/disputes/${disputeId}/respond`, {
    response,
    evidenceImages
  });
  return response_data.data;
};

/**
 * Người mua bổ sung ghi chú/bằng chứng cho tranh chấp đang mở
 * @param {string} disputeId - Mã tranh chấp
 * @param {string} note - Ghi chú của người mua
 * @param {Array} evidenceImages - Danh sách đường dẫn file bằng chứng
 */
export const addBuyerFollowUp = async (disputeId, note = '', evidenceImages = []) => {
  const response = await api.post(`/disputes/${disputeId}/buyer-follow-up`, {
    note,
    evidenceImages
  });
  return response.data;
};

/**
 * Lấy tranh chấp theo mã đơn hàng
 * @param {string} orderId - Mã đơn hàng
 */
export const getDisputeByOrderId = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/dispute`);
  return response.data;
};

/**
 * Người bán xác nhận đã nhận lại hàng hoàn
 * @param {string} disputeId - Mã tranh chấp
 */
export const confirmSellerReturn = async (disputeId) => {
  const response = await api.post(`/disputes/${disputeId}/confirm-return`);
  return response.data;
};

/**
 * Tải tệp bằng chứng (ảnh/video) và trả về đường dẫn đã lưu ở backend
 * @param {File[]} files - Danh sách file bằng chứng
 * @returns {Promise<string[]>} Danh sách đường dẫn file đã lưu
 */
export const uploadEvidenceMedia = async (files = []) => {
  if (!files.length) return [];

  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await api.post('/upload/evidence', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return (response.data?.data || []).map((item) => item.path).filter(Boolean);
};

// Giữ tên hàm cũ để tương thích các chỗ gọi hiện có.
export const uploadEvidenceImages = uploadEvidenceMedia;