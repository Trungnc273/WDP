const { sendError } = require('../utils/response.util');

/**
 * Global error handling middleware
 * Catches all errors and sends appropriate response
 */
function errorHandler(err, req, res, next) {
  // Log error details server-side
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return sendError(res, 400, 'Dữ liệu không hợp lệ', errors);
  }

  // Mongoose duplicate key error (unique constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = field === 'email' 
      ? 'Email đã được sử dụng' 
      : `${field} đã tồn tại`;
    return sendError(res, 400, message);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, 400, 'ID không hợp lệ');
  }

  // JWT errors (should be handled in auth middleware, but just in case)
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Token không hợp lệ');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Token đã hết hạn');
  }

  // Custom application errors with statusCode
  if (err.statusCode) {
    return sendError(res, err.statusCode, err.message);
  }

  // Default server error
  // Don't expose internal error details to client
  return sendError(res, 500, 'Lỗi hệ thống, vui lòng thử lại sau');
}

/**
 * Handle 404 Not Found errors
 */
function notFoundHandler(req, res, next) {
  return sendError(res, 404, 'Không tìm thấy tài nguyên');
}

module.exports = {
  errorHandler,
  notFoundHandler
};
