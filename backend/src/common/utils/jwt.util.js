const jwt = require('jsonwebtoken');
const config = require('../../config/env');

const JWT_SECRET = config.jwt.secret;

/**
 * Generate JWT token with user payload
 * @param {Object} payload - User data to encode in token (userId, email, role)
 * @param {String} expiresIn - Token expiration time (default: 7 days)
 * @returns {String} JWT token
 */
function generateJWT(payload, expiresIn = '7d') {
  if (!payload || !payload.userId) {
    throw new Error('Payload must contain userId');
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify and decode JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
function verifyToken(token) {
  if (!token || token.trim().length === 0) {
    throw new Error('Token không hợp lệ');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token đã hết hạn');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token không hợp lệ');
    } else {
      throw error;
    }
  }
}

module.exports = {
  generateJWT,
  verifyToken
};
