// Lưu trữ OTP tạm thời: Key là email, Value là thông tin đăng ký + OTP
const otpStorage = new Map();

const otpManager = {
  // Sinh mã 6 số và lưu thông tin người dùng muốn đăng ký
  generateAndSaveOtp: (email, userData) => {
    // Random 6 số: 100000 -> 999999
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu vào Map, bao gồm cả data đăng ký để lát lấy ra tạo DB
    otpStorage.set(email.toLowerCase(), {
      otpCode,
      userData,
      expiresAt: Date.now() + 5 * 60 * 1000, // Hết hạn sau 5 phút
    });

    return otpCode;
  },

  // Kiểm tra OTP khi người dùng submit
  verifyOtp: (email, inputOtp) => {
    const record = otpStorage.get(email.toLowerCase());

    if (!record) {
      return {
        valid: false,
        message: "Không tìm thấy yêu cầu đăng ký hoặc mã đã hết hạn.",
      };
    }

    if (Date.now() > record.expiresAt) {
      otpStorage.delete(email.toLowerCase());
      return {
        valid: false,
        message: "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.",
      };
    }

    if (record.otpCode !== inputOtp.toString()) {
      return { valid: false, message: "Mã OTP không chính xác." };
    }

    // Nếu đúng, trả về userData và xóa record khỏi bộ nhớ
    const userData = record.userData;
    otpStorage.delete(email.toLowerCase());

    return { valid: true, userData };
  },
};

module.exports = otpManager;
