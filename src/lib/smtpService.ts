// SMTP Service for sending emails
// You'll need to install nodemailer: npm install nodemailer @types/nodemailer

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Default SMTP configuration - replace with your actual SMTP settings
const defaultSMTPConfig: SMTPConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password',
  },
  from: process.env.SMTP_FROM || 'BLOTIC <noreply@blotic.com>',
};

// Email service class
export class SMTPEmailService {
  private config: SMTPConfig;

  constructor(config?: Partial<SMTPConfig>) {
    this.config = { ...defaultSMTPConfig, ...config };
  }

  // Send email using fetch API (for client-side usage)
  async sendEmailViaAPI(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...emailData,
          smtpConfig: this.config,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to send email' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending email via API:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(
    email: string, 
    resetCode: string, 
    userName: string = 'User'
  ): Promise<{ success: boolean; error?: string }> {
    const emailData: EmailData = {
      to: email,
      subject: 'BLOTIC - Password Reset Code',
      html: this.generatePasswordResetHTML(resetCode, userName),
      text: this.generatePasswordResetText(resetCode, userName),
    };

    return this.sendEmailViaAPI(emailData);
  }

  // Generate HTML email template
  private generatePasswordResetHTML(resetCode: string, userName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>BLOTIC - Password Reset</title>
          <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                  line-height: 1.6; 
                  color: #333; 
                  background-color: #f4f4f4;
              }
              .email-container { 
                  max-width: 600px; 
                  margin: 20px auto; 
                  background: white;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              }
              .header { 
                  background: linear-gradient(135deg, #602ea6, #cc75db); 
                  color: white; 
                  padding: 40px 30px; 
                  text-align: center; 
              }
              .header h1 { 
                  font-size: 28px; 
                  font-weight: 700; 
                  margin-bottom: 10px;
              }
              .header p { 
                  font-size: 16px; 
                  opacity: 0.9; 
              }
              .content { 
                  padding: 40px 30px; 
                  background: white;
              }
              .greeting { 
                  font-size: 20px; 
                  font-weight: 600; 
                  margin-bottom: 20px; 
                  color: #333;
              }
              .message { 
                  font-size: 16px; 
                  margin-bottom: 30px; 
                  color: #555; 
              }
              .code-container { 
                  background: linear-gradient(135deg, #f8f9ff, #f0f4ff);
                  border: 2px solid #602ea6; 
                  border-radius: 12px; 
                  padding: 30px; 
                  text-align: center; 
                  margin: 30px 0; 
              }
              .code-label { 
                  font-size: 14px; 
                  color: #666; 
                  margin-bottom: 10px; 
                  text-transform: uppercase; 
                  letter-spacing: 1px;
              }
              .reset-code { 
                  font-size: 36px; 
                  font-weight: 700; 
                  color: #602ea6; 
                  letter-spacing: 6px; 
                  font-family: 'Courier New', monospace;
                  margin: 10px 0;
              }
              .expiry-notice { 
                  background: #fff3cd; 
                  border: 1px solid #ffeaa7; 
                  border-radius: 8px; 
                  padding: 15px; 
                  margin: 20px 0; 
                  color: #856404;
                  font-weight: 500;
              }
              .security-notice { 
                  background: #d1ecf1; 
                  border: 1px solid #bee5eb; 
                  border-radius: 8px; 
                  padding: 15px; 
                  margin: 20px 0; 
                  color: #0c5460;
              }
              .footer { 
                  background: #f8f9fa; 
                  padding: 30px; 
                  text-align: center; 
                  border-top: 1px solid #e9ecef;
              }
              .footer p { 
                  color: #6c757d; 
                  font-size: 14px; 
                  margin-bottom: 10px;
              }
              .brand { 
                  color: #602ea6; 
                  font-weight: 600; 
              }
              .divider { 
                  height: 1px; 
                  background: linear-gradient(to right, transparent, #ddd, transparent); 
                  margin: 30px 0; 
              }
              @media (max-width: 600px) {
                  .email-container { margin: 10px; }
                  .header, .content, .footer { padding: 20px; }
                  .reset-code { font-size: 28px; letter-spacing: 4px; }
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="header">
                  <h1>🔐 Password Reset</h1>
                  <p>Secure access to your BLOTIC account</p>
              </div>
              
              <div class="content">
                  <div class="greeting">Hello ${userName},</div>
                  
                  <div class="message">
                      We received a request to reset the password for your BLOTIC account. 
                      Use the verification code below to complete your password reset:
                  </div>
                  
                  <div class="code-container">
                      <div class="code-label">Your Reset Code</div>
                      <div class="reset-code">${resetCode}</div>
                  </div>
                  
                  <div class="expiry-notice">
                      ⏰ <strong>Important:</strong> This code will expire in 15 minutes for security reasons.
                  </div>
                  
                  <div class="security-notice">
                      🛡️ <strong>Security Notice:</strong> If you didn't request this password reset, 
                      please ignore this email. Your password will remain unchanged, and your account is secure.
                  </div>
                  
                  <div class="divider"></div>
                  
                  <div class="message">
                      For your security, please do not share this code with anyone. 
                      If you need help, contact our support team.
                  </div>
                  
                  <div class="message">
                      Best regards,<br>
                      <span class="brand">The BLOTIC Team</span>
                  </div>
              </div>
              
              <div class="footer">
                  <p>This is an automated security email from BLOTIC.</p>
                  <p>Please do not reply to this email address.</p>
                  <p>© ${new Date().getFullYear()} BLOTIC. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  // Generate plain text email
  private generatePasswordResetText(resetCode: string, userName: string): string {
    return `
BLOTIC - Password Reset

Hello ${userName},

We received a request to reset the password for your BLOTIC account.

Your password reset code is: ${resetCode}

IMPORTANT: This code will expire in 15 minutes for security reasons.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged, and your account is secure.

For your security, please do not share this code with anyone.

Best regards,
The BLOTIC Team

---
This is an automated security email from BLOTIC.
Please do not reply to this email address.
© ${new Date().getFullYear()} BLOTIC. All rights reserved.
    `;
  }
}

// Export a default instance
export const emailService = new SMTPEmailService();

// Export configuration helper
export function createSMTPConfig(config: Partial<SMTPConfig>): SMTPConfig {
  return { ...defaultSMTPConfig, ...config };
}
