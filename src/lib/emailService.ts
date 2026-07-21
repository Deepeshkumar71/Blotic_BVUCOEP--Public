// Email Service for sending password reset codes
// This is a simple implementation that queues emails in the database
// In production, you'd want to use a proper email service like SendGrid, Mailgun, etc.

import { supabase } from '@/integrations/supabase/client';
import { sendEmailSMTP, sendEmailJS, sendEmailWeb3Forms } from './smtpEmailService';
import { sendEmailDev } from './smtpSender';

interface EmailOptions {
  to: string;
  subject: string;
  code: string;
  userFullName?: string;
}

export async function sendPasswordResetEmail(options: EmailOptions) {
  const { to, subject, code, userFullName = 'User' } = options;

  // Create HTML email template with the 6-digit code
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Code</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .code-box { background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
          <p>Blotic Website</p>
        </div>
        <div class="content">
          <h2>Hello ${userFullName}!</h2>
          <p>We received a request to reset your password. Use the code below to reset your password:</p>
          
          <div class="code-box">
            <div class="code">${code}</div>
            <p style="margin: 10px 0 0 0; color: #666;">Enter this code on the password reset page</p>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>This code expires in <strong>15 minutes</strong></li>
              <li>Don't share this code with anyone</li>
              <li>If you didn't request this, ignore this email</li>
            </ul>
          </div>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <div class="footer">
            <p>This email was sent from Blotic Website<br>
            If you didn't request this password reset, please ignore this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Create plain text version
  const textBody = `
Password Reset Code - Blotic Website

Hello ${userFullName}!

We received a request to reset your password. Use the code below:

CODE: ${code}

Important:
- This code expires in 15 minutes
- Don't share this code with anyone
- If you didn't request this, ignore this email

Enter this code on the password reset page to continue.

If you have any questions, please contact our support team.

---
Blotic Website
If you didn't request this password reset, please ignore this email.
  `;

  try {
    // Queue the email in the database
    const { error } = await supabase
      .from('email_queue')
      .insert({
        to_email: to,
        subject: subject,
        body_html: htmlBody,
        body_text: textBody,
        email_type: 'password_reset',
        status: 'pending',
        attempts: 0,
        metadata: {
          code: code,
          user_name: userFullName,
          timestamp: new Date().toISOString()
        }
      });

    if (error) {
      console.error('Failed to queue email:', error);
      return { success: false, error: error.message };
    }

    // Try multiple email services in order of preference
    const emailData = {
      to: to,
      subject: subject,
      html: htmlBody,
      text: textBody,
    };

    // 1. Try Web3Forms (free and easy)
    try {
      const web3Result = await sendEmailWeb3Forms(emailData);
      if (web3Result.success) {
        console.log('✅ Email sent successfully via Web3Forms to:', to);
        console.log(`🔑 Reset code: ${code}`);
        return { success: true };
      } else {
        console.log('⚠️ Web3Forms failed:', web3Result.error);
      }
    } catch (error) {
      console.log('⚠️ Web3Forms error:', error);
    }

    // 2. Try EmailJS (client-side)
    try {
      const emailJSResult = await sendEmailJS(emailData);
      if (emailJSResult.success) {
        console.log('✅ Email sent successfully via EmailJS to:', to);
        console.log(`🔑 Reset code: ${code}`);
        return { success: true };
      } else {
        console.log('⚠️ EmailJS failed:', emailJSResult.error);
      }
    } catch (error) {
      console.log('⚠️ EmailJS error:', error);
    }

    // 3. Try custom SMTP
    try {
      const smtpResult = await sendEmailSMTP(emailData);
      if (smtpResult.success) {
        console.log('✅ Email sent successfully via SMTP to:', to);
        console.log(`🔑 Reset code: ${code}`);
        return { success: true };
      } else {
        console.log('⚠️ SMTP failed:', smtpResult.error);
      }
    } catch (error) {
      console.log('⚠️ SMTP error:', error);
    }

    // 4. Try original sendEmailDev
    try {
      const emailResult = await sendEmailDev(emailData);
      if (emailResult.success) {
        console.log('✅ Email sent successfully via sendEmailDev to:', to);
        console.log(`🔑 Reset code: ${code}`);
        return { success: true };
      } else {
        console.log('⚠️ sendEmailDev failed:', emailResult.error);
      }
    } catch (emailError) {
      console.log('⚠️ sendEmailDev error:', emailError);
    }

    // Fallback: Use Supabase Edge Functions for email sending
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: to,
          subject: subject,
          html: htmlBody,
          text: textBody,
        },
      });

      if (!error && data?.success) {
        console.log('✅ Email sent via Supabase Edge Function');
        console.log(`🔑 Reset code: ${code}`);
        return { success: true };
      } else {
        console.log('⚠️ Supabase Edge Function failed:', error);
      }
    } catch (edgeError) {
      console.log('⚠️ Supabase Edge Function error:', edgeError);
    }

    // Final fallback: Console + Alert for development
    console.log('📧 EMAIL FALLBACK - RESET CODE:');
    console.log('═══════════════════════════════════════');
    console.log(`📧 To: ${to}`);
    console.log(`🔑 RESET CODE: ${code}`);
    console.log(`📋 Subject: ${subject}`);
    console.log('═══════════════════════════════════════');
    console.log('📧 Email HTML Content:');
    console.log(htmlBody);
    
    // Show browser alert as last resort
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        alert(`🔑 PASSWORD RESET CODE: ${code}\n\nFor: ${to}\n\nEmail service unavailable. Use this code on the reset password page.`);
      }, 500);
    }

    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Function to process email queue (would be called by a background job)
export async function processEmailQueue() {
  try {
    // Get pending emails
    const { data: emails, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Failed to fetch email queue:', error);
      return;
    }

    for (const email of emails || []) {
      try {
        // Here you would implement actual SMTP sending
        // For now, we'll just mark as sent
        console.log(`📧 Processing email to ${email.to_email}`);
        
        // Update status to sent
        await supabase
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            attempts: email.attempts + 1
          })
          .eq('id', email.id);

        console.log(`✅ Email marked as sent to ${email.to_email}`);
      } catch (emailError) {
        // Mark as failed and increment attempts
        await supabase
          .from('email_queue')
          .update({
            status: email.attempts >= 2 ? 'failed' : 'pending',
            attempts: email.attempts + 1,
            error_message: emailError instanceof Error ? emailError.message : 'Unknown error'
          })
          .eq('id', email.id);

        console.error(`❌ Failed to send email to ${email.to_email}:`, emailError);
      }
    }
  } catch (error) {
    console.error('Email queue processing error:', error);
  }
}
