const userService = require('./user.service');
const { sendSuccess, sendError } = require('../../common/utils/response.util');
const { validateStrongPassword } = require('../../common/validators/password.validator');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Multer storage dành riêng cho avatar
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../../uploads/avatars');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${req.user.userId}-${Date.now()}${ext}`);
  }
});
const uploadAvatarMiddleware = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file ảnh'));
  }
}).single('avatar');

/**
 * User Controller
 * Handles user profile endpoints
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
    const { fullName, phone, address, specificAddress, location } = req.body;
    
    const user = await userService.updateProfile(userId, {
      fullName,
      phone,
      address,
      specificAddress,
      location
    });
    
    sendSuccess(res, 200, user, 'Cập nhật thông tin thành công');
  } catch (error) {
    console.error('Update profile error:', error.message);
    sendError(res, 400, error.message);
  }
}

/**
 * Upload avatar
 * POST /api/users/avatar
 */
async function uploadAvatar(req, res) {
  uploadAvatarMiddleware(req, res, async (err) => {
    if (err) return sendError(res, 400, err.message);

    try {
      const userId = req.user.userId;
      let avatarUrl;

      if (req.file) {
        // File upload thực tế qua multipart/form-data
        avatarUrl = `/uploads/avatars/${req.file.filename}`;
      } else if (req.body?.avatarUrl) {
        // Backward compat: gửi URL string qua JSON
        avatarUrl = req.body.avatarUrl;
      } else {
        return sendError(res, 400, 'Vui lòng cung cấp file ảnh hoặc URL avatar');
      }

      const user = await userService.uploadAvatar(userId, avatarUrl);
      sendSuccess(res, 200, user, 'Cập nhật avatar thành công');
    } catch (error) {
      console.error('Upload avatar error:', error);
      sendError(res, 400, error.message);
    }
  });
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

    const passwordValidation = validateStrongPassword(newPassword);
    if (!passwordValidation.valid) {
      return sendError(res, 400, passwordValidation.message);
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
  changePassword,
  getUserStats,
  // Admin functions
  getAllUsers,
  getUserByIdAdmin,
  createUser,
  updateUserAdmin,
  deleteUser,
  suspendUser,
  unsuspendUser,
  getSystemStats,
  getAdminDashboardStats
};

/**
 * Admin CRUD Operations
 */

/**
 * Get all users (Admin only)
 * GET /api/users/admin/users
 */
async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    
    const result = await userService.getAllUsers(page, limit, search, role, status);
    
    sendSuccess(res, 200, result);
  } catch (error) {
    console.error('Get all users error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Get user by ID (Admin view)
 * GET /api/users/admin/users/:id
 */
async function getUserByIdAdmin(req, res) {
  try {
    const { id } = req.params;
    const user = await userService.getUserByIdAdmin(id);
    
    sendSuccess(res, 200, user);
  } catch (error) {
    console.error('Get user by ID admin error:', error);
    sendError(res, 404, error.message);
  }
}

/**
 * Create new user (Admin only)
 * POST /api/users/admin/users
 */
async function createUser(req, res) {
  try {
    const { email, password, fullName, phone, address, role } = req.body;
    
    const user = await userService.createUser({
      email,
      password,
      fullName,
      phone,
      address,
      role
    });
    
    sendSuccess(res, 201, user, 'Tạo người dùng thành công');
  } catch (error) {
    console.error('Create user error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Update user (Admin only)
 * PUT /api/users/admin/users/:id
 */
async function updateUserAdmin(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const user = await userService.updateUserAdmin(id, updateData);
    
    sendSuccess(res, 200, user, 'Cập nhật người dùng thành công');
  } catch (error) {
    console.error('Update user admin error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Delete user (Admin only)
 * DELETE /api/users/admin/users/:id
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    
    const result = await userService.deleteUser(id);
    
    sendSuccess(res, 200, null, result.message);
  } catch (error) {
    console.error('Delete user error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Restrict selling permissions (Admin only)
 * POST /api/users/admin/users/:id/suspend
 */
async function suspendUser(req, res) {
  try {
    const { id } = req.params;
    const { suspendedUntil, reason } = req.body;
    
    const user = await userService.suspendUser(id, suspendedUntil, reason);
    
    sendSuccess(res, 200, user, 'Hạn chế quyền bán thành công');
  } catch (error) {
    console.error('Suspend user error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Remove selling restriction (Admin only)
 * POST /api/users/admin/users/:id/unsuspend
 */
async function unsuspendUser(req, res) {
  try {
    const { id } = req.params;
    
    const user = await userService.unsuspendUser(id);
    
    sendSuccess(res, 200, user, 'Đã gỡ hạn chế quyền bán thành công');
  } catch (error) {
    console.error('Unsuspend user error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Lock moderator account (Admin only)
 * POST /api/users/admin/users/:id/lock-account
 */
async function lockModeratorAccount(req, res) {
  try {
    const { id } = req.params;
    const { suspendedUntil, reason } = req.body;

    const user = await userService.lockModeratorAccount(id, suspendedUntil, reason);

    sendSuccess(res, 200, user, 'Đã khóa tài khoản moderator thành công');
  } catch (error) {
    console.error('Lock moderator account error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Unlock moderator account (Admin only)
 * POST /api/users/admin/users/:id/unlock-account
 */
async function unlockModeratorAccount(req, res) {
  try {
    const { id } = req.params;

    const user = await userService.unlockModeratorAccount(id);

    sendSuccess(res, 200, user, 'Đã mở khóa tài khoản moderator thành công');
  } catch (error) {
    console.error('Unlock moderator account error:', error);
    sendError(res, 400, error.message);
  }
}

/**
 * Get system statistics (Admin only)
 * GET /api/users/admin/stats
 */
async function getSystemStats(req, res) {
  try {
    const stats = await userService.getSystemStats();
    
    sendSuccess(res, 200, stats);
  } catch (error) {
    console.error('Get system stats error:', error);
    sendError(res, 400, error.message);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  getPublicProfile,
  changePassword,
  getUserStats,
  // Admin functions
  getAllUsers,
  getUserByIdAdmin,
  createUser,
  updateUserAdmin,
  deleteUser,
  suspendUser,
  unsuspendUser,
  lockModeratorAccount,
  unlockModeratorAccount,
  getSystemStats,
  getAdminDashboardStats
};
/**
 * Get admin dashboard stats (Admin only)
 * GET /api/users/admin/dashboard
 */
async function getAdminDashboardStats(req, res) {
  try {
    const stats = await userService.getAdminDashboardStats();
    
    sendSuccess(res, 200, stats);
  } catch (error) {
    console.error('Get admin dashboard stats error:', error);
    sendError(res, 400, error.message);
  }
}