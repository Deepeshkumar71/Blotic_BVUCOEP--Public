import { createClient } from '@supabase/supabase-js';

// Vercel serverless function for logging registration attempts
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      email,
      fullName,
      phone,
      branch,
      year,
      success,
      errorMessage,
      autoSigninAttempted,
      autoSigninSuccess,
      userAgent
    } = req.body;

    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sbdrzesfuweacfssdwzk.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseKey) {
      console.error('[Registration Log API] No Supabase key available');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log the registration attempt
    const { error } = await supabase
      .from('registration_attempts')
      .insert([{
        email: email?.toLowerCase()?.trim(),
        full_name: fullName,
        phone,
        branch,
        year,
        success: success || false,
        error_message: errorMessage,
        user_agent: userAgent,
        ip_address: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        auto_signin_attempted: autoSigninAttempted || false,
        auto_signin_success: autoSigninSuccess || false
      }]);

    if (error) {
      console.error('[Registration Log API] Database error:', error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Registration attempt logged successfully'
    });
  } catch (err) {
    console.error('[Registration Log API] Server error:', err);
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}
