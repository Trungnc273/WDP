const authService = require("./auth.service");
const { sendSuccess, sendError } = require("../../common/utils/response.util");
const {
  validateStrongPassword,
} = require("../../common/validators/password.validator");
const { createNotification } = require("../notifications/notification.service");
const { verifyToken } = require("../../common/utils/jwt.util");
const { sendTempPasswordEmail, sendRegisterOtpEmail, sendLogin2faOtpEmail } = require("../../common/utils/email.util");
const otpManager = require("../../common/utils/otp.manager");
const User = require("../users/user.model");

/**
 * Yêu cầu gửi OTP đăng ký
 * POST /api/auth/register/request-otp
 */
async function requestRegisterOtp(req, res, next) {
  try {
    const { email, password, fullName, phone, address } = req.body;

    // Validate (giữ nguyên logic validate cũ của bảnh)
    if (!email || !password || !fullName || !phone || !address) {
      return sendError(res, 400, "Vui lòng điền đầy đủ thông tin");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, "Email không hợp lệ");
    }
    if (password.length < 6) {
      return sendError(res, 400, "Mật khẩu phải có ít nhất 6 ký tự");
    }
    if (fullName.trim().length === 0) {
      return sendError(res, 400, "Họ tên không được để trống");
    }
    const phoneRegex = /^0\d{9,10}$/;
    if (!phoneRegex.test(phone.trim())) {
      return sendError(
        res,
        400,
        "Số điện thoại phải bắt đầu bằng 0 và có 10-11 chữ số",
      );
    }
    if (address.trim().length === 0) {
      return sendError(res, 400, "Địa chỉ không được để trống");
    }

    // Kiểm tra xem email đã tồn tại trong DB chưa trước khi gửi OTP
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 400, "Email đã được sử dụng trong hệ thống");
    }

    const existingPhone = await User.findOne({ phone: phone.trim() });
    if (existingPhone) {
      return sendError(res, 400, "Số điện thoại này đã được đăng ký cho một tài khoản khác");
    }

    // Đưa data vào quản lý OTP và lấy mã
    const otpCode = otpManager.generateAndSaveOtp(email, {
      email,
      password,
      fullName,
      phone,
      address,
    });

    // Gửi email
    await sendRegisterOtpEmail(email, otpCode);

    return sendSuccess(
      res,
      200,
      null,
      "Mã xác thực OTP đã được gửi đến email của bạn.",
    );
  } catch (error) {
    return sendError(res, 500, error.message || "Yêu cầu gửi OTP thất bại");
  }
}

/**
 * Xác thực OTP và Tạo tài khoản
 * POST /api/auth/register/verify
 */
async function verifyAndRegister(req, res, next) {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return sendError(res, 400, "Vui lòng cung cấp email và mã OTP");
    }

    // Kiểm tra OTP
    const otpCheck = otpManager.verifyOtp(email, otpCode);
    if (!otpCheck.valid) {
      return sendError(res, 400, otpCheck.message);
    }

    // Nếu OTP đúng, gọi service đăng ký gốc (bản thân service registerUser đã băm mật khẩu và lưu DB)
    const {
      email: savedEmail,
      password,
      fullName,
      phone,
      address,
    } = otpCheck.userData;

    const result = await authService.registerUser(
      savedEmail,
      password,
      fullName,
      phone,
      address,
    );

    return sendSuccess(res, 201, result, "Đăng ký tài khoản thành công");
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Đăng ký thất bại",
    );
  }
}

async function googleLogin(req, res, next) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return sendError(res, 400, "Vui lòng cung cấp idToken của Google");
    }

    const result = await authService.loginWithGoogle(idToken);

    return sendSuccess(res, 200, result, "Đăng nhập Google thành công");
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Đăng nhập Google thất bại",
    );
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
      return sendError(res, 400, "Vui lòng điền đầy đủ thông tin");
    }

    // Call service to login user
    const result = await authService.loginUser(email, password);
    if (result.requires2FA) {
      const otpCode = otpManager.generateAndSaveOtp(result.user.email, { purpose: 'login_2fa', userId: result.user.id });
      await sendLogin2faOtpEmail(result.user.email, otpCode);
      
      return sendSuccess(res, 200, { requires2FA: true, email: result.user.email }, "Mã OTP đã được gửi đến email để xác thực 2FA");
    }

    return sendSuccess(res, 200, result, "Đăng nhập thành công");
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Đăng nhập thất bại",
    );
  }
}


async function verifyLogin2FA(req, res, next) {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) return sendError(res, 400, "Vui lòng cung cấp email và mã OTP");

    const otpCheck = otpManager.verifyOtp(email, otpCode);
    if (!otpCheck.valid || otpCheck.userData.purpose !== 'login_2fa') {
      return sendError(res, 400, otpCheck.message || "Mã OTP không hợp lệ");
    }

    // Đã verify OTP đúng, tiến hành cấp Token
    const result = await authService.complete2FALogin(otpCheck.userData.userId);
    return sendSuccess(res, 200, result, "Đăng nhập 2FA thành công");
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || "Xác thực 2FA thất bại");
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
    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Không thể lấy thông tin hồ sơ",
    );
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

    return sendSuccess(res, 200, null, "Đăng xuất thành công");
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Đăng xuất thất bại",
    );
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
      return sendError(
        res,
        400,
        "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới",
      );
    }

    const passwordValidation = validateStrongPassword(newPassword);
    if (!passwordValidation.valid) {
      return sendError(res, 400, passwordValidation.message);
    }

    const userId = req.user.userId;

    await authService.changeUserPassword(userId, currentPassword, newPassword);

    // Send notification for password change
    await createNotification(userId, {
      type: "system",
      title: "Mật khẩu đã được thay đổi",
      message:
        "Mật khẩu của bạn đã được thay đổi thành công. Nếu không phải bạn thực hiện, vui lòng liên hệ hỗ trợ ngay lập tức.",
    });

    return sendSuccess(res, 200, null, "Đổi mật khẩu thành công");
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Đổi mật khẩu thất bại",
    );
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
      return sendError(res, 400, "Vui lòng nhập email");
    }

    // 1. Tạo và lưu mật khẩu tạm thời vào DB
    const tempPassword = await authService.generateAndSetTempPassword(email);

    // 2. Gửi mật khẩu đó qua email cho khách
    await sendTempPasswordEmail(email, tempPassword);

    // 3. Trả về thông báo thành công (Tuyệt đối không gửi tempPassword về Frontend ở cục response này)
    return sendSuccess(
      res,
      200,
      null,
      "Mật khẩu mới đã được gửi vào email của bạn. Vui lòng kiểm tra hộp thư.",
    );
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Yêu cầu cấp lại mật khẩu thất bại",
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
    //validate đầu vào
    if (!token || !newPassword) {
      return sendError(res, 400, "Vui lòng cung cấp token và mật khẩu mới");
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
      return sendError(res, 400, "Token không hợp lệ");
    }
    //đổi mật khẩu trong Database qua Service
    await authService.resetPasswordWithToken(token, newPassword);

    //gửi thông báo hệ thống để cảnh báo người dùng
    await createNotification(decoded.userId, {
      type: "security",
      title: "Mật khẩu đã được đặt lại",
      message:
        "Mật khẩu của bạn đã được đặt lại thành công. Nếu không phải bạn thực hiện, vui lòng liên hệ hỗ trợ ngay lập tức.",
    });

    return sendSuccess(res, 200, null, "Đặt lại mật khẩu thành công");
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Đặt lại mật khẩu thất bại",
    );
  }
}

module.exports = {
  requestRegisterOtp,
  verifyAndRegister,
  login,
  verifyLogin2FA,
  getProfile,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  googleLogin,
};
