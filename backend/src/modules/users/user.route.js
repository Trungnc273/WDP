const express = require('express');
const { authenticate } = require('../../common/middlewares/auth.middleware');
const userController = require('./user.controller');

const router = express.Router();

/**
 * User Routes
 * Profile and KYC management
 */

// Get current user profile
router.get('/profile', authenticate, userController.getProfile);

// Update user profile
router.put('/profile', authenticate, userController.updateProfile);

// Upload avatar
router.post('/avatar', authenticate, userController.uploadAvatar);

// Change password
router.post('/change-password', authenticate, userController.changePassword);

// Submit KYC verification
router.post('/kyc', authenticate, userController.submitKYC);

// Get KYC status
router.get('/kyc/status', authenticate, userController.getKYCStatus);

// Get public profile (no auth required)
router.get('/:id/public', userController.getPublicProfile);

// Get user statistics (no auth required)
router.get('/:id/stats', userController.getUserStats);

module.exports = router;