// Clean password reset service
import { supabase } from '@/integrations/supabase/client';
import { sendResetCodeEmail } from './supabaseEmailService';

// Generate 6-digit reset code
export function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Step 1: Send reset code via email
export async function sendPasswordResetCode(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // Return success for security (don't reveal if email exists)
      return {
        success: true,
        message: 'If an account exists with this email, you will receive a reset code.',
      };
    }

    // Generate 6-digit code
    const resetCode = generateResetCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Invalidate any existing codes for this user
    await supabase
      .from('password_reset_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('email', email)
      .is('used_at', null);

    // Store new reset code
    const { error: codeError } = await supabase
      .from('password_reset_codes')
      .insert({
        user_id: user.id,
        email: email,
        reset_code: resetCode,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      });

    if (codeError) {
      console.error('Error storing reset code:', codeError);
      return {
        success: false,
        message: 'Failed to generate reset code. Please try again.',
      };
    }

    // Send email with reset code (no timeout - let it complete)
    try {
      const emailResult = await sendResetCodeEmail({
        to: email,
        code: resetCode,
        userFullName: user.full_name || 'User',
      });

      if (emailResult.success) {
        console.log('✅ Email sent successfully');
      } else {
        console.error('Failed to send email:', emailResult.error);
        // Continue anyway - code is stored in database
      }
    } catch (emailError) {
      console.error('Email service error:', emailError);
      // Continue anyway - code is stored in database
    }

    return {
      success: true,
      message: 'Reset code sent to your email address.',
    };
  } catch (error) {
    console.error('Error in sendPasswordResetCode:', error);
    return {
      success: false,
      message: 'An error occurred. Please try again.',
    };
  }
}

// Step 2: Verify reset code
export async function verifyResetCode(email: string, code: string): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    const { data: codeData, error } = await supabase
      .from('password_reset_codes')
      .select('id, user_id, expires_at, used_at')
      .eq('email', email)
      .eq('reset_code', code)
      .is('used_at', null)
      .single();

    if (error || !codeData) {
      return {
        success: false,
        message: 'Invalid or expired reset code.',
      };
    }

    // Check if code is expired
    if (new Date() > new Date(codeData.expires_at)) {
      return {
        success: false,
        message: 'Reset code has expired. Please request a new one.',
      };
    }

    return {
      success: true,
      message: 'Reset code verified successfully.',
      userId: codeData.user_id,
    };
  } catch (error) {
    console.error('Error in verifyResetCode:', error);
    return {
      success: false,
      message: 'An error occurred while verifying the code.',
    };
  }
}

// Step 3: Reset password with verified code
export async function resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    // First verify the code
    const verification = await verifyResetCode(email, code);
    if (!verification.success) {
      return verification;
    }

    // Mark code as used
    await supabase
      .from('password_reset_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('email', email)
      .eq('reset_code', code);

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
      message: 'Password updated successfully.',
    };
  } catch (error) {
    console.error('Error in resetPasswordWithCode:', error);
    return {
      success: false,
      message: 'An error occurred while resetting the password.',
    };
  }
}
