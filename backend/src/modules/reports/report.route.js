const express = require('express');
const { authenticate } = require('../../common/middlewares/auth.middleware');
const reportController = require('./report.controller');

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
router.get('/reports', authenticate, reportController.getReports);

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

// Add seller response to dispute
router.post('/disputes/:disputeId/respond', authenticate, reportController.addSellerResponse);

module.exports = router;