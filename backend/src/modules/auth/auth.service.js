const bcrypt = require("bcryptjs");
const User = require("../users/user.model");
const { generateJWT, verifyToken } = require("../../common/utils/jwt.util");
const {
  validateStrongPassword,
} = require("../../common/validators/password.validator");
const { createNotification } = require("../notifications/notification.service");
const admin = require("../../config/firebase");
const crypto = require("crypto");

/**
 * Login or Register with Google Firebase idToken
 * @param {String} idToken - Firebase idToken from client
 */
async function loginWithGoogle(idToken) {
  // 1. Verify token với Firebase Admin
  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    const err = new Error("Token Google không hợp lệ hoặc đã hết hạn");
    err.statusCode = 401;
    throw err;
  }

  const { email, name, picture } = decodedToken;

  if (!email) {
    const error = new Error("Không lấy được email từ tài khoản Google");
    error.statusCode = 400;
    throw error;
  }

  // 2. Kiểm tra xem user đã tồn tại chưa
  let user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // 3. NẾU USER CHƯA TỒN TẠI: Tạo mới
    // Sinh mật khẩu ngẫu nhiên cực mạnh để vượt qua mọi policy và đảm bảo bảo mật
    const randomPassword = crypto.randomBytes(16).toString("hex") + "A1@";
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Tạo user mới. Model không bắt buộc phone và address nên không cần truyền.
    user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName: name || "Người dùng Google",
      avatar: picture || "/images/placeholders/avatar-placeholder.svg",
      role: "user",
      isVerified: true, // Google email thường đã verify
    });
  } else {
    // 4. NẾU USER ĐÃ TỒN TẠI: Kiểm tra khóa tài khoản (copy logic khóa từ hàm loginUser cũ)
    if (user.isSuspended) {
      const isModeratorReviewSuspension = String(
        user.suspendedReason || "",
      ).includes("Vi phạm đánh giá do moderator xử lý");
      const belowModeratorThreshold = Number(user.modBadReviewCount || 0) < 3;
      const isLegacyUnknownSuspension = !String(
        user.suspendedReason || "",
      ).trim();
      const belowViolationThreshold = Number(user.violationCount || 0) < 3;

      if (
        (isModeratorReviewSuspension && belowModeratorThreshold) ||
        (isLegacyUnknownSuspension &&
          belowModeratorThreshold &&
          belowViolationThreshold)
      ) {
        user.isSuspended = false;
        user.suspendedUntil = undefined;
        user.suspendedReason = undefined;
        await user.save();
      }

      const suspensionExpired =
        user.suspendedUntil && new Date(user.suspendedUntil) <= new Date();
      if (!user.isSuspended || suspensionExpired) {
        user.isSuspended = false;
        user.suspendedUntil = undefined;
        user.suspendedReason = undefined;
        await user.save();
      } else {
        const suspendedUntilText = user.suspendedUntil
          ? ` đến ${new Date(user.suspendedUntil).toLocaleString("vi-VN")}`
          : "";
        const reasonText = user.suspendedReason
          ? ` Lý do: ${user.suspendedReason}`
          : " Lý do: vi phạm chính sách của hệ thống.";
        const error = new Error(
          `Tài khoản đã bị khóa${suspendedUntilText}.${reasonText}`,
        );
        error.statusCode = 403;
        throw error;
      }
    }
  }

  // 5. Generate JWT token cho hệ thống nội bộ
  const token = generateJWT(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    "7d",
  );

  // 6. Trả về response
  const userResponse = {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    avatar: user.avatar,
    role: user.role,
    isVerified: user.isVerified,
    kycStatus: user.kycStatus,
  };

  return { user: userResponse, token };
}

async function generateAndSetTempPassword(email) {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    const error = new Error("Email không tồn tại trong hệ thống");
    error.statusCode = 404;
    throw error;
  }

  // Tạo mật khẩu ngẫu nhiên: 8 ký tự hex + 'A1@' để thỏa mãn mọi điều kiện validation
  const tempPassword = crypto.randomBytes(4).toString("hex") + "A1@";

  // Mã hóa mật khẩu tạm thời và lưu đè vào DB
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  user.password = hashedPassword;
  await user.save();
  try {
    await createNotification(user._id, {
      type: "security",
      title: "⚠️ Đổi mật khẩu bảo mật",
      message:
        'Tài khoản của bạn vừa được đăng nhập bằng mật khẩu tạm thời. Để đảm bảo an toàn tuyệt đối, vui lòng vào mục "Đổi mật khẩu" để cập nhật lại mật khẩu mới của riêng bạn ngay lập tức.',
    });
  } catch (notifError) {
    console.error("Lỗi khi tạo thông báo nhắc đổi pass:", notifError);
  }
  return tempPassword;
}

/**
 * Register a new user
 * @param {String} email - User email
 * @param {String} password - User password (plain text)
 * @param {String} fullName - User full name
 * @returns {Object} { user, token }
 */
async function registerUser(email, password, fullName, phone, address) {
  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error("Email đã được sử dụng");
    error.statusCode = 400;
    throw error;
  }

  // Hash password with bcrypt (10 salt rounds)
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const user = await User.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    fullName: fullName.trim(),
    phone: phone.trim(),
    address: address.trim(),
    role: "user",
  });

  // Generate JWT token
  const token = generateJWT(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    "7d",
  );

  // Return user without password
  const userResponse = {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    address: user.address,
    role: user.role,
    isVerified: user.isVerified,
    kycStatus: user.kycStatus,
  };

  return { user: userResponse, token };
}

/**
 * Login user with email and password
 * @param {String} email - User email
 * @param {String} password - User password (plain text)
 * @returns {Object} { user, token }
 */
async function loginUser(email, password) {
  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const error = new Error("Email hoặc mật khẩu không đúng");
    error.statusCode = 401;
    throw error;
  }

  // Check if account is suspended
  if (user.isSuspended) {
    const isModeratorReviewSuspension = String(
      user.suspendedReason || "",
    ).includes("Vi phạm đánh giá do moderator xử lý");
    const belowModeratorThreshold = Number(user.modBadReviewCount || 0) < 3;
    const isLegacyUnknownSuspension = !String(
      user.suspendedReason || "",
    ).trim();
    const belowViolationThreshold = Number(user.violationCount || 0) < 3;

    if (
      (isModeratorReviewSuspension && belowModeratorThreshold) ||
      (isLegacyUnknownSuspension &&
        belowModeratorThreshold &&
        belowViolationThreshold)
    ) {
      user.isSuspended = false;
      user.suspendedUntil = undefined;
      user.suspendedReason = undefined;
      await user.save();
    }

    const suspensionExpired =
      user.suspendedUntil && new Date(user.suspendedUntil) <= new Date();
    if (!user.isSuspended || suspensionExpired) {
      user.isSuspended = false;
      user.suspendedUntil = undefined;
      user.suspendedReason = undefined;
      await user.save();
    } else {
      const suspendedUntilText = user.suspendedUntil
        ? ` đến ${new Date(user.suspendedUntil).toLocaleString("vi-VN")}`
        : "";
      const reasonText = user.suspendedReason
        ? ` Lý do: ${user.suspendedReason}`
        : " Lý do: vi phạm chính sách của hệ thống.";
      const error = new Error(
        `Tài khoản đã bị khóa${suspendedUntilText}.${reasonText}`,
      );
      error.statusCode = 403;
      throw error;
    }
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error("Email hoặc mật khẩu không đúng");
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT token
  const token = generateJWT(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    "7d",
  );

  // Return user without password
  const userResponse = {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    address: user.address,
    role: user.role,
    isVerified: user.isVerified,
    kycStatus: user.kycStatus,
  };

  return { user: userResponse, token };
}

/**
 * Get user by ID
 * @param {String} userId - User ID
 * @returns {Object} User data without password
 */
async function getUserById(userId) {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  if (user.isSuspended) {
    const isModeratorReviewSuspension = String(
      user.suspendedReason || "",
    ).includes("Vi phạm đánh giá do moderator xử lý");
    const belowModeratorThreshold = Number(user.modBadReviewCount || 0) < 3;
    const isLegacyUnknownSuspension = !String(
      user.suspendedReason || "",
    ).trim();
    const belowViolationThreshold = Number(user.violationCount || 0) < 3;

    if (
      (isModeratorReviewSuspension && belowModeratorThreshold) ||
      (isLegacyUnknownSuspension &&
        belowModeratorThreshold &&
        belowViolationThreshold)
    ) {
      user.isSuspended = false;
      user.suspendedUntil = undefined;
      user.suspendedReason = undefined;
      await user.save();
    }

    const suspensionExpired =
      user.suspendedUntil && new Date(user.suspendedUntil) <= new Date();
    if (!user.isSuspended || suspensionExpired) {
      user.isSuspended = false;
      user.suspendedUntil = undefined;
      user.suspendedReason = undefined;
      await user.save();
    } else {
      const suspendedUntilText = user.suspendedUntil
        ? ` đến ${new Date(user.suspendedUntil).toLocaleString("vi-VN")}`
        : "";
      const reasonText = user.suspendedReason
        ? ` Lý do: ${user.suspendedReason}`
        : " Lý do: vi phạm chính sách của hệ thống.";
      const error = new Error(
        `Tài khoản đã bị khóa${suspendedUntilText}.${reasonText}`,
      );
      error.statusCode = 403;
      throw error;
    }
  }

  return {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isVerified: user.isVerified,
    kycStatus: user.kycStatus,
  };
}

/**
 * Change password for an authenticated user
 * @param {String} userId - ID of the user who is changing password
 * @param {String} currentPassword - Current plain text password
 * @param {String} newPassword - New plain text password
 */
async function changeUserPassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  const passwordValidation = validateStrongPassword(newPassword);
  if (!passwordValidation.valid) {
    const error = new Error(passwordValidation.message);
    error.statusCode = 400;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    const error = new Error("Mật khẩu hiện tại không đúng");
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  return true;
}

/**
 * Generate a short-lived token for resetting password
 * This implementation is stateless (does not modify user model),
 * so it is convenient to test via Postman.
 * @param {String} email - User email
 * @returns {String} reset token (JWT)
 */
async function generatePasswordResetToken(email) {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    const error = new Error("Email không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  const token = generateJWT(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      purpose: "password_reset",
    },
    "1h",
  );

  return token;
}

/**
 * Reset password using a password reset token
 * @param {String} token - Password reset token (JWT)
 * @param {String} newPassword - New plain text password
 */
async function resetPasswordWithToken(token, newPassword) {
  let decoded;

  try {
    decoded = verifyToken(token);
  } catch (error) {
    error.statusCode = error.statusCode || 400;
    throw error;
  }

  if (decoded.purpose !== "password_reset") {
    const err = new Error("Token đặt lại mật khẩu không hợp lệ");
    err.statusCode = 400;
    throw err;
  }

  const passwordValidation = validateStrongPassword(newPassword);
  if (!passwordValidation.valid) {
    const err = new Error(passwordValidation.message);
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    const error = new Error("User không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  return true;
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  changeUserPassword,
  generatePasswordResetToken,
  resetPasswordWithToken,
  loginWithGoogle,
  generateAndSetTempPassword,
};
