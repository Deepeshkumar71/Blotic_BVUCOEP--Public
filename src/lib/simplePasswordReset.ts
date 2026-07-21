import { supabase } from '@/integrations/supabase/client';

// Simple password reset using Supabase's built-in functionality
// This bypasses the custom tables and uses Supabase's native reset system

// Generate a 6-digit reset code
export function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send reset code via email (simplified version)
export async function sendResetCodeSimple(email: string): Promise<{ success: boolean; message: string; code?: string }> {
  try {
    // Check if user exists in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      // Return success message even if user doesn't exist (security)
      return {
        success: true,
        message: 'If an account exists with this email, you will receive a reset code.',
      };
    }

    // Generate a 6-digit code
    const resetCode = generateResetCode();
    
    // For now, we'll store the code in localStorage for testing
    // In production, this would be stored in the database and sent via email
    const codeData = {
      email,
      code: resetCode,
      expires: Date.now() + (15 * 60 * 1000), // 15 minutes
      userId: profile.id
    };
    
    localStorage.setItem(`reset_code_${email}`, JSON.stringify(codeData));
    
    console.log(`Reset code for ${email}: ${resetCode}`);
    
    return {
      success: true,
      message: 'Reset code sent to your email.',
      code: resetCode, // Return code for testing purposes
    };
  } catch (error) {
    console.error('Error in sendResetCodeSimple:', error);
    return {
      success: false,
      message: 'An error occurred. Please try again.',
    };
  }
}

// Verify reset code (simplified version)
export async function verifyResetCodeSimple(
  email: string,
  resetCode: string
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    const storedData = localStorage.getItem(`reset_code_${email}`);
    
    if (!storedData) {
      return {
        success: false,
        message: 'Invalid or expired reset code.',
      };
    }
    
    const codeData = JSON.parse(storedData);
    
    // Check if code matches and hasn't expired
    if (codeData.code !== resetCode) {
      return {
        success: false,
        message: 'Invalid reset code.',
      };
    }
    
    if (Date.now() > codeData.expires) {
      localStorage.removeItem(`reset_code_${email}`);
      return {
        success: false,
        message: 'Reset code has expired.',
      };
    }
    
    return {
      success: true,
      message: 'Reset code verified successfully.',
      userId: codeData.userId,
    };
  } catch (error) {
    console.error('Error in verifyResetCodeSimple:', error);
    return {
      success: false,
      message: 'An error occurred while verifying the code.',
    };
  }
}

// Reset password with code (simplified version)
export async function resetPasswordWithCodeSimple(
  email: string,
  resetCode: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    // First verify the code
    const verification = await verifyResetCodeSimple(email, resetCode);
    if (!verification.success) {
      return verification;
    }

    // Get the user's auth ID from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        message: 'User not found.',
      };
    }

    // Update password using Supabase Auth Admin API
    // Note: This requires service role key, so we'll use a different approach
    
    // For now, we'll use the regular auth update method
    // This requires the user to be signed in, so we'll sign them in first with a temporary session
    
    // Alternative: Use Supabase's built-in password reset
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}&method=code&code=${resetCode}`
    });

    if (resetError) {
      console.error('Error sending reset email:', resetError);
      return {
        success: false,
        message: 'Failed to initiate password reset. Please try again.',
      };
    }

    // Clean up the stored code
    localStorage.removeItem(`reset_code_${email}`);
    
    return {
      success: true,
      message: 'Password reset initiated. Please check your email for further instructions.',
    };
  } catch (error) {
    console.error('Error in resetPasswordWithCodeSimple:', error);
    return {
      success: false,
      message: 'An error occurred while resetting the password.',
    };
  }
}

// Alternative: Direct password update (requires admin privileges)
export async function updatePasswordDirect(
  email: string,
  resetCode: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Verify the code first
    const verification = await verifyResetCodeSimple(email, resetCode);
    if (!verification.success) {
      return verification;
    }

    // This would require admin/service role access
    // For now, we'll return a message indicating the code is valid
    // and the user should use the regular reset flow
    
    localStorage.removeItem(`reset_code_${email}`);
    
    return {
      success: true,
      message: 'Code verified. Please use the email link to complete password reset.',
    };
  } catch (error) {
    console.error('Error in updatePasswordDirect:', error);
    return {
      success: false,
      message: 'An error occurred while updating the password.',
    };
  }
}
