const reportService = require('./report.service');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

/**
 * Report & Dispute Controller
 * Handles report and dispute endpoints
 */

/**
 * Create a product report
 * POST /api/reports/product
 */
async function createProductReport(req, res) {
  try {
    const { productId, reason, description, evidenceImages } = req.body;
    const reporterId = req.user.userId;
    
    // Validate required fields
    if (!productId || !reason || !description) {
      return sendError(res, 400, 'Vui lòng điền đầy đủ thông tin');
    }
    
    const report = await reportService.createProductReport(
      reporterId, 
      productId, 
      reason, 
      description, 
      evidenceImages
    );
    
    sendSuccess(res, 200, report, 'Báo cáo sản phẩm thành công');
  } catch (error) {
    console.error('Create product report error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Create a user report
 * POST /api/reports/user
 */
async function createUserReport(req, res) {
  try {
    const { reportedUserId, reason, description, evidenceImages } = req.body;
    const reporterId = req.user.userId;
    
    // Validate required fields
    if (!reportedUserId || !reason || !description) {
      return sendError(res, 400, 'Vui lòng điền đầy đủ thông tin');
    }
    
    const report = await reportService.createUserReport(
      reporterId, 
      reportedUserId, 
      reason, 
      description, 
      evidenceImages
    );
    
    sendSuccess(res, 200, report, 'Báo cáo người dùng thành công');
  } catch (error) {
    console.error('Create user report error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Get reports (admin/moderator only)
 * GET /api/reports
 */
async function getReports(req, res) {
  try {
    const { status, reportType, page, limit } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (reportType) filters.reportType = reportType;
    
    const pagination = { page, limit };
    
    const result = await reportService.getReports(filters, pagination);
    
    sendSuccess(res, 200, result);
  } catch (error) {
    console.error('Get reports error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Get report by ID
 * GET /api/reports/:reportId
 */
async function getReportById(req, res) {
  try {
    const { reportId } = req.params;
    
    const report = await reportService.getReportById(reportId);
    
    sendSuccess(res, 200, report);
  } catch (error) {
    console.error('Get report by ID error:', error);
    sendError(res, 404, error.message);
  }
}

/**
 * Create a dispute
 * POST /api/orders/:orderId/dispute
 */
async function createDispute(req, res) {
  try {
    const { orderId } = req.params;
    const { reason, description, evidenceImages } = req.body;
    const buyerId = req.user.userId;
    
    // Validate required fields
    if (!reason || !description) {
      return sendError(res, 400, 'Vui lòng điền đầy đủ thông tin');
    }
    
    if (!evidenceImages || evidenceImages.length === 0) {
      return sendError(res, 400, 'Vui lòng cung cấp ít nhất 1 ảnh bằng chứng');
    }
    
    const dispute = await reportService.createDispute(
      buyerId, 
      orderId, 
      reason, 
      description, 
      evidenceImages
    );
    
    sendSuccess(res, 200, dispute, 'Tạo khiếu nại thành công');
  } catch (error) {
    console.error('Create dispute error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Get disputes
 * GET /api/disputes
 */
async function getDisputes(req, res) {
  try {
    const { status, page, limit } = req.query;
    const userId = req.user.userId;
    
    const filters = {};
    if (status) filters.status = status;
    
    // Regular users can only see their own disputes
    // TODO: Add role check for admin/moderator to see all disputes
    filters.buyerId = userId;
    
    const pagination = { page, limit };
    
    const result = await reportService.getDisputes(filters, pagination);
    
    sendSuccess(res, 200, result);
  } catch (error) {
    console.error('Get disputes error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Get dispute by ID
 * GET /api/disputes/:disputeId
 */
async function getDisputeById(req, res) {
  try {
    const { disputeId } = req.params;
    const userId = req.user.userId;
    
    const dispute = await reportService.getDisputeById(disputeId, userId);
    
    sendSuccess(res, 200, dispute);
  } catch (error) {
    console.error('Get dispute by ID error:', error);
    sendError(res, 404, error.message);
  }
}

/**
 * Add seller response to dispute
 * POST /api/disputes/:disputeId/respond
 */
async function addSellerResponse(req, res) {
  try {
    const { disputeId } = req.params;
    const { response, evidenceImages } = req.body;
    const sellerId = req.user.userId;
    
    // Validate required fields
    if (!response) {
      return sendError(res, 400, 'Vui lòng nhập phản hồi');
    }
    
    const dispute = await reportService.addSellerResponse(
      disputeId, 
      sellerId, 
      response, 
      evidenceImages
    );
    
    sendSuccess(res, 200, dispute, 'Phản hồi khiếu nại thành công');
  } catch (error) {
    console.error('Add seller response error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Get current user's reports
 * GET /api/reports/my-reports
 */
async function getMyReports(req, res) {
  try {
    const userId = req.user.userId;
    const { page, limit } = req.query;
    
    const pagination = { page, limit };
    
    const result = await reportService.getUserReports(userId, pagination);
    
    sendSuccess(res, 200, result);
  } catch (error) {
    console.error('Get my reports error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Get current user's disputes
 * GET /api/disputes/my-disputes
 */
async function getMyDisputes(req, res) {
  try {
    const userId = req.user.userId;
    const { page, limit } = req.query;
    
    const pagination = { page, limit };
    
    const result = await reportService.getUserDisputes(userId, pagination);
    
    sendSuccess(res, 200, result);
  } catch (error) {
    console.error('Get my disputes error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Xử lý báo cáo (Dành riêng cho Moderator/Admin)
 * PUT /api/reports/:reportId/resolve
 */
async function resolveReport(req, res) {
  try {
    const { reportId } = req.params;
    // Lấy các quyết định từ body của request do Moderator gửi lên
    const { status, moderatorDecision, moderatorNotes, moderatorReply, moderatorReplyToReportedUser } = req.body;
    // Lấy ID của Moderator đang thao tác
    const moderatorId = req.user.userId;

    // Kiểm tra xem Moderator đã gửi đủ thông tin bắt buộc chưa
    if (!status || !moderatorDecision) {
      return sendError(res, 400, 'Thiếu thông tin xử lý (status, hoặc moderatorDecision)');
    }

    // Gọi service để thực hiện việc cập nhật Database
    const report = await reportService.resolveReport(
      reportId, 
      moderatorId, 
      status, 
      moderatorDecision, 
      moderatorNotes,
      moderatorReply,
      moderatorReplyToReportedUser
    );

    sendSuccess(res, 200, report, 'Đã xử lý báo cáo thành công');
  } catch (error) {
    console.error('Resolve report error:', error);
    sendError(res, 400, error.message);
  }
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
  getMyReports,
  getMyDisputes,
  resolveReport
};