// Simple Node.js API endpoint for sending emails via Gmail SMTP
// This would typically be in your backend server

const nodemailer = require('nodemailer');

// Gmail SMTP configuration
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // Your Gmail app password
  },
});

async function sendEmail(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html, text } = req.body;

  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: to,
      subject: subject,
      text: text,
      html: html,
    };

    const result = await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      success: true, 
      messageId: result.messageId 
    });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

module.exports = sendEmail;
