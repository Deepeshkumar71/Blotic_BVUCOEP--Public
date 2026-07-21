// Quick password reset using Supabase's verifyOtp method
// This bypasses complex session management

import { supabase } from '@/integrations/supabase/client';

export async function quickPasswordUpdate(newPassword: string): Promise<{ error?: Error | null }> {
  try {
    console.log('🚀 Quick password update starting...');
    
    // Get code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlHash = new URLSearchParams(window.location.hash.substring(1));
    const code = urlParams.get('code') || urlHash.get('code');
    
    if (!code) {
      console.error('❌ No code parameter found in URL');
      return { error: new Error('No reset code found. Please try the reset link again.') };
    }
    
    console.log('🔧 Found code parameter, verifying...');
    
    // Use verifyOtp with the code to establish session and update password
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: code,
      type: 'recovery'
    });
    
    if (error) {
      console.error('❌ Code verification failed:', error);
      return { error };
    }
    
    console.log('✅ Code verified, session established');
    
    // Now update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (updateError) {
      console.error('❌ Password update failed:', updateError);
      return { error: updateError };
    }
    
    console.log('✅ Password updated successfully!');
    return { error: null };
    
  } catch (error) {
    console.error('❌ Unexpected error in quickPasswordUpdate:', error);
    return { error: error as Error };
  }
}
