import React from 'react';
import './Footer.css';

/**
 * Footer Component
 * Chợ Tốt style footer with multiple sections
 */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        {/* Customer Support Section */}
        <div className="footer__section">
          <h3 className="footer__title">Hỗ trợ khách hàng</h3>
          <ul className="footer__links">
            <li><a href="#help-center">Trung tâm trợ giúp</a></li>
            <li><a href="#safety">An toàn mua bán</a></li>
            <li><a href="#contact">Liên hệ hỗ trợ</a></li>
            <li><a href="#rules">Quy định sử dụng</a></li>
            <li><a href="#fees">Bảng giá dịch vụ</a></li>
          </ul>
        </div>

        {/* About ReFlow Section */}
        <div className="footer__section">
          <h3 className="footer__title">Về ReFlow</h3>
          <ul className="footer__links">
            <li><a href="#about">Giới thiệu</a></li>
            <li><a href="#careers">Tuyển dụng</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#terms">Điều khoản sử dụng</a></li>
            <li><a href="#privacy">Chính sách bảo mật</a></li>
          </ul>
        </div>

        {/* Links Section */}
        <div className="footer__section">
          <h3 className="footer__title">Liên kết</h3>
          <ul className="footer__links">
            <li><a href="#facebook">Facebook</a></li>
            <li><a href="#youtube">YouTube</a></li>
            <li><a href="#instagram">Instagram</a></li>
            <li><a href="#linkedin">LinkedIn</a></li>
            <li><a href="#twitter">Twitter</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer__bottom">
        <div className="footer__container">
          <p className="footer__copyright">
            © 2026 ReFlow. Tất cả quyền được bảo lưu.
          </p>
          <div className="footer__payment">
            <span>Phương thức thanh toán:</span>
            <div className="footer__payment-icons">
              <span>💳</span>
              <span>🏦</span>
              <span>📱</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
