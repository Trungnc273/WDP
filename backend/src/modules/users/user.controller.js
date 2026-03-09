const userService = require('./user.service');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

/**
 * User Controller
 * Handles user profile and KYC endpoints
 */

/**
 * Get current user profile
 * GET /api/users/profile
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.userId;
    const user = await userService.getUserById(userId);
    
    sendSuccess(res, 200, user);
  } catch (error) {
    console.error('Get profile error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Update user profile
 * PUT /api/users/profile
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.userId;
    const { fullName, phone, address } = req.body;
    
    const user = await userService.updateProfile(userId, {
      fullName,
      phone,
      address
    });
    
    sendSuccess(res, 200, user, 'Cập nhật thông tin thành công');
  } catch (error) {
    console.error('Update profile error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Upload avatar
 * POST /api/users/avatar
 */
async function uploadAvatar(req, res) {
  try {
    const userId = req.user.userId;
    const { avatarUrl } = req.body;
    
    if (!avatarUrl) {
      return sendError(res, 400, 'Vui lòng cung cấp URL avatar');
    }
    
    const user = await userService.uploadAvatar(userId, avatarUrl);
    
    sendSuccess(res, 200, user, 'Cập nhật avatar thành công');
  } catch (error) {
    console.error('Upload avatar error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Get public profile (for viewing other users)
 * GET /api/users/:id/public
 */
async function getPublicProfile(req, res) {
  try {
    const { id } = req.params;
    const user = await userService.getPublicProfile(id);
    
    sendSuccess(res, 200, user);
  } catch (error) {
    console.error('Get public profile error:', error);
    sendError(res, 404, error.message);
  }
}

/**
 * Submit KYC verification
 * POST /api/users/kyc
 */
async function submitKYC(req, res) {
  try {
    const userId = req.user.userId;
    const { idCardFront, idCardBack, selfie } = req.body;
    
    if (!idCardFront || !idCardBack || !selfie) {
      return sendError(res, 400, 'Vui lòng cung cấp đầy đủ 3 ảnh: CMND/CCCD mặt trước, mặt sau và ảnh selfie');
    }
    
    const user = await userService.submitKYC(userId, {
      idCardFront,
      idCardBack,
      selfie
    });
    
    sendSuccess(res, 200, user, 'Gửi yêu cầu xác thực thành công. Chúng tôi sẽ xem xét trong 1-3 ngày làm việc.');
  } catch (error) {
    console.error('Submit KYC error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Get KYC status
 * GET /api/users/kyc/status
 */
async function getKYCStatus(req, res) {
  try {
    const userId = req.user.userId;
    const kycStatus = await userService.getKYCStatus(userId);
    
    sendSuccess(res, 200, kycStatus);
  } catch (error) {
    console.error('Get KYC status error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Change password
 * POST /api/users/change-password
 */
async function changePassword(req, res) {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return sendError(res, 400, 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới');
    }
    
    const result = await userService.changePassword(userId, currentPassword, newPassword);
    
    sendSuccess(res, 200, null, result.message);
  } catch (error) {
    console.error('Change password error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Get user statistics
 * GET /api/users/:id/stats
 */
async function getUserStats(req, res) {
  try {
    const { id } = req.params;
    const stats = await userService.getUserStats(id);
    
    sendSuccess(res, 200, stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    sendError(res, 404, error.message);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  getPublicProfile,
  submitKYC,
  getKYCStatus,
  changePassword,
  getUserStats
};