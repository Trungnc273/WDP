const bcrypt = require('bcryptjs');
const User = require('../users/user.model');
const { generateJWT } = require('../../common/utils/jwt.util');

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
    const error = new Error('Email đã được sử dụng');
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
    role: 'user'
  });

  // Generate JWT token
  const token = generateJWT({
    userId: user._id,
    email: user.email,
    role: user.role
  }, '7d');

  // Return user without password
  const userResponse = {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    address: user.address,
    role: user.role,
    isVerified: user.isVerified
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
    const error = new Error('Email hoặc mật khẩu không đúng');
    error.statusCode = 401;
    throw error;
  }

  // Check if account is suspended
  if (user.isSuspended) {
    const isModeratorReviewSuspension = String(user.suspendedReason || '').includes('Vi phạm đánh giá do moderator xử lý');
    const belowModeratorThreshold = Number(user.modBadReviewCount || 0) < 3;
    const isLegacyUnknownSuspension = !String(user.suspendedReason || '').trim();
    const belowViolationThreshold = Number(user.violationCount || 0) < 3;

    if (
      (isModeratorReviewSuspension && belowModeratorThreshold) ||
      (isLegacyUnknownSuspension && belowModeratorThreshold && belowViolationThreshold)
    ) {
      user.isSuspended = false;
      user.suspendedUntil = undefined;
      user.suspendedReason = undefined;
      await user.save();
    }

    const suspensionExpired = user.suspendedUntil && new Date(user.suspendedUntil) <= new Date();
    if (!user.isSuspended || suspensionExpired) {
      user.isSuspended = false;
      user.suspendedUntil = undefined;
      user.suspendedReason = undefined;
      await user.save();
    } else {
      const suspendedUntilText = user.suspendedUntil
        ? ` đến ${new Date(user.suspendedUntil).toLocaleString('vi-VN')}`
        : '';
      const reasonText = user.suspendedReason
        ? ` Lý do: ${user.suspendedReason}`
        : ' Lý do: vi phạm chính sách của hệ thống.';
      const error = new Error(`Tài khoản đã bị khóa${suspendedUntilText}.${reasonText}`);
      error.statusCode = 403;
      throw error;
    }
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Email hoặc mật khẩu không đúng');
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT token
  const token = generateJWT({
    userId: user._id,
    email: user.email,
    role: user.role
  }, '7d');

  // Return user without password
  const userResponse = {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    address: user.address,
    role: user.role,
    isVerified: user.isVerified
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
    const error = new Error('User không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  if (user.isSuspended) {
    const isModeratorReviewSuspension = String(user.suspendedReason || '').includes('Vi phạm đánh giá do moderator xử lý');
    const belowModeratorThreshold = Number(user.modBadReviewCount || 0) < 3;
    const isLegacyUnknownSuspension = !String(user.suspendedReason || '').trim();
    const belowViolationThreshold = Number(user.violationCount || 0) < 3;

    if (
      (isModeratorReviewSuspension && belowModeratorThreshold) ||
      (isLegacyUnknownSuspension && belowModeratorThreshold && belowViolationThreshold)
    ) {
      user.isSuspended = false;
      user.suspendedUntil = undefined;
      user.suspendedReason = undefined;
      await user.save();
    }

    const suspensionExpired = user.suspendedUntil && new Date(user.suspendedUntil) <= new Date();
    if (!user.isSuspended || suspensionExpired) {
      user.isSuspended = false;
      user.suspendedUntil = undefined;
      user.suspendedReason = undefined;
      await user.save();
    } else {
      const suspendedUntilText = user.suspendedUntil
        ? ` đến ${new Date(user.suspendedUntil).toLocaleString('vi-VN')}`
        : '';
      const reasonText = user.suspendedReason
        ? ` Lý do: ${user.suspendedReason}`
        : ' Lý do: vi phạm chính sách của hệ thống.';
      const error = new Error(`Tài khoản đã bị khóa${suspendedUntilText}.${reasonText}`);
      error.statusCode = 403;
      throw error;
    }
  }

  return {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isVerified: user.isVerified
  };
}

module.exports = {
  registerUser,
  loginUser,
  getUserById
};
