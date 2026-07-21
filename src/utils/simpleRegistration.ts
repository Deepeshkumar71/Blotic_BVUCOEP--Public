// Simple registration utility using server-side API
import { supabase } from '@/integrations/supabase/client';
import { isEmailVerificationRequired } from '@/utils/adminSettingsManager';

export const simpleRegistration = async (
  email: string,
  password: string,
  fullName: string,
  additionalData: {
    firstName: string;
    lastName: string;
    phone: string;
    branch: string;
    year: number | null;
  }
) => {
  try {
    console.log('Simple registration starting...');

    // Check admin settings for email verification requirement
    const emailVerificationRequired = isEmailVerificationRequired();
    console.log('📋 Email verification required:', emailVerificationRequired);

    // Use Edge Function for registration (prevents double emails)
    console.log('Using register-user Edge Function');
    const { data, error } = await supabase.functions.invoke('register-user', {
      body: {
        email: email.toLowerCase().trim(),
        password,
        data: {
          full_name: fullName,
          first_name: additionalData.firstName,
          last_name: additionalData.lastName,
          phone: additionalData.phone,
          branch: additionalData.branch,
          year: additionalData.year
        }
      }
    });

    if (error) {
      console.error('Edge Function error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed. Please try again.',
        shouldRedirect: null
      };
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to create user account.',
        shouldRedirect: null
      };
    }

    // Handle based on email verification setting
    if (emailVerificationRequired) {
      console.log('✅ Registration successful, user needs to verify email');
      return {
        success: true,
        message: 'Registration successful! Please verify your email.',
        userId: data.user.id,
        autoSignedIn: false,
        requiresVerification: true,
        shouldRedirect: null
      };
    } else {
      // Email verification disabled - auto-login user
      // Note: Since we used admin.createUser, we need to sign in manually to get a session
      console.log('✅ Registration successful, email verification disabled - attempting auto-login');

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        return {
          success: true,
          message: 'Registration successful! Please log in.',
          userId: data.user.id,
          autoSignedIn: false,
          requiresVerification: false,
          shouldRedirect: '/login'
        };
      }

      return {
        success: true,
        message: 'Registration successful! You are now logged in.',
        userId: data.user.id,
        session: signInData.session,
        autoSignedIn: true,
        requiresVerification: false,
        shouldRedirect: '/dashboard'
      };
    }


  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
    return {
      success: false,
      error: errorMessage,
      shouldRedirect: null
    };
  }
};
