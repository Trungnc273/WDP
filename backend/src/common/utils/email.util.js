const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendTempPasswordEmail(toEmail, tempPassword) {
  const mailOptions = {
    from: `"Reflow" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Mật khẩu tạm thời của bạn",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
        <h2 style="color: #000;">Xin chào,</h2>
        <p>Hệ thống đã nhận được yêu cầu cấp lại mật khẩu cho tài khoản của bạn.</p>
        <p>Đây là mật khẩu tạm thời của bạn:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; letter-spacing: 2px; font-weight: bold; color: #1a1a1a; margin: 20px 0; border: 1px dashed #ccc;">
          ${tempPassword}
        </div>
        
        <div style="background-color: #fff1f0; border-left: 4px solid #ff4d4f; padding: 12px 16px; margin: 24px 0;">
          <p style="color: #cf1322; margin: 0; font-size: 14px;">
            <strong>⚠️ Lưu ý bảo mật:</strong> Để đảm bảo an toàn tuyệt đối cho tài khoản, xin vui lòng thay đổi mật khẩu của bạn ngay sau khi đã đăng nhập thành công.
          </p>
        </div>

        <p>Nếu bạn không yêu cầu cấp lại mật khẩu, xin vui lòng bỏ qua email này hoặc liên hệ ngay với bộ phận hỗ trợ của chúng tôi để được trợ giúp.</p>
        <br/>
        <p>Trân trọng,<br/><strong>Đội ngũ Reflow</strong></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendTempPasswordEmail };
