import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

interface EmailRequest {
  email: string;
  full_name?: string;
  user_id?: string;
  phone?: string;
  branch?: string;
  year?: string;
  code?: string;
  type?: 'welcome' | 'verification' | 'resend';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data: EmailRequest = req.body;
    const { email, full_name, user_id, phone, branch, year, code, type = 'welcome' } = data;

    // Validate based on email type
    if (type === 'welcome' && (!email || !full_name)) {
      return res.status(400).json({ error: 'Email and full name are required for welcome emails' });
    }

    if ((type === 'verification' || type === 'resend') && (!email || !code)) {
      return res.status(400).json({ error: 'Email and code are required for verification emails' });
    }

    console.log(`📧 Sending ${type} email to:`, email);

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Choose email content based on type
    let htmlContent: string;
    let subject: string;

    if (type === 'verification' || type === 'resend') {
      // Verification email template
      subject = type === 'resend' ? 'Your new BLOTIC verification code' : 'Verify your BLOTIC account';
      const title = type === 'resend' ? 'New Verification Code' : 'Email Verification';
      const message = type === 'resend'
        ? 'You requested a new verification code. Use the code below to complete your registration:'
        : 'Welcome to BLOTIC! Please use the verification code below to complete your registration:';

      htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(204, 117, 219, 0.2); box-shadow: 0 0 40px rgba(204, 117, 219, 0.1);">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #cc75db; margin: 0 0 10px 0; font-size: 32px; font-weight: 700;">BLOTIC</h1>
          <p style="color: #888; margin: 0; font-size: 14px;">Blockchain & Web3 Club - BVUCOEP</p>
        </div>
        <div style="background-color: rgba(96, 46, 166, 0.1); border-radius: 12px; padding: 32px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">${title}</h2>
          <p style="color: #c0c0c0; margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">${message}</p>
          <div style="background-color: #333; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <div style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #cc75db; font-family: 'Courier New', monospace;">${code}</div>
          </div>
          <p style="color: #888; margin: 0; font-size: 14px;">This code will expire in <strong style="color: #cc75db;">1 hour</strong></p>
        </div>
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(204, 117, 219, 0.1); text-align: center;">
          <p style="color: #666; margin: 0 0 8px 0; font-size: 13px;">If you didn't request this code, you can safely ignore this email.</p>
          <p style="color: #666; margin: 0; font-size: 13px;">&copy; 2025 BLOTIC - BVUCOEP. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
      `;
    } else {
      // Welcome email template (existing)
      subject = 'Welcome to BLOTIC - Your Journey Begins!';
      htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 30px; 
      text-align: center; 
      border-radius: 10px 10px 0 0; 
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 32px;
    }
    .content { 
      background: #f9f9f9; 
      padding: 30px; 
      border-radius: 0 0 10px 10px; 
    }
    .button { 
      display: inline-block; 
      background: #667eea; 
      color: white !important; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 5px; 
      margin: 20px 0; 
      font-weight: bold;
    }
    .checklist { 
      background: white; 
      padding: 20px; 
      border-radius: 8px; 
      margin: 20px 0; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .checklist h3 {
      margin-top: 0;
      color: #667eea;
    }
    .checklist-item { 
      padding: 10px 0; 
      border-bottom: 1px solid #eee; 
    }
    .checklist-item:last-child {
      border-bottom: none;
    }
    .footer { 
      text-align: center; 
      color: #666; 
      font-size: 12px; 
      margin-top: 30px; 
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    ul {
      padding-left: 20px;
    }
    ul li {
      margin: 8px 0;
    }
    a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to BLOTIC! 🎉</h1>
      <p style="margin: 0; font-size: 16px;">BVUCOEP's Blockchain & IoT Club</p>
    </div>
    
    <div class="content">
      <h2 style="color: #667eea;">Hi ${full_name}! 👋</h2>
      
      <p>We're thrilled to have you join our community of innovators, developers, and tech enthusiasts!</p>
      
      <p><strong>BLOTIC</strong> is where blockchain meets IoT, and where passionate students come together to learn, build, and innovate.</p>
      
      <div class="checklist">
        <h3>🚀 Get Started:</h3>
        <div class="checklist-item">✅ Complete your profile</div>
        <div class="checklist-item">✅ Explore upcoming events and workshops</div>
        <div class="checklist-item">✅ Join our WhatsApp community</div>
        <div class="checklist-item">✅ Connect with fellow members</div>
        <div class="checklist-item">✅ Participate in hackathons and competitions</div>
      </div>
      
      <center>
        <a href="https://blotic-bvucoep.vercel.app/dashboard" class="button">Visit Your Dashboard</a>
      </center>
      
      <p><strong>What's Next?</strong></p>
      <ul>
        <li>📅 Check out our <a href="https://blotic-bvucoep.vercel.app/events">upcoming events</a></li>
        <li>👥 Meet our <a href="https://blotic-bvucoep.vercel.app/core-team">core team</a></li>
        <li>📸 Browse our <a href="https://blotic-bvucoep.vercel.app/gallery">gallery</a></li>
        <li>📚 Explore learning resources</li>
      </ul>
      
      <p>Have questions? Feel free to reply to this email or reach out to our team.</p>
      
      <p style="font-size: 18px; color: #667eea; font-weight: bold;">Let's build the future together! 💡</p>
      
      <p>
        <strong>Best regards,</strong><br>
        The BLOTIC Team<br>
        Bharathi Vidyapeeth University College of Engineering, Pune
      </p>
    </div>
    
    <div class="footer">
      <p>© 2025 BLOTIC - BVUCOEP. All rights reserved.</p>
      <p>You received this email because you registered on our platform.</p>
      <p style="margin-top: 10px;">
        <a href="https://blotic-bvucoep.vercel.app">Visit Website</a> | 
        <a href="mailto:bloticbvucoep@gmail.com">Contact Us</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;
    }

    // Send email
    const info = await transporter.sendMail({
      from: `"BLOTIC - BVUCOEP" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html: htmlContent,
    });

    console.log('✅ Email sent:', info.messageId);

    return res.status(200).json({
      success: true,
      message: `${type} email sent successfully`,
      messageId: info.messageId
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return res.status(500).json({
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
