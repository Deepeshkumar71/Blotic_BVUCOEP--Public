import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Welcome email endpoint
app.post('/api/send-welcome-email', async (req, res) => {
  try {
    const { email, full_name, user_id, phone, branch, year } = req.body;

    // Validate required fields
    if (!email || !full_name) {
      return res.status(400).json({ error: 'Email and full name are required' });
    }

    console.log('📧 Sending welcome email to:', email);
    console.log('SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      hasPassword: !!process.env.SMTP_PASS
    });

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

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Email HTML template
    const htmlContent = `
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

    // Send email
    const info = await transporter.sendMail({
      from: `"BLOTIC - BVUCOEP" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to BLOTIC! 🚀',
      html: htmlContent,
    });

    console.log('✅ Email sent successfully:', info.messageId);

    res.status(200).json({ 
      success: true, 
      message: 'Welcome email sent successfully',
      messageId: info.messageId 
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📧 Email endpoint: http://localhost:${PORT}/api/send-welcome-email`);
});
