const User = require('./user.model');
const bcrypt = require('bcryptjs');
const { validateStrongPassword } = require('../../common/validators/password.validator');
const Order = require('../orders/order.model');
const Product = require('../products/product.model');
const PurchaseRequest = require('../orders/purchase-request.model');
const Report = require('../reports/report.model');
const Transaction = require('../payments/transaction.model');
const Review = require('../reports/review.model');
const Dispute = require('../reports/dispute.model');
const {
  applySellingRestrictionToUser,
  clearSellingRestriction
} = require('../../common/utils/seller-restriction.util');

const PHONE_REGEX = /^0\d{9,10}$/;
const ORDER_TERMINAL_STATUSES = ['completed', 'cancelled'];

function getViolationBasedRestrictionDurationMs(violationCount) {
  if (violationCount >= 9) {
    return 365 * 24 * 60 * 60 * 1000; // 1 year
  }
  if (violationCount >= 6) {
    return 7 * 24 * 60 * 60 * 1000; // 1 week
  }
  return 24 * 60 * 60 * 1000; // default 24h
}

async function hasActiveOrdersForUser(userId) {
  return Order.exists({
    status: { $nin: ORDER_TERMINAL_STATUSES },
    $or: [
      { buyerId: userId },
      { sellerId: userId }
    ]
  });
}

/**
 * User Service
 * Handles user profile operations
 */

/**
 * Get user by ID (public profile)
 */
async function getUserById(userId) {
  const user = await User.findById(userId).select('-password');
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  return user;
}

/**
 * Get public profile (for seller info)
 */
async function getPublicProfile(userId) {
  const user = await User.findById(userId).select(
    'fullName avatar rating totalReviews createdAt'
  );
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }

  if (filteredData.isSellingRestricted === true) {
    await Product.updateMany(
      {
        seller: user._id,
        status: 'active'
      },
      {
        status: 'hidden'
      }
    );
  }
  
  return user;
}

/**
 * Update user profile
 */
async function updateProfile(userId, updateData) {
  const allowedFields = ['fullName', 'phone', 'address'];
  const filteredData = {};
  
  // Only allow specific fields to be updated
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  });
  
  if (Object.keys(filteredData).length === 0) {
    throw new Error('Không có dữ liệu để cập nhật');
  }
  
  // Chuẩn hóa dữ liệu đầu vào trước khi validate/lưu.
  if (filteredData.fullName !== undefined) {
    filteredData.fullName = String(filteredData.fullName).trim();
  }

  if (filteredData.phone !== undefined) {
    filteredData.phone = String(filteredData.phone).trim();
  }

  if (filteredData.address !== undefined) {
    filteredData.address = String(filteredData.address).trim();
  }

  // Validate required fields
  if (filteredData.fullName && filteredData.fullName.length < 2) {
    throw new Error('Họ tên phải có ít nhất 2 ký tự');
  }

  if (filteredData.fullName && filteredData.fullName.length > 80) {
    throw new Error('Họ tên không được vượt quá 80 ký tự');
  }
  
  if (filteredData.phone && !PHONE_REGEX.test(filteredData.phone)) {
    throw new Error('Số điện thoại phải bắt đầu bằng 0 và có 10-11 chữ số');
  }

  if (filteredData.address && filteredData.address.length > 255) {
    throw new Error('Địa chỉ không được vượt quá 255 ký tự');
  }

  if (filteredData.phone) {
    const existingPhoneUser = await User.findOne({
      phone: filteredData.phone,
      _id: { $ne: userId } // Loại trừ chính user hiện tại đang update
    });

    if (existingPhoneUser) {
      throw new Error('Số điện thoại này đã được sử dụng bởi một tài khoản khác');
    }
  }
  
  const user = await User.findByIdAndUpdate(
    userId,
    filteredData,
    { new: true, runValidators: true }
  ).select('-password');
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  return user;
}

/**
 * Upload avatar
 */
async function uploadAvatar(userId, avatarUrl) {
  if (!avatarUrl) {
    throw new Error('URL avatar không hợp lệ');
  }
  
  const user = await User.findByIdAndUpdate(
    userId,
    { avatar: avatarUrl },
    { new: true }
  ).select('-password');
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  return user;
}

/**
 * Change password
 */
async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    throw new Error('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới');
  }

  const passwordValidation = validateStrongPassword(newPassword);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new Error('Mật khẩu hiện tại không đúng');
  }
  
  // Hash new password
  const saltRounds = 10;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
  
  // Update password
  await User.findByIdAndUpdate(userId, { password: hashedNewPassword });
  
  return { message: 'Đổi mật khẩu thành công' };
}

/**
 * Get user statistics
 */
async function getUserStats(userId) {
  const user = await User.findById(userId).select('rating totalReviews createdAt');
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  // You could add more statistics here like:
  // - Total products sold
  // - Total orders
  // - etc.
  
  return {
    rating: user.rating,
    totalReviews: user.totalReviews,
    memberSince: user.createdAt
  };
}

module.exports = {
  getUserById,
  getPublicProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  getUserStats
};

/**
 * Admin CRUD Operations
 */

/**
 * Get all users with pagination (Admin only)
 */
async function getAllUsers(page = 1, limit = 10, search = '', role = '', status = '') {
  const skip = (page - 1) * limit;
  const now = new Date();

  const activeSellingRestrictionCondition = {
    $and: [
      { isSellingRestricted: true },
      {
        $or: [
          { sellingRestrictedUntil: { $exists: false } },
          { sellingRestrictedUntil: null },
          { sellingRestrictedUntil: { $gt: now } }
        ]
      }
    ]
  };

  const activeAccountSuspensionCondition = {
    $and: [
      { isSuspended: true },
      {
        $or: [
          { suspendedUntil: { $exists: false } },
          { suspendedUntil: null },
          { suspendedUntil: { $gt: now } }
        ]
      }
    ]
  };

  const effectiveAccountSuspendedCondition = activeAccountSuspensionCondition;

  const effectiveSellingRestrictedCondition = {
    $and: [
      { role: { $ne: 'moderator' } },
      activeSellingRestrictionCondition
    ]
  };
  
  // Build query
  const query = {};
  
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (role && role !== 'all') {
    query.role = role;
  }
  
  if (status === 'account_suspended') {
    query.$and = query.$and || [];
    query.$and.push(effectiveAccountSuspendedCondition);
  } else if (status === 'selling_restricted' || status === 'suspended') {
    query.$and = query.$and || [];
    query.$and.push(effectiveSellingRestrictedCondition);
  } else if (status === 'active') {
    query.$nor = query.$nor || [];
    query.$nor.push(effectiveSellingRestrictedCondition);
    query.$nor.push(effectiveAccountSuspendedCondition);
  }
  
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await User.countDocuments(query);
  
  return {
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
}

/**
 * Get user by ID (Admin view with full details)
 */
async function getUserByIdAdmin(userId) {
  const user = await User.findById(userId).select('-password');
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  return user;
}

/**
 * Create new user (Admin only)
 */
async function createUser(userData) {
  const { email, password, fullName, phone, address, role = 'user' } = userData;
  
  // Validate required fields
  if (!email || !password || !fullName) {
    throw new Error('Email, mật khẩu và họ tên là bắt buộc');
  }
  
  if (password.length < 6) {
    throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
  }
  
  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error('Email đã được sử dụng');
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = new User({
    email: email.toLowerCase(),
    password: hashedPassword,
    fullName,
    phone,
    address,
    role
  });
  
  await user.save();
  
  // Return user without password
  return await User.findById(user._id).select('-password');
}

/**
 * Update user (Admin only)
 */
async function updateUserAdmin(userId, updateData) {
  const allowedFields = ['fullName', 'phone', 'address', 'role', 'isSuspended'];
  const filteredData = {};
  
  // Only allow specific fields to be updated
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  });
  
  if (Object.keys(filteredData).length === 0) {
    throw new Error('Không có dữ liệu để cập nhật');
  }

  if (filteredData.isSuspended === true) {
    const existingUser = await User.findById(userId).select('role');
    if (!existingUser) {
      throw new Error('Người dùng không tồn tại');
    }
    if (existingUser.role === 'admin') {
      throw new Error('Không thể hạn chế quyền bán của admin');
    }

    filteredData.isSellingRestricted = true;
    filteredData.sellingRestrictionSource = 'admin';
    filteredData.isSuspended = false;
  }
  
  // Preserve compatibility for existing admin edit forms.
  if (filteredData.isSuspended === false) {
    filteredData.suspendedUntil = undefined;
    filteredData.isSellingRestricted = false;
    filteredData.sellingRestrictedUntil = undefined;
    filteredData.sellingRestrictedReason = undefined;
    filteredData.sellingRestrictionSource = undefined;
  }
  
  const user = await User.findByIdAndUpdate(
    userId,
    filteredData,
    { new: true, runValidators: true }
  ).select('-password');
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  return user;
}

/**
 * Delete user (Admin only)
 */
async function deleteUser(userId) {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  // Don't allow deleting admin users
  if (user.role === 'admin') {
    throw new Error('Không thể xóa tài khoản admin');
  }

  const hasActiveOrders = await hasActiveOrdersForUser(userId);
  if (hasActiveOrders) {
    throw new Error('Không thể xóa tài khoản khi người dùng đang có đơn hàng đang xử lý');
  }

  const hasOrderHistory = await Order.exists({
    $or: [
      { buyerId: userId },
      { sellerId: userId }
    ]
  });

  if (hasOrderHistory) {
    throw new Error('Không thể xóa người dùng vì đã có đơn hàng');
  }

  const hasPendingPurchase = await PurchaseRequest.exists({
    $or: [
      { buyerId: userId },
      { sellerId: userId }
    ],
    status: 'pending'
  });

  if (hasPendingPurchase) {
    throw new Error('Không thể xóa người dùng vì đang có giao dịch mua');
  }
  
  await User.findByIdAndDelete(userId);
  
  return { message: 'Xóa người dùng thành công' };
}

/**
 * Suspend user (Admin only)
 */
async function suspendUser(userId, suspendedUntil, reason) {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  if (user.role === 'admin') {
    throw new Error('Không thể hạn chế quyền bán của admin');
  }

  if (user.role === 'moderator') {
    const hasActiveOrders = await hasActiveOrdersForUser(userId);
    if (hasActiveOrders) {
      throw new Error('Không thể khóa tài khoản khi moderator đang có đơn hàng đang xử lý');
    }

    user.isSuspended = true;
    user.suspendedUntil = suspendedUntil ? new Date(suspendedUntil) : undefined;
    user.suspendedReason = String(reason || '').trim() || 'Tài khoản moderator bị khóa bởi admin.';
    await clearSellingRestriction(user);
    await user.save();

    return User.findById(userId).select('-password');
  }

  const nextViolationCount = (user.violationCount || 0) + 1;
  const defaultDurationMs = getViolationBasedRestrictionDurationMs(nextViolationCount);

  await applySellingRestrictionToUser(user, {
    until: suspendedUntil,
    durationMs: suspendedUntil ? undefined : defaultDurationMs,
    reason: reason || `Quyền bán bị hạn chế bởi admin theo mức vi phạm lần ${nextViolationCount}.`,
    source: 'admin',
    hideActiveProducts: true
  });

  user.isSuspended = false;
  user.suspendedUntil = undefined;
  user.suspendedReason = undefined;
  user.violationCount = nextViolationCount;
  await user.save();

  return User.findById(userId).select('-password');
}

/**
 * Unsuspend user (Admin only)
 */
async function unsuspendUser(userId) {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }

  if (user.role === 'moderator') {
    user.isSuspended = false;
    user.suspendedUntil = undefined;
    user.suspendedReason = undefined;
    await user.save();
    return User.findById(userId).select('-password');
  }

  await clearSellingRestriction(user);
  user.isSuspended = false;
  user.suspendedUntil = undefined;
  user.suspendedReason = undefined;
  await user.save();
  
  return User.findById(userId).select('-password');
}

/**
 * Lock moderator account (Admin only)
 */
async function lockModeratorAccount(userId, suspendedUntil, reason) {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }

  if (user.role !== 'moderator') {
    throw new Error('Chỉ áp dụng khóa tài khoản cho moderator');
  }

  const hasActiveOrders = await hasActiveOrdersForUser(userId);
  if (hasActiveOrders) {
    throw new Error('Không thể khóa tài khoản khi người dùng đang có đơn hàng đang xử lý');
  }

  user.isSuspended = true;
  user.suspendedUntil = suspendedUntil ? new Date(suspendedUntil) : undefined;
  user.suspendedReason = String(reason || '').trim() || 'Tài khoản moderator bị khóa bởi admin.';
  await clearSellingRestriction(user);
  await user.save();

  return User.findById(userId).select('-password');
}

/**
 * Unlock moderator account (Admin only)
 */
async function unlockModeratorAccount(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }

  if (user.role !== 'moderator') {
    throw new Error('Chỉ áp dụng mở khóa tài khoản cho moderator');
  }

  user.isSuspended = false;
  user.suspendedUntil = undefined;
  user.suspendedReason = undefined;
  await user.save();

  return User.findById(userId).select('-password');
}

/**
 * Get system statistics (Admin only)
 */
async function getSystemStats() {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isSellingRestricted: false });
  const suspendedUsers = await User.countDocuments({ isSellingRestricted: true });
  
  const usersByRole = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return {
    totalUsers,
    activeUsers,
    suspendedUsers,
    usersByRole: usersByRole.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
}

module.exports = {
  getUserById,
  getPublicProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  getUserStats,
  // Admin functions
  getAllUsers,
  getUserByIdAdmin,
  createUser,
  updateUserAdmin,
  deleteUser,
  suspendUser,
  unsuspendUser,
  lockModeratorAccount,
  unlockModeratorAccount,
  getSystemStats,
  getAdminDashboardStats
};
/**
 * Get admin dashboard stats (Admin only)
 */
async function getAdminDashboardStats() {
  try {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      usersByRole,
      pendingReports,
      reviewingReports,
      unresolvedReports,
      pendingWithdrawals,
      pendingReviews,
      openOrders,
      pendingDisputes,
      recentReports
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isSellingRestricted: false }),
      User.countDocuments({ isSellingRestricted: true }),
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'reviewing' }),
      Report.countDocuments({ status: { $in: ['pending', 'reviewing'] } }),
      Transaction.countDocuments({ type: 'withdrawal', status: 'pending' }),
      Review.countDocuments({
        status: 'active',
        'moderatorAssessment.isReviewed': { $ne: true },
        'moderatorAssessment.isBad': { $ne: true },
        'moderatorAssessment.verdict': { $nin: ['good', 'bad'] }
      }),
      Order.countDocuments({ status: { $in: ['awaiting_seller_confirmation', 'awaiting_payment', 'paid', 'shipped'] } }),
      Dispute.countDocuments({ status: { $in: ['pending', 'investigating'] } }),
      Report.find({ status: { $in: ['pending', 'reviewing'] } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('reporterId', 'fullName email')
        .populate('reportedUserId', 'fullName email')
        .populate('productId', 'title')
    ]);

    return {
      userStats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },

      moderationStats: {
        pendingReports,
        reviewingReports,
        unresolvedReports,
        pendingWithdrawals,
        pendingReviews,
        reportedReviews: pendingReviews,
        openOrders,
        pendingDisputes,
        pendingProducts: 0,
        recentReports
      }
    };
  } catch (error) {
    console.error('Error in getAdminDashboardStats:', error);
    throw error;
  }
}
