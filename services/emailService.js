import { Resend } from 'resend';

class EmailService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'doc@krkm.in';
  }

  async sendOtpEmail(email, otp, firstName) {
    try {
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Doc Prescrip - Email Verification Code',
        html: this.generateOtpEmailTemplate(otp, firstName)
      });

      console.log('Email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      return false;
    }
  }

  generateOtpEmailTemplate(otp, firstName) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification - Doc Prescrip</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 8px;
              padding: 32px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 32px;
            }
            .logo {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 16px;
            }
            .otp-code {
              background: #eff6ff;
              border: 2px solid #2563eb;
              border-radius: 8px;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              text-align: center;
              padding: 20px;
              margin: 24px 0;
              color: #1d4ed8;
              font-family: 'Courier New', monospace;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                🩺 Doc Prescrip
              </div>
              <h1 style="margin: 0; color: #1f2937;">Email Verification</h1>
            </div>
            
            <p>Hello ${firstName || 'Doctor'},</p>
            
            <p>Thank you for registering with Doc Prescrip. To complete your account setup, please verify your email address using the verification code below:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p>Enter this 6-digit code in the verification form to continue with your registration.</p>
            
            <div class="warning">
              <strong>Important:</strong> This verification code will expire in 10 minutes for security reasons. If you didn't request this verification, please ignore this email.
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>
            The Doc Prescrip Team</p>
            
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>© ${new Date().getFullYear()} Doc Prescrip. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
