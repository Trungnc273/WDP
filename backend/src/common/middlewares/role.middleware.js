const { sendError } = require('../utils/response.util');

/**
 * Middleware kiểm tra quyền truy cập theo vai trò (Role)
 * Mục đích: Chặn những user bình thường (role='user') không cho gọi các API của Admin/Moderator.
 * * @param  {...String} roles - Danh sách các role được phép (VD: 'moderator', 'admin')
 * Cách dùng: router.get('/api/...', authenticate, requireRole('admin', 'moderator'), controller.hamXuLy)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    // 1. Kiểm tra xem user đã đăng nhập chưa 
    // (Middleware `authenticate` chạy trước đó phải gán thông tin vào req.user)
    if (!req.user || !req.user.role) {
      return sendError(res, 401, 'Không tìm thấy thông tin xác thực, vui lòng đăng nhập lại');
    }

    // 2. Kiểm tra xem role của user hiện tại có nằm trong danh sách được phép không
    // Ví dụ: req.user.role là 'user', nhưng roles cho phép là ['admin', 'moderator'] => Bị chặn
    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'Từ chối truy cập: Bạn không có quyền thực hiện thao tác này');
    }

    // 3. Nếu hợp lệ, cho phép đi tiếp đến controller
    next();
  };
};

module.exports = { requireRole };