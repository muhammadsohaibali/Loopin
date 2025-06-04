function otpTemplate(otp) {
  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; padding: 20px;">
      <!-- Outer border -->
      <div style="background-color: #4361ee; padding: 2px; border-radius: 12px;">
        <!-- Card -->
        <div style="background: #ffffff; border-radius: 10px; overflow: hidden;">

          <!-- Header -->
          <div style="padding: 30px 20px 10px; text-align: center; background: linear-gradient(135deg, #4cc9f0, #4361ee); color: white;">
            <img src="https://i.ibb.co/fdrJ4Gkz/nexa-ease-logo-transparent.png" alt="Loopin" style="height: 48px; width: auto; margin-bottom: 16px;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 600;">Your Verification Code</h1>
          </div>

          <!-- Message -->
          <div style="padding: 30px 40px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; color: #212529;">
              Use the code below to verify your email on <strong>Loopin</strong>.
              <br><strong style="color: #3f37c9;">Expires in 5 minutes.</strong>
            </p>

            <!-- OTP -->
            <div style="margin: 30px auto; max-width: 280px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 10px; padding: 16px;">
              <div style="font-size: 36px; font-weight: bold; color: #212529; letter-spacing: 10px;">
                ${otp}
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 20px; text-align: center; background: #f8f9fa; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d;">
            <p style="margin: 0;">If you didn’t request this, you can safely ignore this email.</p>
            <p style="margin: 0; margin-top: 6px;">© 2025 Loopin. All rights reserved.</p>
          </div>
        </div>
      </div>

      <!-- Watermark -->
      <p style="text-align: center; font-size: 11px; color: #adb5bd; margin-top: 16px;">
        Powered by Loopin Authentication
      </p>
    </div>
  `;
}

function EmailVerificationTemplate(otp, email, fullName = "User Name", verifyUrl = null) {
  verifyUrl
    = `http://${process.env.SERVER_ADDRESS}:${process.env.PORT}/auth/verify-email?email=${encodeURIComponent(email)}&otp=${otp}`
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Verify Your Email - Loopin</title>
  </head>
  <body style="margin:0; padding:0; font-family:Arial, sans-serif; background-color:#f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 0;">
      <tr>
        <td align="center">
          <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; padding: 40px; border-radius: 10px;">
            <tr>
              <td align="center" style="font-size:24px; font-weight:bold; color:#333;">
                Welcome to <span style="color:#007BFF;">Loopin</span>, ${fullName}!
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 20px 0; font-size:16px; color:#555;">
                Click the button below to verify your email and start connecting.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 30px 0;">
                <a href="${verifyUrl}" style="text-decoration:none; background-color:#007BFF; color:#fff; padding:12px 24px; border-radius:6px; font-weight:bold; display:inline-block;">
                  Verify Email
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" style="font-size:14px; color:#999;">
                If you didn’t request this, you can ignore this email.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:30px; font-size:12px; color:#bbb;">
                &copy; ${new Date().getFullYear()} Loopin. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

module.exports = { otpTemplate, EmailVerificationTemplate };
