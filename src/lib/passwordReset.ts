import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { sendPasswordResetEmail } from './emailService';

type PasswordResetCode = Database['public']['Tables']['password_reset_codes']['Row'];
type EmailQueueItem = Database['public']['Tables']['email_queue']['Row'];

// Generate a 6-digit reset code
export function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create password reset code
export async function createPasswordResetCode(
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; message: string; code?: string; codeId?: string }> {
  try {
    // Check if user exists
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email)
      .single();

    if (userError || !users) {
      // Return success message even if user doesn't exist (security)
      return {
        success: true,
        message: 'If an account exists with this email, you will receive a reset code.',
      };
    }

    // Invalidate any existing codes for this user
    await supabase
      .from('password_reset_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', users.id)
      .gt('expires_at', new Date().toISOString())
      .is('used_at', null);

    // Generate new reset code
    const resetCode = generateResetCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Insert new reset code
    const { data: codeData, error: codeError } = await supabase
      .from('password_reset_codes')
      .insert({
        user_id: users.id,
        email: email,
        reset_code: resetCode,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (codeError) {
      console.error('Error creating reset code:', codeError);
      return {
        success: false,
        message: 'Failed to create reset code. Please try again.',
      };
    }

    // Send email with reset code
    const emailResult = await sendPasswordResetEmail({
      to: email,
      subject: 'Password Reset Code - Blotic Website',
      code: resetCode,
      userFullName: users.full_name || 'User',
    });

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
      // Still return success to avoid revealing if email exists
    }

    return {
      success: true,
      message: 'If an account exists with this email, you will receive a reset code.',
      codeId: codeData.id,
    };
  } catch (error) {
    console.error('Error in createPasswordResetCode:', error);
    return {
      success: false,
      message: 'An error occurred. Please try again.',
    };
  }
}

// Verify reset code
export async function verifyResetCode(
  email: string,
  resetCode: string
): Promise<{ success: boolean; message: string; userId?: string; codeId?: string }> {
  try {
    const { data: codeData, error } = await supabase
      .from('password_reset_codes')
      .select('*')
      .eq('email', email)
      .eq('reset_code', resetCode)
      .gt('expires_at', new Date().toISOString())
      .is('used_at', null)
      .single();

    if (error || !codeData) {
      return {
        success: false,
        message: 'Invalid or expired reset code.',
      };
    }

    return {
      success: true,
      message: 'Reset code verified successfully.',
      userId: codeData.user_id,
      codeId: codeData.id,
    };
  } catch (error) {
    console.error('Error in verifyResetCode:', error);
    return {
      success: false,
      message: 'An error occurred while verifying the code.',
    };
  }
}

// Reset password with code
export async function resetPasswordWithCode(
  email: string,
  resetCode: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    // First verify the code
    const verification = await verifyResetCode(email, resetCode);
    if (!verification.success) {
      return verification;
    }

    // Mark code as used
    await supabase
      .from('password_reset_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', verification.codeId);

    // Update password using Supabase Auth
    const { error: passwordError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (passwordError) {
      console.error('Error updating password:', passwordError);
      return {
        success: false,
        message: 'Failed to update password. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Password reset successfully.',
    };
  } catch (error) {
    console.error('Error in resetPasswordWithCode:', error);
    return {
      success: false,
      message: 'An error occurred while resetting the password.',
    };
  }
}

// Queue password reset email
export async function queuePasswordResetEmail(
  email: string,
  resetCode: string,
  userName: string = 'User'
): Promise<{ success: boolean; emailId?: string }> {
  try {
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #602ea6, #cc75db); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .code-box { background: white; border: 2px solid #602ea6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
              .code { font-size: 32px; font-weight: bold; color: #602ea6; letter-spacing: 4px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>BLOTIC - Password Reset</h1>
              </div>
              <div class="content">
                  <h2>Hello ${userName},</h2>
                  <p>You requested to reset your password for your BLOTIC account. Use the code below to reset your password:</p>
                  
                  <div class="code-box">
                      <div class="code">${resetCode}</div>
                  </div>
                  
                  <p><strong>This code will expire in 15 minutes.</strong></p>
                  
                  <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
                  
                  <p>For security reasons, please do not share this code with anyone.</p>
                  
                  <p>Best regards,<br>The BLOTIC Team</p>
              </div>
              <div class="footer">
                  <p>This is an automated email. Please do not reply to this email.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    const textBody = `
BLOTIC - Password Reset

Hello ${userName},

You requested to reset your password for your BLOTIC account.

Your password reset code is: ${resetCode}

This code will expire in 15 minutes.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

For security reasons, please do not share this code with anyone.

Best regards,
The BLOTIC Team

---
This is an automated email. Please do not reply to this email.
    `;

    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        to_email: email,
        subject: 'BLOTIC - Password Reset Code',
        body_html: htmlBody,
        body_text: textBody,
        email_type: 'password_reset',
        metadata: { reset_code: resetCode, user_name: userName },
      })
      .select()
      .single();

    if (error) {
      console.error('Error queuing email:', error);
      return { success: false };
    }

    return { success: true, emailId: data.id };
  } catch (error) {
    console.error('Error in queuePasswordResetEmail:', error);
    return { success: false };
  }
}

// Send emails from queue (this would be called by a background job)
export async function processEmailQueue(): Promise<void> {
  try {
    const { data: emails, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(10);

    if (error || !emails) {
      console.error('Error fetching email queue:', error);
      return;
    }

    for (const email of emails) {
      try {
        // Here you would integrate with your custom SMTP server
        // For now, we'll just mark as sent
        await sendEmailViaSMTP(email);
        
        await supabase
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', email.id);
      } catch (error) {
        console.error(`Error sending email ${email.id}:`, error);
        
        await supabase
          .from('email_queue')
          .update({
            status: email.attempts >= 2 ? 'failed' : 'pending',
            attempts: email.attempts + 1,
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', email.id);
      }
    }
  } catch (error) {
    console.error('Error processing email queue:', error);
  }
}

// Placeholder for SMTP integration
async function sendEmailViaSMTP(email: EmailQueueItem): Promise<void> {
  // TODO: Integrate with your custom SMTP server
  // This is where you would use nodemailer or similar library
  // with your SMTP configuration
  
  console.log('Sending email via SMTP:', {
    to: email.to_email,
    subject: email.subject,
    type: email.email_type,
  });
  
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 1000));
}
