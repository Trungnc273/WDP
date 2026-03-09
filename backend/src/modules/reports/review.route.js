const express = require('express');
const { authenticate } = require('../../common/middlewares/auth.middleware');
const reviewController = require('./review.controller');

const router = express.Router();

/**
 * Review Routes
 * All routes require authentication
 */

// Create review (rate seller after order completion)
router.post('/orders/:orderId/rate', authenticate, reviewController.createReview);

// Get review by order ID
router.get('/orders/:orderId/review', reviewController.getReviewByOrderId);

// Check if user can review an order
router.get('/orders/:orderId/can-review', authenticate, reviewController.canReviewOrder);

// Get reviews for a user (seller)
router.get('/users/:userId/reviews', reviewController.getReviews);

// Get rating statistics for a user
router.get('/users/:userId/rating-stats', reviewController.getRatingStats);

// Get review by ID
router.get('/reviews/:reviewId', reviewController.getReviewById);

// Update review
router.put('/reviews/:reviewId', authenticate, reviewController.updateReview);

// Delete review (hide)
router.delete('/reviews/:reviewId', authenticate, reviewController.deleteReview);

// Get reviews written by current user
router.get('/reviews/my-reviews', authenticate, reviewController.getMyReviews);

module.exports = router;