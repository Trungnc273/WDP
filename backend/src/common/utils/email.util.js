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

async function sendRegisterOtpEmail(toEmail, otpCode) {
  const mailOptions = {
    from: `"Reflow Security" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Mã xác thực đăng ký tài khoản",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
        <h2 style="color: #000;">Xác thực tài khoản,</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại Reflow. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã xác thực (OTP) dưới đây:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 8px; font-size: 28px; letter-spacing: 5px; font-weight: bold; color: #1a1a1a; margin: 20px 0; border: 1px solid #ccc;">
          ${otpCode}
        </div>
        
        <p style="color: #666; font-size: 14px;">Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
        <br/>
        <p>Trân trọng,<br/><strong>Đội ngũ Reflow</strong></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendLogin2faOtpEmail(toEmail, otpCode) {
  const mailOptions = {
    from: `"Reflow Security" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Mã xác thực đăng nhập 2FA",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
        <h2 style="color: #000;">Xác thực đăng nhập,</h2>
        <p>Hệ thống phát hiện yêu cầu đăng nhập vào tài khoản của bạn. Vui lòng sử dụng mã xác thực (OTP) dưới đây để hoàn tất đăng nhập:</p>
        
        <div style="background-color: #e6f7ff; padding: 15px; text-align: center; border-radius: 8px; font-size: 28px; letter-spacing: 5px; font-weight: bold; color: #0050b3; margin: 20px 0; border: 1px solid #91d5ff;">
          ${otpCode}
        </div>
        
        <p style="color: #cf1322; font-size: 14px;"><strong>Lưu ý:</strong> Mã OTP có hiệu lực trong 5 phút. KHÔNG CHIA SẺ mã này cho bất kỳ ai.</p>
        <p>Nếu bạn không thực hiện đăng nhập, tài khoản của bạn có thể đang gặp rủi ro. Vui lòng đổi mật khẩu ngay lập tức.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendTempPasswordEmail, sendRegisterOtpEmail, sendLogin2faOtpEmail };
