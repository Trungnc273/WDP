const { sendError } = require('../utils/response.util');

/**
 * Admin middleware - Check if user has admin role
 */
function requireAdmin(req, res, next) {
  try {
    // Check if user is authenticated (should be handled by auth middleware first)
    if (!req.user) {
      return sendError(res, 401, 'Vui lòng đăng nhập');
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return sendError(res, 403, 'Bạn không có quyền truy cập chức năng này');
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    sendError(res, 500, 'Lỗi server');
  }
}

/**
 * Admin or Moderator middleware - Check if user has admin or moderator role
 */
function requireAdminOrModerator(req, res, next) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return sendError(res, 401, 'Vui lòng đăng nhập');
    }

    // Check if user has admin or moderator role
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return sendError(res, 403, 'Bạn không có quyền truy cập chức năng này');
    }

    next();
  } catch (error) {
    console.error('Admin/Moderator middleware error:', error);
    sendError(res, 500, 'Lỗi server');
  }
}

module.exports = {
  requireAdmin,
  requireAdminOrModerator
};