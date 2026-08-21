export default function getHTML(otp) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Verification</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.08);">
          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 20px;">
              <h1 style="margin:0;color:#ffffff;font-size:32px;">💬 ChatApp</h1>
              <p style="margin:10px 0 0;color:#e0e7ff;font-size:16px;">
                Secure Email Verification
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 35px;color:#333333;">
              <h2 style="margin-top:0;font-size:26px;">
                Verify Your Email
              </h2>

              <p style="font-size:16px;line-height:1.7;color:#555;">
                Hi there,
              </p>

              <p style="font-size:16px;line-height:1.7;color:#555;">
                Thank you for signing up! To complete your registration, please use the One-Time Password (OTP) below.
              </p>

              <!-- OTP -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:30px 0;">
                    <div style="
                      display:inline-block;
                      background:#f3f4f6;
                      border:2px dashed #6366f1;
                      border-radius:12px;
                      padding:18px 40px;
                      font-size:36px;
                      font-weight:bold;
                      letter-spacing:10px;
                      color:#4f46e5;">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size:15px;color:#666;line-height:1.7;">
                This OTP will expire in <strong>10 minutes</strong>. Please do not share it with anyone.
              </p>

              <p style="font-size:15px;color:#666;line-height:1.7;">
                If you didn't request this verification, you can safely ignore this email.
              </p>

              <hr style="border:none;border-top:1px solid #eeeeee;margin:35px 0;">

              <p style="margin:0;font-size:14px;color:#888;">
                Need help? Reply to this email or contact our support team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background:#f9fafb;padding:25px;color:#888;font-size:13px;">
              © 2026 ChatApp. All rights reserved.
              <br><br>
              Made with ❤️ for secure conversations.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
//# sourceMappingURL=EmailTemplate.js.map