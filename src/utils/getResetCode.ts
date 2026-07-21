import { supabase } from '@/integrations/supabase/client';

// Utility function to get the latest reset code for testing
export async function getLatestResetCode(email: string): Promise<string | null> {
  try {
    const { data: codes, error } = await supabase
      .from('password_reset_codes')
      .select('reset_code, expires_at, created_at')
      .eq('email', email)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching reset code:', error);
      return null;
    }

    if (!codes || codes.length === 0) {
      console.log('No valid reset code found for:', email);
      return null;
    }

    const code = codes[0];
    console.log(`🔑 Latest reset code for ${email}: ${code.reset_code}`);
    return code.reset_code;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Add to window for easy testing in console
if (typeof window !== 'undefined') {
  (window as any).getResetCode = getLatestResetCode;
}
