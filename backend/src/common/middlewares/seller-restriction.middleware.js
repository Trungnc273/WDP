const User = require('../../modules/users/user.model');
const { sendError } = require('../utils/response.util');
const {
  refreshSellingRestriction,
  getSellingRestrictionMessage
} = require('../utils/seller-restriction.util');

async function requireSellerCanSell(req, res, next) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 401, 'Không tìm thấy thông tin người dùng');
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 401, 'User không tồn tại');
    }

    const isSellingRestricted = await refreshSellingRestriction(user);
    if (isSellingRestricted) {
      return sendError(res, 403, getSellingRestrictionMessage(user));
    }

    next();
  } catch (error) {
    console.error('Seller restriction middleware error:', error);
    return sendError(res, 500, 'Lỗi kiểm tra quyền bán');
  }
}

module.exports = {
  requireSellerCanSell
};
