const authService = require('./auth.service');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

/**
 * Register a new user
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { email, password, fullName } = req.body;

    // Validate required fields
    if (!email || !password || !fullName) {
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

    // Call service to register user
    const result = await authService.registerUser(email, password, fullName);

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

module.exports = {
  register,
  login,
  getProfile,
  logout
};
