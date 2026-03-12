const express = require('express');
const { authenticate } = require('../../common/middlewares/auth.middleware');
const { requireAdmin, requireAdminOrModerator } = require('../../common/middlewares/admin.middleware');
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
/**
 * Admin Routes
 * User management for administrators
 */

// Get all users (Admin only)
router.get('/admin/users', authenticate, requireAdmin, userController.getAllUsers);

// Get system statistics (Admin only)
router.get('/admin/stats', authenticate, requireAdmin, userController.getSystemStats);

// Create new user (Admin only)
router.post('/admin/users', authenticate, requireAdmin, userController.createUser);

// Get user by ID (Admin view)
router.get('/admin/users/:id', authenticate, requireAdmin, userController.getUserByIdAdmin);

// Update user (Admin only)
router.put('/admin/users/:id', authenticate, requireAdmin, userController.updateUserAdmin);

// Delete user (Admin only)
router.delete('/admin/users/:id', authenticate, requireAdmin, userController.deleteUser);

// Suspend user (Admin only)
router.post('/admin/users/:id/suspend', authenticate, requireAdmin, userController.suspendUser);

// Unsuspend user (Admin only)
router.post('/admin/users/:id/unsuspend', authenticate, requireAdmin, userController.unsuspendUser);

