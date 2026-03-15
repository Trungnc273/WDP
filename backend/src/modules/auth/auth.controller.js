const authService = require('./auth.service');
const { sendSuccess, sendError } = require('../../common/utils/response.util');
const { validateStrongPassword } = require('../../common/validators/password.validator');
const { createNotification } = require('../notifications/notification.service');
const { verifyToken } = require('../../common/utils/jwt.util');

/**
 * Register a new user
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { email, password, fullName, phone, address } = req.body;

    // Validate required fields
    if (!email || !password || !fullName || !phone || !address) {
      return sendError(res, 400, 'Vui lòng điền đầy đủ thông tin');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, 'Email không hợp lệ');
    }

    // Validate password length
    if (password.length < 6) {
      return sendError(res, 400, 'Mật khẩu phải có ít nhất 6 ký tự');
    }

    // Validate full name not empty
    if (fullName.trim().length === 0) {
      return sendError(res, 400, 'Họ tên không được để trống');
    }

    // Validate phone
    const phoneRegex = /^0\d{9,10}$/;
    if (!phoneRegex.test(phone.trim())) {
      return sendError(res, 400, 'Số điện thoại phải bắt đầu bằng 0 và có 10-11 chữ số');
    }

    // Validate address not empty
    if (address.trim().length === 0) {
      return sendError(res, 400, 'Địa chỉ không được để trống');
    }

    // Call service to register user
    const result = await authService.registerUser(email, password, fullName, phone, address);

    return sendSuccess(res, 201, result, 'Đăng ký thành công');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Đăng ký thất bại');
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return sendError(res, 400, 'Vui lòng điền đầy đủ thông tin');
    }

    // Call service to login user
    const result = await authService.loginUser(email, password);

    return sendSuccess(res, 200, result, 'Đăng nhập thành công');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Đăng nhập thất bại');
  }
}

/**
 * Get user profile
 * GET /api/auth/profile
 * Protected route - requires authentication
 */
async function getProfile(req, res, next) {
  try {
    // User info is already attached to req by auth middleware
    const userId = req.user.userId;

    // Get user data from service
    const user = await authService.getUserById(userId);

    return sendSuccess(res, 200, user);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Không thể lấy thông tin hồ sơ');
  }
}

/**
 * Logout user
 * POST /api/auth/logout
 * Protected route - requires authentication
 * Note: JWT is stateless, so logout is handled client-side by removing token
 * This endpoint exists for consistency and future enhancements (e.g., token blacklist)
 */
async function logout(req, res, next) {
  try {
    // In JWT-based auth, logout is primarily client-side
    // Client should remove token from localStorage
    // This endpoint can be used for logging or future token blacklist implementation
    
    return sendSuccess(res, 200, null, 'Đăng xuất thành công');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Đăng xuất thất bại');
  }
}

/**
 * Change password for authenticated user
 * POST /api/auth/change-password
 * Protected route - requires authentication
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, 400, 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới');
    }

    const passwordValidation = validateStrongPassword(newPassword);
    if (!passwordValidation.valid) {
      return sendError(res, 400, passwordValidation.message);
    }

    const userId = req.user.userId;

    await authService.changeUserPassword(userId, currentPassword, newPassword);

    // Send notification for password change
    await createNotification(userId, {
      type: 'system',
      title: 'Mật khẩu đã được thay đổi',
      message: 'Mật khẩu của bạn đã được thay đổi thành công. Nếu không phải bạn thực hiện, vui lòng liên hệ hỗ trợ ngay lập tức.'
    });

    return sendSuccess(res, 200, null, 'Đổi mật khẩu thành công');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Đổi mật khẩu thất bại');
  }
}

/**
 * Request password reset
 * POST /api/auth/forgot-password
 * Public route
 * For now, returns reset token directly so it can be tested via Postman.
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, 'Vui lòng nhập email');
    }

    const resetToken = await authService.generatePasswordResetToken(email);

    return sendSuccess(
      res,
      200,
      { resetToken },
      'Tạo token đặt lại mật khẩu thành công'
    );
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || 'Yêu cầu đặt lại mật khẩu thất bại'
    );
  }
}

/**
 * Reset password using reset token
 * POST /api/auth/reset-password
 * Public route (token-based)
 */
async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return sendError(res, 400, 'Vui lòng cung cấp token và mật khẩu mới');
    }

    const passwordValidation = validateStrongPassword(newPassword);
    if (!passwordValidation.valid) {
      return sendError(res, 400, passwordValidation.message);
    }

    // Decode token to get userId for notification
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return sendError(res, 400, 'Token không hợp lệ');
    }

    await authService.resetPasswordWithToken(token, newPassword);

    // Send notification for password reset
    await createNotification(decoded.userId, {
      type: 'security',
      title: 'Mật khẩu đã được đặt lại',
      message: 'Mật khẩu của bạn đã được đặt lại thành công. Nếu không phải bạn thực hiện, vui lòng liên hệ hỗ trợ ngay lập tức.'
    });

    return sendSuccess(res, 200, null, 'Đặt lại mật khẩu thành công');
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || 'Đặt lại mật khẩu thất bại'
    );
  }
}

module.exports = {
  register,
  login,
  getProfile,
  logout,
  changePassword,
  forgotPassword,
  resetPassword
};
