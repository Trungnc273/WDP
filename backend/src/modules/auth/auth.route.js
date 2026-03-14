const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');

/**
 * POST /api/auth/register
 * Register a new user
 * Public route
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Login user
 * Public route
 */
router.post('/login', authController.login);

/**
 * GET /api/auth/profile
 * Get user profile
 * Protected route - requires authentication
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * POST /api/auth/logout
 * Logout user
 * Protected route - requires authentication
 */
router.post('/logout', authenticate, authController.logout);

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 * Protected route - requires authentication
 */
router.post('/change-password', authenticate, authController.changePassword);

/**
 * POST /api/auth/forgot-password
 * Request password reset token
 * Public route
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * Reset password using reset token
 * Public route
 */
router.post('/reset-password', authController.resetPassword);

module.exports = router;
