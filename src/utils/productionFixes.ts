import { supabase } from '@/integrations/supabase/client';

/**
 * Production-specific fixes for authentication and profile loading issues
 */

// Enhanced profile loading with retry mechanism
export const loadProfileWithRetry = async (userId: string, maxRetries = 2) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Profile load attempt ${attempt}/${maxRetries} for user:`, userId);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Profile load timeout')), 3000)
      );
      
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const result = await Promise.race([profilePromise, timeoutPromise]);
      const { data: profile, error } = result;
      
      if (error) {
        console.error(`❌ Profile load attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          return null; // Return null instead of throwing to prevent hanging
        }
        // Shorter wait before retry
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      
      console.log(`✅ Profile loaded successfully on attempt ${attempt}:`, profile);
      return profile;
    } catch (error) {
      console.error(`❌ Profile load attempt ${attempt} error:`, error);
      if (attempt === maxRetries) {
        return null; // Return null instead of throwing
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return null;
};

// Enhanced session validation
export const validateSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Session validation error:', error);
      return { valid: false, session: null, error };
    }
    
    if (!session) {
      console.log('ℹ️ No active session found');
      return { valid: false, session: null, error: null };
    }
    
    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      console.log('⚠️ Session expired, attempting refresh');
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('❌ Session refresh failed:', refreshError);
        return { valid: false, session: null, error: refreshError };
      }
      
      console.log('✅ Session refreshed successfully');
      return { valid: true, session: refreshData.session, error: null };
    }
    
    console.log('✅ Session is valid');
    return { valid: true, session, error: null };
  } catch (error) {
    console.error('❌ Session validation error:', error);
    return { valid: false, session: null, error };
  }
};

// Test avatar URL accessibility
export const testAvatarUrl = (avatarUrl: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!avatarUrl) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      console.log('✅ Avatar URL is accessible:', avatarUrl);
      resolve(true);
    };
    img.onerror = () => {
      console.error('❌ Avatar URL is not accessible:', avatarUrl);
      resolve(false);
    };
    
    // Set a timeout to avoid hanging
    setTimeout(() => {
      console.warn('⚠️ Avatar URL test timed out:', avatarUrl);
      resolve(false);
    }, 10000);
    
    img.src = avatarUrl;
  });
};

// Enhanced role detection with fallback
export const detectUserRole = (userProfile: { role?: string } | null, userEmail: string | undefined) => {
  // CRITICAL: Always prioritize the database role first
  if (userProfile?.role) {
    console.log('✅ Role detected from profile:', userProfile.role);
    return userProfile.role;
  }
  
  // Admin email fallback ONLY if profile role is not available
  const adminEmails = ['bloticbvducoep@gmail.com', 'bloticbvucoep@gmail.com'];
  
  if (userEmail && adminEmails.includes(userEmail.toLowerCase())) {
    console.log('✅ Admin role detected via email fallback:', userEmail);
    return 'admin';
  }
  
  // Only default to student if absolutely no role information is available
  console.log('⚠️ No role detected, defaulting to student');
  return 'student';
};

// Production environment detection
export const isProductionEnvironment = () => {
  const hostname = window.location.hostname;
  const isProduction = hostname !== 'localhost' && 
                      hostname !== '127.0.0.1' && 
                      !hostname.includes('192.168') &&
                      !hostname.includes('10.0') &&
                      !hostname.includes('172.');
  
  console.log(`🌍 Environment detected: ${isProduction ? 'Production' : 'Development'} (${hostname})`);
  return isProduction;
};

// CORS and connectivity test
export const testSupabaseConnectivity = async () => {
  const results = {
    database: false,
    storage: false,
    auth: false,
    errors: [] as string[]
  };
  
  try {
    // Test database connectivity
    const { data: dbTest, error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (dbError) {
      results.errors.push(`Database: ${dbError.message}`);
    } else {
      results.database = true;
    }
  } catch (error) {
    results.errors.push(`Database: ${error}`);
  }
  
  try {
    // Test storage connectivity
    const { data: storageTest, error: storageError } = await supabase.storage
      .from('avatars')
      .list('', { limit: 1 });
    
    if (storageError) {
      results.errors.push(`Storage: ${storageError.message}`);
    } else {
      results.storage = true;
    }
  } catch (error) {
    results.errors.push(`Storage: ${error}`);
  }
  
  try {
    // Test auth connectivity
    const { data: authTest, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      results.errors.push(`Auth: ${authError.message}`);
    } else {
      results.auth = true;
    }
  } catch (error) {
    results.errors.push(`Auth: ${error}`);
  }
  
  console.log('🔍 Supabase connectivity test results:', results);
  return results;
};

// Force profile refresh with production optimizations
export const forceProfileRefresh = async (userId: string) => {
  try {
    console.log('🔄 Forcing profile refresh for user:', userId);
    
    // First validate session
    const sessionResult = await validateSession();
    if (!sessionResult.valid) {
      throw new Error('Invalid session, cannot refresh profile');
    }
    
    // Load profile with retry
    const profile = await loadProfileWithRetry(userId);
    
    if (profile?.avatar_url) {
      // Test avatar accessibility
      const avatarAccessible = await testAvatarUrl(profile.avatar_url);
      if (!avatarAccessible) {
        console.warn('⚠️ Avatar URL not accessible, may cause display issues');
      }
    }
    
    return profile;
  } catch (error) {
    console.error('❌ Force profile refresh failed:', error);
    throw error;
  }
};
