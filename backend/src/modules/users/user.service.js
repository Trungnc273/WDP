const User = require('./user.model');
const bcrypt = require('bcryptjs');

const PHONE_REGEX = /^0\d{9,10}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/**
 * User Service
 * Handles user profile and KYC operations
 */

/**
 * Get user by ID (public profile)
 */
async function getUserById(userId) {
  const user = await User.findById(userId).select('-password -kycDocuments');
  
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
    'fullName avatar rating totalReviews createdAt isVerified kycStatus'
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
  ).select('-password -kycDocuments');
  
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
  ).select('-password -kycDocuments');
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  return user;
}

/**
 * Submit KYC verification
 */
async function submitKYC(userId, kycData) {
  const { idCardFront, idCardBack, selfie } = kycData;
  
  // Validate required documents
  if (!idCardFront || !idCardBack || !selfie) {
    throw new Error('Vui lòng cung cấp đầy đủ 3 ảnh: CMND/CCCD mặt trước, mặt sau và ảnh selfie');
  }
  
  // Check if user exists
  const existingUser = await User.findById(userId);
  if (!existingUser) {
    throw new Error('Người dùng không tồn tại');
  }
  
  // Check if KYC already approved
  if (existingUser.kycStatus === 'approved') {
    throw new Error('Tài khoản đã được xác thực rồi');
  }
  
  // Check if KYC is pending
  if (existingUser.kycStatus === 'pending') {
    throw new Error('Yêu cầu xác thực đang được xử lý. Vui lòng chờ kết quả.');
  }
  
  const user = await User.findByIdAndUpdate(
    userId,
    {
      kycStatus: 'pending',
      kycDocuments: {
        idCardFront,
        idCardBack,
        selfie
      },
      kycSubmittedAt: new Date(),
      // Clear previous rejection data
      kycRejectedAt: undefined,
      kycRejectionReason: undefined
    },
    { new: true }
  ).select('-password');
  
  return user;
}

/**
 * Get KYC status
 */
async function getKYCStatus(userId) {
  const user = await User.findById(userId).select(
    'kycStatus kycSubmittedAt kycApprovedAt kycRejectedAt kycRejectionReason'
  );
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  return {
    status: user.kycStatus,
    submittedAt: user.kycSubmittedAt,
    approvedAt: user.kycApprovedAt,
    rejectedAt: user.kycRejectedAt,
    rejectionReason: user.kycRejectionReason
  };
}

/**
 * Change password
 */
async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    throw new Error('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới');
  }
  
  // Chính sách mật khẩu mạnh cho khu vực quản trị.
  if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
    throw new Error('Mật khẩu mới phải tối thiểu 8 ký tự và gồm chữ hoa, chữ thường, số, ký tự đặc biệt');
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
  submitKYC,
  getKYCStatus,
  changePassword,
  getUserStats
};