/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {*} data - Response data
 * @param {String} message - Optional success message
 */
function sendSuccess(res, statusCode = 200, data = null, message = null) {
  const response = {
    success: true
  };

  if (message) {
    response.message = message;
  }

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {*} errors - Optional detailed errors
 */
function sendError(res, statusCode = 500, message = 'Đã xảy ra lỗi', errors = null) {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @param {Number} total - Total number of items
 */
function sendPaginated(res, data, page, limit, total) {
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  });
}

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated
};
