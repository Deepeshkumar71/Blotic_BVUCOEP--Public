// Password change utility functions
import { supabase } from '@/integrations/supabase/client';

export interface PasswordChangeResult {
  success: boolean;
  message?: string;
  error?: string;
  forceLogout?: boolean;
}

/**
 * Change user password via backend API with forced logout
 */
export const changePassword = async (
  newPassword: string,
  currentPassword?: string
): Promise<PasswordChangeResult> => {
  try {
    console.log('🔐 Starting secure password change...');
    
    // Validate password
    if (!newPassword || newPassword.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long'
      };
    }

    // Get current session token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return {
        success: false,
        error: 'No valid session found. Please log in again.'
      };
    }

    // Call backend API for secure password change
    const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const response = await fetch(`${apiUrl}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        newPassword,
        currentPassword
      })
    });

    console.log('📡 API Response status:', response.status);
    console.log('📡 API Response headers:', response.headers);

    // Check if response has content
    const responseText = await response.text();
    console.log('📡 Raw response:', responseText);

    if (!responseText) {
      return {
        success: false,
        error: 'Empty response from server. API endpoint may not exist.'
      };
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return {
        success: false,
        error: `Invalid response from server: ${responseText.substring(0, 100)}`
      };
    }

    if (!response.ok) {
      console.error('❌ Password change failed:', result.error);
      return {
        success: false,
        error: result.error || `Server error: ${response.status}`
      };
    }

    console.log('✅ Password changed successfully via backend');

    return {
      success: true,
      message: result.message || 'Password updated successfully',
      forceLogout: result.forceLogout || true
    };

  } catch (error) {
    console.error('❌ Password change error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  return { valid: true };
};

/**
 * Check if passwords match
 */
export const validatePasswordMatch = (
  password: string, 
  confirmPassword: string
): { valid: boolean; message?: string } => {
  if (password !== confirmPassword) {
    return { valid: false, message: 'Passwords do not match' };
  }
  return { valid: true };
};

/**
 * Get password strength score (0-4)
 */
export const getPasswordStrength = (password: string): number => {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (/(?=.*[a-z])/.test(password)) score++;
  if (/(?=.*[A-Z])/.test(password)) score++;
  if (/(?=.*\d)/.test(password)) score++;
  if (/(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(password)) score++;
  
  return Math.min(score, 4);
};

/**
 * Get password strength label
 */
export const getPasswordStrengthLabel = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'Very Weak';
    case 2:
      return 'Weak';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    default:
      return 'Unknown';
  }
};

/**
 * Get password strength color
 */
export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'bg-red-500';
    case 2:
      return 'bg-orange-500';
    case 3:
      return 'bg-yellow-500';
    case 4:
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};
