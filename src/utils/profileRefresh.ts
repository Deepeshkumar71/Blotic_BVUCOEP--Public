// Utility to force refresh user profile data and clear any caching issues
import { supabase } from '@/integrations/supabase/client';

export const forceRefreshProfile = async () => {
  try {
    console.log('🔄 Force refreshing user profile...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ No authenticated user found');
      return { success: false, error: 'No authenticated user' };
    }
    
    // Clear any potential Supabase cache by signing out and back in
    console.log('🔄 Refreshing auth session...');
    
    // Refresh the session to get latest data
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
    
    if (sessionError) {
      console.error('❌ Session refresh failed:', sessionError);
      return { success: false, error: sessionError.message };
    }
    
    // Force fresh profile fetch
    console.log('🔄 Fetching fresh profile data...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError);
      return { success: false, error: profileError.message };
    }
    
    console.log('✅ Profile refreshed successfully:', profile.full_name, 'Role:', profile.role);
    
    // Trigger a page reload to ensure all components get the fresh data
    window.location.reload();
    
    return { success: true, profile };
    
  } catch (error) {
    console.error('❌ Force refresh failed:', error);
    return { success: false, error: (error as Error).message };
  }
};

export const clearAuthCache = () => {
  try {
    console.log('🧹 Clearing auth cache...');
    
    // Clear localStorage items
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage items
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    console.log('✅ Auth cache cleared');
    return true;
  } catch (error) {
    console.error('❌ Cache clear failed:', error);
    return false;
  }
};
