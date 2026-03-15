/**
 * Shared password validation for change-password and reset-password flows.
 * Strong password: min 8 chars, at least one uppercase, one lowercase, one digit, one special char.
 */
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const STRONG_PASSWORD_MESSAGE =
  'Mật khẩu mới phải tối thiểu 8 ký tự và gồm chữ hoa, chữ thường, số, ký tự đặc biệt';

/**
 * Validate that a password meets the strong password policy.
 * @param {string} password - Plain text password
 * @returns {{ valid: boolean, message?: string }}
 */
function validateStrongPassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Mật khẩu không được để trống' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Mật khẩu phải có ít nhất 8 ký tự' };
  }
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    return { valid: false, message: STRONG_PASSWORD_MESSAGE };
  }
  return { valid: true };
}

module.exports = {
  STRONG_PASSWORD_REGEX,
  STRONG_PASSWORD_MESSAGE,
  validateStrongPassword
};
