import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sbdrzesfuweacfssdwzk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_supabase_service_role_key';

// Use service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  // Check if service key is configured
  if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    return res.status(500).json({
      success: false,
      error: 'Server configuration error. Please contact support.'
    });
  }

  try {
    const { email, password, fullName, firstName, lastName, phone, branch, year } = req.body;
    
    console.log('Registration request received for:', email);

    // Validate input
    if (!email || !password || !fullName) {
      return res.status(400).json({ 
        success: false,
        error: 'Email, password, and full name are required' 
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email.toLowerCase().trim());

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists. Please try logging in instead.',
        shouldRedirect: '/login'
      });
    }

    // Create user with admin client (bypasses the broken Auth API)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        phone,
        branch,
        year
      }
    });

    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Registration failed. Please try again.'
      });
    }

    if (!data.user) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create user account. Please try again.'
      });
    }

    console.log('User created successfully:', data.user.id);

    // Auto-login: Create a session by signing in with the password
    try {
      // Use a regular client (not admin) to sign in and get a session
      const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
      const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (signInError || !signInData.session) {
        console.error('Auto-login failed:', signInError);
        // Registration succeeded, but auto-login failed - redirect to login
        return res.status(200).json({
          success: true,
          message: 'Registration successful! Please sign in with your credentials.',
          autoSignedIn: false,
          shouldRedirect: '/login'
        });
      }

      // Return session for auto-login
      console.log('Auto-login successful for:', data.user.id);
      return res.status(200).json({
        success: true,
        message: 'Registration successful! Signing you in...',
        autoSignedIn: true,
        session: signInData.session,
        user: signInData.user,
        shouldRedirect: '/'
      });
    } catch (sessionError) {
      console.error('Auto-login exception:', sessionError);
      // Registration succeeded, but auto-login failed
      return res.status(200).json({
        success: true,
        message: 'Registration successful! Please sign in with your credentials.',
        autoSignedIn: false,
        shouldRedirect: '/login'
      });
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
    console.error('Unexpected registration error:', error);
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}
