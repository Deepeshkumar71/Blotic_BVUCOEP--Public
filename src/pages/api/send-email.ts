// API endpoint for sending emails via SMTP
// This runs on the server side and handles SMTP configuration securely

import type { NextApiRequest, NextApiResponse } from 'next';

// You'll need to install nodemailer: npm install nodemailer @types/nodemailer
// Uncomment the import below after installing
// import nodemailer from 'nodemailer';

interface EmailRequest {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    from: string;
  };
}

interface EmailResponse {
  success: boolean;
  error?: string;
  messageId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EmailResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { to, subject, text, html, smtpConfig }: EmailRequest = req.body;

    // Validate required fields
    if (!to || !subject) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: to, subject' 
      });
    }

    // Use environment variables for SMTP config (more secure)
    const config = {
      host: process.env.SMTP_HOST || smtpConfig?.host || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || smtpConfig?.port?.toString() || '587'),
      secure: process.env.SMTP_SECURE === 'true' || smtpConfig?.secure || false,
      auth: {
        user: process.env.SMTP_USER || smtpConfig?.auth?.user || '',
        pass: process.env.SMTP_PASS || smtpConfig?.auth?.pass || '',
      },
      from: process.env.SMTP_FROM || smtpConfig?.from || 'BLOTIC <noreply@blotic.com>',
    };

    // Validate SMTP configuration
    if (!config.auth.user || !config.auth.pass) {
      return res.status(500).json({ 
        success: false, 
        error: 'SMTP configuration incomplete' 
      });
    }

    // For now, we'll simulate email sending
    // Uncomment the nodemailer code below after installing the package
    
    /*
    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: config.from,
      to: to,
      subject: subject,
      text: text,
      html: html,
    });

    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId 
    });
    */

    // Simulate email sending for now
    console.log('Simulating email send:', {
      to,
      subject,
      from: config.from,
      timestamp: new Date().toISOString(),
    });

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return res.status(200).json({ 
      success: true, 
      messageId: `simulated-${Date.now()}@blotic.com` 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// Example .env.local configuration:
/*
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=BLOTIC <noreply@blotic.com>
*/
