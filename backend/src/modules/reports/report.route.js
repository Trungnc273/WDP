const express = require('express');
const { authenticate } = require('../../common/middlewares/auth.middleware');
const reportController = require('./report.controller');
const { requireRole } = require('../../common/middlewares/role.middleware');
const router = express.Router();

/**
 * Report & Dispute Routes
 * Most routes require authentication
 */

// Create product report
router.post('/reports/product', authenticate, reportController.createProductReport);

// Create user report
router.post('/reports/user', authenticate, reportController.createUserReport);

// Get current user's reports (must come before /:reportId)
router.get('/reports/my-reports', authenticate, reportController.getMyReports);

// Get reports (admin/moderator only - TODO: add role middleware)
// ==========================================
// CÁC ROUTE DÀNH CHO MODERATOR / ADMIN
// ==========================================

// Lấy danh sách tất cả các báo cáo (Chỉ admin và moderator mới được xem)
// GET /api/reports
router.get('/reports', authenticate, requireRole('admin', 'moderator'), reportController.getReports);

// Moderator xử lý báo cáo (Đưa ra quyết định: xóa bài, ban user, bỏ qua...)
// PUT /api/reports/:reportId/resolve
router.put('/reports/:reportId/resolve', authenticate, requireRole('admin', 'moderator'), reportController.resolveReport);

// Get report by ID
router.get('/reports/:reportId', authenticate, reportController.getReportById);

// Create dispute
router.post('/orders/:orderId/dispute', authenticate, reportController.createDispute);

// Get current user's disputes (must come before /:disputeId)
router.get('/disputes/my-disputes', authenticate, reportController.getMyDisputes);

// Get disputes
router.get('/disputes', authenticate, reportController.getDisputes);

// Get dispute by ID
router.get('/disputes/:disputeId', authenticate, reportController.getDisputeById);

// Get dispute by order ID (buyer or seller)
router.get('/orders/:orderId/dispute', authenticate, reportController.getDisputeByOrderId);

// Add seller response to dispute
router.post('/disputes/:disputeId/respond', authenticate, reportController.addSellerResponse);

// Buyer adds follow-up evidence/notes after dispute is opened
router.post('/disputes/:disputeId/buyer-follow-up', authenticate, reportController.addBuyerFollowUp);

// Seller confirms returned item received (Th3)
router.post('/disputes/:disputeId/confirm-return', authenticate, reportController.confirmSellerReturn);

module.exports = router;