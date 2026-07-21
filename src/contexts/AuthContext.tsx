import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { performCompleteLogout, redirectAfterLogout } from '@/utils/authUtils';
import { loadProfileWithRetry, validateSession, isProductionEnvironment } from '@/utils/productionFixes';
import { preloadAvatar } from '@/utils/avatarPreloader';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

// Define a comprehensive profile type
interface Profile {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  email?: string;
  phone?: string;
  branch?: string;
  year?: number;
  bio?: string;
  avatar_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  whatsapp_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Define the additional data type for registration
interface RegistrationData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  branch?: string;
  year?: number | null; // matches Register.tsx
}

// Define the shape of the Auth context
interface AuthContextType {
  user: User | null;
  userProfile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    additionalData?: RegistrationData
  ) => Promise<{ 
    error?: Error | null; 
    data?: unknown; 
    needsEmailConfirmation?: boolean;
    autoSignedIn?: boolean;
    autoSignInFailed?: boolean;
  }>;
  signOut: () => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error?: Error | null }>;
  resetPassword: (email: string) => Promise<{ error?: Error | null }>;
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<{ error?: Error | null }>;
  sendResetCode: (email: string) => Promise<{ error?: Error | null; code?: string }>;
  verifyResetCode: (email: string, code: string) => Promise<{ error?: Error | null; valid?: boolean }>;
  updatePassword: (newPassword: string, accessToken?: string) => Promise<{ error?: Error | null }>;
  verifyResetToken: (token: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

// Create the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Enable session timeout tracking
  useSessionTimeout();

  useEffect(() => {
    const getSession = async () => {
      try {
        console.log('🔐 Initializing auth session...');
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          setLoading(false);
          return;
        }
        
        // If no session, don't try to refresh (user may have logged out)
        if (!session) {
          console.log('ℹ️ No session found');
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }
        
        // Check if session is expired
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at < now) {
          console.log('⚠️ Session expired, refreshing...');
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshedSession) {
            console.log('✅ Session refreshed successfully');
            setUser(refreshedSession.user);
            await loadUserProfile(refreshedSession.user.id);
          } else {
            console.error('❌ Failed to refresh expired session:', refreshError);
            setUser(null);
            setUserProfile(null);
          }
          
          setLoading(false);
          return;
        }
        
        // Valid session found
        console.log('✅ Valid session found for user:', session.user.id);
        setUser(session.user);

        if (session.user) {
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };
    
    // Helper function to load user profile
    const loadUserProfile = async (userId: string) => {
      try {
        console.log('🚀 Loading profile for user:', userId);
            
        // Try quick profile fetch with 1 second timeout
        const quickProfilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Quick profile timeout')), 1000)
        );
        
        try {
          const result = await Promise.race([quickProfilePromise, timeoutPromise]);
          const { data: profile, error } = result;
          
          if (profile && !error) {
            setUserProfile(profile);
            console.log('✅ Quick profile loaded:', profile.full_name || profile.email);
            // Preload avatar for instant display
            if (profile.avatar_url) {
              preloadAvatar(profile.avatar_url);
            }
          } else {
            throw new Error('Profile not found or error occurred');
          }
        } catch (quickError) {
          console.log('⚡ Quick load failed, using fallback profile');
          // Immediate fallback with basic info (NO user_metadata to avoid old cached names)
          const fallbackProfile = {
            id: userId,
            email: undefined,
            full_name: undefined,
            role: undefined,
            avatar_url: undefined
          };
          setUserProfile(fallbackProfile);
          
          // Try to load full profile in background (non-blocking)
          loadProfileWithRetry(userId).then(fullProfile => {
            if (fullProfile) {
              console.log('🔄 Background profile loaded:', fullProfile.full_name);
              setUserProfile(fullProfile);
              // Preload avatar for instant display
              if (fullProfile.avatar_url) {
                preloadAvatar(fullProfile.avatar_url);
              }
            }
          }).catch(bgError => {
            console.log('Background profile load failed:', bgError);
          });
        }
      } catch (error) {
        console.error('❌ Profile loading error:', error);
        // Final fallback
        setUserProfile({
          id: userId,
          email: undefined,
          full_name: undefined,
          role: undefined
        });
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event, session?.user?.id);
      
      // Handle different auth events
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed');
      }
      
      setUser(session?.user ?? null);
      if (session?.user) {
        // Fast profile loading on auth state change
        console.log('🚀 Fast profile loading on auth change for user:', session.user.id);
        
        // Immediate fallback profile
        const fallbackProfile = {
          id: session.user.id,
          email: session.user.email || session.user.user_metadata?.email,
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          role: undefined, // Don't hardcode role - wait for real profile
          avatar_url: session.user.user_metadata?.avatar_url
        };
        setUserProfile(fallbackProfile);
        
        // Try to load full profile in background (non-blocking)
        (async () => {
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profile && !error) {
              console.log('✅ Background profile loaded on auth change:', profile.full_name);
              setUserProfile(profile);
              // Preload avatar for instant display
              if (profile.avatar_url) {
                preloadAvatar(profile.avatar_url);
              }
            } else if (error) {
              console.log('Background profile load failed on auth change:', error);
            }
          } catch (error) {
            console.log('Background profile load error on auth change:', error);
          }
        })();
      } else {
        console.log('ℹ️ No user in auth state change');
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      try {
        console.log('🔄 Force refreshing profile for user:', user.id);
        
        // Clear any potential cached profile data
        setUserProfile(null);
        
        // Force fresh fetch from database with cache busting
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile && !error) {
          setUserProfile(profile);
          console.log('✅ Profile force refreshed:', profile.full_name || profile.email, 'Role:', profile.role);
          
          // Preload avatar if available
          if (profile.avatar_url) {
            preloadAvatar(profile.avatar_url);
          }
        } else {
          console.error('❌ Error refreshing profile:', error);
          // Set a minimal profile to prevent undefined states
          setUserProfile({
            id: user.id,
            email: user.email,
            role: undefined
          });
        }
      } catch (error) {
        console.error('❌ Error refreshing profile:', error);
        // Set a minimal profile to prevent undefined states
        setUserProfile({
          id: user.id,
          email: user.email,
          role: undefined
        });
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting sign in for:', email);
      
      const result = await supabase.auth.signInWithPassword({ email, password });
      
      if (result.error) {
        console.error('❌ Sign in failed:', result.error.message);
        return result;
      }
      
      if (result.data?.user) {
        console.log('✅ Sign in successful, user ID:', result.data.user.id);
        
        // The onAuthStateChange listener will handle profile loading
        // But we can trigger a refresh to ensure the latest data
        setTimeout(() => {
          console.log('🔄 Triggering profile refresh after sign in');
          refreshProfile();
        }, 500);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      return { error: error as Error };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp: async (email, password, fullName, additionalData) => {
      try {
        console.log('🔐 Starting signup process for:', email);
        
        // Check if user already exists - but don't block registration if check fails
        try {
          const { data: existingUsers, error: checkError } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', email.toLowerCase().trim());
          
          console.log('📋 Existing user check:', { existingUsers, checkError });
          
          if (existingUsers && existingUsers.length > 0) {
            console.log('❌ User already exists:', existingUsers[0].email);
            return { 
              error: new Error('An account with this email already exists. Please try logging in instead.'), 
              data: null, 
              needsEmailConfirmation: false 
            };
          }
          
          console.log('✅ Email is available for registration');
        } catch (checkError) {
          // If check fails, continue with registration - don't block it
          console.log('⚠️ User check failed, continuing with registration:', checkError);
        }
        
        // Sign up the user - simplified approach
        console.log('📝 Attempting Supabase signup...');
        const { data, error } = await supabase.auth.signUp({
          email: email.toLowerCase().trim(),
          password,
          options: {
            data: {
              full_name: fullName,
              first_name: additionalData?.firstName,
              last_name: additionalData?.lastName,
              phone: additionalData?.phone,
              branch: additionalData?.branch,
              year: additionalData?.year
            }
          }
        });
        
        console.log('📊 Supabase signup result:', { 
          user: data?.user?.id, 
          session: !!data?.session, 
          error: error?.message 
        });
        
        if (error) {
          console.error('❌ Signup error:', error);
          
          // Handle specific Supabase errors
          if (error.message?.includes('User already registered') || 
              error.message?.includes('already been registered') ||
              error.message?.includes('email address is already registered') ||
              error.message?.includes('duplicate key value violates unique constraint')) {
            return { 
              error: new Error('An account with this email already exists. Please try logging in instead.'), 
              data: null, 
              needsEmailConfirmation: false 
            };
          }
          
          return { error, data: null, needsEmailConfirmation: false };
        }
        
        console.log('✅ Signup response:', { user: data.user, session: data.session });
        
        // If user was created successfully
        if (data.user) {
          console.log('✅ User created successfully:', data.user.id);
          
          // If we have a session, user is automatically signed in
          if (data.session) {
            console.log('✅ User automatically signed in with session');
            setUser(data.user);
            
            // Fetch and set user profile
            try {
              // Wait a moment for the database trigger to create the profile
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
              
              if (profile) {
                setUserProfile(profile);
                console.log('✅ Profile loaded:', profile?.full_name);
              }
            } catch (profileError) {
              console.error('❌ Profile fetch error:', profileError);
            }
            
            return { 
              error: null, 
              data, 
              needsEmailConfirmation: false,
              autoSignedIn: true 
            };
          } else {
            // No session - try to sign in manually
            console.log('📧 No session, attempting manual sign-in...');
            
            try {
              // Wait a moment for user to be fully created
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password
              });
              
              if (signInData.user && signInData.session) {
                console.log('✅ Manual sign-in successful');
                setUser(signInData.user);
                
                // Fetch and set user profile
                try {
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', signInData.user.id)
                    .single();
                  
                  if (profile) {
                    setUserProfile(profile);
                    console.log('✅ Profile loaded:', profile?.full_name);
                  }
                } catch (profileError) {
                  console.error('❌ Profile fetch error:', profileError);
                }
                
                return { 
                  error: null, 
                  data: signInData, 
                  needsEmailConfirmation: false,
                  autoSignedIn: true 
                };
              } else {
                console.log('📧 Manual sign-in failed, email confirmation may be required');
                return { 
                  error: null, 
                  data, 
                  needsEmailConfirmation: true,
                  autoSignInFailed: true 
                };
              }
            } catch (signInError) {
              console.error('❌ Manual sign-in failed:', signInError);
              return { 
                error: null, 
                data, 
                needsEmailConfirmation: true,
                autoSignInFailed: true 
              };
            }
          }
        }
        
        return { 
          error: null, 
          data, 
          needsEmailConfirmation: false,
          autoSignedIn: true 
        };
      } catch (error) {
        console.error('❌ Signup process error:', error);
        return { 
          error: error as Error, 
          data: null, 
          needsEmailConfirmation: false 
        };
      }
    },
    signOut: async () => {
      try {
        console.log('🔓 Starting logout process...');
        
        // Sign out from Supabase FIRST (this will trigger SIGNED_OUT event)
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        
        if (error) {
          console.error('❌ Supabase logout error:', error);
        } else {
          console.log('✅ Supabase logout successful');
        }
        
        // Clear local state
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        
        // Perform complete cleanup using utility functions
        performCompleteLogout();
        
        // Small delay to ensure cleanup completes
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect to home page
        redirectAfterLogout();
        
        return { error: null };
      } catch (error) {
        console.error('❌ Logout error:', error);
        
        // Even if there's an error, perform cleanup and redirect
        setUser(null);
        setUserProfile(null);
        performCompleteLogout();
        redirectAfterLogout();
        
        return { error: error as Error };
      }
    },
    signInWithGoogle: async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      return { error, data };
    },
    resetPassword: async (email: string) => {
      // Force redirect to main website if we're on it
      // Always use the working URL
      const redirectUrl = 'http://192.168.1.4:8080/reset-password';
      
      console.log('🔧 Reset password redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
      });
      return { error };
    },
    sendResetCode: async (email: string) => {
      try {
        console.log('Sending reset code to:', email);
        
        const { sendPasswordResetCode } = await import('@/lib/passwordResetService');
        const result = await sendPasswordResetCode(email);
        
        if (!result.success) {
          console.error('Failed to send reset code:', result.message);
          return { error: new Error(result.message) };
        }
        
        console.log('Reset code sent successfully');
        return { error: null };
      } catch (error) {
        console.error('Error in sendResetCode:', error);
        return { error: error as Error };
      }
    },
    verifyResetCode: async (email: string, code: string) => {
      try {
        const { verifyResetCode } = await import('@/lib/passwordResetService');
        const result = await verifyResetCode(email, code);
        
        if (!result.success) {
          return { error: new Error(result.message), valid: false };
        }
        
        return { error: null, valid: true };
      } catch (error) {
        return { error: error as Error, valid: false };
      }
    },
    resetPasswordWithCode: async (email: string, code: string, newPassword: string) => {
      try {
        const { resetPasswordWithCode } = await import('@/lib/passwordResetService');
        const result = await resetPasswordWithCode(email, code, newPassword);
        
        if (!result.success) {
          return { error: new Error(result.message) };
        }
        
        return { error: null };
      } catch (error) {
        return { error: error as Error };
      }
    },
    updatePassword: async (newPassword: string, accessToken?: string) => {
      try {
        console.log('🔧 Updating password...');
        console.log('🔧 Access token provided:', !!accessToken);
        
        if (accessToken) {
          console.log('🔧 Setting session with access token');
          // If we have an access token from the reset link, set the session first
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: '' // We don't have refresh token from reset link
          });
          
          if (sessionError) {
            console.error('❌ Session error:', sessionError);
            return { error: sessionError };
          }
        }
        
        // Check current session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔧 Current session before update:', session);
        
        if (!session?.user) {
          console.error('❌ No valid session for password update');
          
          // Try to establish session using URL parameters
          const urlParams = new URLSearchParams(window.location.search);
          const urlHash = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = urlParams.get('access_token') || urlHash.get('access_token');
          const refreshToken = urlParams.get('refresh_token') || urlHash.get('refresh_token');
          
          if (accessToken) {
            console.log('🔧 Trying to set session with URL tokens...');
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            if (sessionError) {
              console.error('❌ Failed to set session:', sessionError);
              return { error: new Error('Failed to establish session. Please try the reset link again.') };
            }
            
            console.log('✅ Session established with URL tokens');
          } else {
            return { error: new Error('No valid session found. Please try the reset link again.') };
          }
        }
        
        console.log('🔧 Attempting to update password...');
        
        // Try multiple methods to update password
        let error = null;
        
        // Method 1: Direct password update
        const updateResult = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (updateResult.error) {
          console.error('❌ Direct password update failed:', updateResult.error);
          
          // Method 2: Try using the code parameter with verifyOtp
          const urlParams = new URLSearchParams(window.location.search);
          const urlHash = new URLSearchParams(window.location.hash.substring(1));
          const code = urlParams.get('code') || urlHash.get('code');
          
          if (code) {
            console.log('🔧 Trying password update with OTP verification...');
            
            // First verify the OTP to establish session
            const verifyResult = await supabase.auth.verifyOtp({
              token_hash: code,
              type: 'recovery'
            });
            
            if (verifyResult.error) {
              console.error('❌ OTP verification failed:', verifyResult.error);
              error = verifyResult.error;
            } else {
              console.log('✅ OTP verified, now updating password...');
              
              // Now try updating password again
              const secondUpdateResult = await supabase.auth.updateUser({
                password: newPassword
              });
              
              if (secondUpdateResult.error) {
                console.error('❌ Second password update failed:', secondUpdateResult.error);
                error = secondUpdateResult.error;
              } else {
                console.log('✅ Password updated successfully via OTP method');
                error = null;
              }
            }
          } else {
            error = updateResult.error;
          }
        } else {
          console.log('✅ Password updated successfully via direct method');
          error = null;
        }
        
        return { error };
      } catch (error) {
        console.error('❌ Unexpected error in updatePassword:', error);
        return { error: error as Error };
      }
    },
    verifyResetToken: async (token: string) => {
      try {
        // Verify the token by attempting to get the user with it
        const { data, error } = await supabase.auth.getUser(token);
        return !error && !!data.user;
      } catch (error) {
        console.error("Token verification error:", error);
        return false;
      }
    },
    refreshProfile: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
