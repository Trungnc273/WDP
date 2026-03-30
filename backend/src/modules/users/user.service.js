const User = require('./user.model');
const bcrypt = require('bcryptjs');
const { validateStrongPassword } = require('../../common/validators/password.validator');

const PHONE_REGEX = /^0\d{9,10}$/;

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
  
  if (status === 'suspended') {
    query.isSuspended = true;
  } else if (status === 'active') {
    query.isSuspended = false;
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
  
  // Handle suspension
  if (filteredData.isSuspended === false) {
    filteredData.suspendedUntil = undefined;
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
    throw new Error('Không thể khóa tài khoản admin');
  }
  
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      isSuspended: true,
      suspendedUntil: suspendedUntil ? new Date(suspendedUntil) : undefined,
      violationCount: user.violationCount + 1
    },
    { new: true }
  ).select('-password');
  
  return updatedUser;
}

/**
 * Unsuspend user (Admin only)
 */
async function unsuspendUser(userId) {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      isSuspended: false,
      suspendedUntil: undefined
    },
    { new: true }
  ).select('-password');
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  return user;
}

/**
 * Get system statistics (Admin only)
 */
async function getSystemStats() {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isSuspended: false });
  const suspendedUsers = await User.countDocuments({ isSuspended: true });
  
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
  getSystemStats,
  getAdminDashboardStats
};
/**
 * Get admin dashboard stats (Admin only)
 */
async function getAdminDashboardStats() {
  try {
    // Get basic user stats first
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      usersByRole
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isSuspended: false }),
      User.countDocuments({ isSuspended: true }),
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    return {
      // User management stats
      userStats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      
      // Moderation stats (simplified for now)
      moderationStats: {
        pendingReports: 0,
        reviewingReports: 0,
        unresolvedReports: 0,
        pendingWithdrawals: 0,
        reportedReviews: 0,
        openOrders: 0,
        pendingDisputes: 0,
        pendingProducts: 0,
        recentReports: []
      }
    };
  } catch (error) {
    console.error('Error in getAdminDashboardStats:', error);
    throw error;
  }
}