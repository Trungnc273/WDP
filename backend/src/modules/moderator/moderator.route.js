const express = require("express");
const router = express.Router();

const moderatorController = require("./moderator.controller");

const { authenticate } = require("../../common/middlewares/auth.middleware");
const { requireRole } = require("../../common/middlewares/role.middleware");

/**
 * Middleware:
 * authenticate → phải login
 * requireRole → phải là moderator hoặc admin
 */

router.use(authenticate);
router.use(requireRole("moderator", "admin"));

router.get("/dashboard", moderatorController.getDashboardStats);

/**
 * Lấy danh sách sản phẩm chờ duyệt
 */
router.get(
  "/products/pending",
  moderatorController.getPendingProducts
);

/**
 * Ban user
 */
router.post(
  "/users/:id/ban",
  moderatorController.banUser
);

/**
 * Lấy danh sách report
 */
router.get(
  "/reports",
  moderatorController.getReports
);

router.get(
   "/reports/:reportId",
  moderatorController.getReportById
);

router.put(
  "/reports/:reportId/resolve", //api
  moderatorController.resolveReport
);

router.get(
  "/orders",
  moderatorController.getOrders
);

router.get(
  "/orders/:id",
  moderatorController.getOrderById
);

router.post(
  "/orders/:id/force-cancel",
  moderatorController.forceCancelOrder
);

router.patch(
  "/orders/:id/status",
  moderatorController.updateOrderStatus
);

router.get(
  "/reviews",
  moderatorController.getReviews
);

router.patch(
  "/reviews/:reviewId/hide",
  moderatorController.hideReview
);

router.patch(
  "/reviews/:reviewId/mark-bad",
  moderatorController.markSellerBadByReview
);

router.patch(
  "/reviews/:reviewId/mark-good",
  moderatorController.markSellerGoodByReview
);

router.get(
  "/withdrawals",
  moderatorController.getWithdrawals
);

router.patch(
  "/withdrawals/:withdrawalId/status",
  moderatorController.updateWithdrawalStatus
);

router.get(
  "/disputes",
  moderatorController.getDisputes
);

router.get(
  "/disputes/:disputeId",
  moderatorController.getDisputeById
);

router.patch(
  "/disputes/:disputeId/investigating",
  moderatorController.markDisputeInvestigating
);

router.post(
  "/disputes/:disputeId/message",
  moderatorController.sendDisputeMessage
);

router.put(
  "/disputes/:disputeId/resolve",
  moderatorController.resolveDispute
);

/**
 * Duyệt / từ chối sản phẩm
 */
router.patch("/products/:id/approve", moderatorController.approvePendingProduct);
router.patch("/products/:id/reject", moderatorController.rejectPendingProduct);

/**
 * Quản lý KYC
 */
router.get("/kyc/pending", moderatorController.getPendingKYCRequests);
router.post("/kyc/:userId/approve", moderatorController.approveKYC);
router.post("/kyc/:userId/reject", moderatorController.rejectKYC);

module.exports = router;