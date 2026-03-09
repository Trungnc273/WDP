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

module.exports = router;
