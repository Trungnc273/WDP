const { verifyToken } = require('../utils/jwt.util');
const { sendError } = require('../utils/response.util');
const User = require('../../modules/users/user.model');

/**
 * Middleware to verify JWT token and authenticate user
 * Extracts token from Authorization header, verifies it, and attaches user to request
 */
async function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Token không hợp lệ');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return sendError(res, 401, error.message);
    }

    // Check if user still exists in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return sendError(res, 401, 'User không tồn tại');
    }

    // Check if user account is suspended
    if (user.isSuspended) {
      return sendError(res, 403, 'Tài khoản đã bị khóa');
    }

    // Attach user info to request object (without password)
    req.user = {
      userId: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isVerified: user.isVerified
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return sendError(res, 500, 'Lỗi xác thực');
  }
}

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't block if token is missing
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);
      
      if (user && !user.isSuspended) {
        req.user = {
          userId: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isVerified: user.isVerified
        };
      }
    } catch (error) {
      // Ignore token errors for optional auth
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next();
  }
}

module.exports = {
  authenticate,
  optionalAuthenticate
};
