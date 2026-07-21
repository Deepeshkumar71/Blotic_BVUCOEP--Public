import { 
  handleCORS, 
  createSupabaseClient, 
  sendResponse, 
  logAPIRequest, 
  validateRequiredFields,
  checkRateLimit 
} from '../_lib/supabase.js';

// User login API with enhanced security
export default async function handler(req, res) {
  // Handle CORS
  if (handleCORS(req, res)) return;

  // Only allow POST requests
  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method not allowed' });
  }

  const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

  // Rate limiting - 10 login attempts per 15 minutes
  const rateLimit = checkRateLimit(clientIP, 10, 15 * 60 * 1000);
  
  if (!rateLimit.allowed) {
    return sendResponse(res, 429, { 
      error: 'Too many login attempts. Please try again later.',
      retryAfter: 900 // 15 minutes
    });
  }

  try {
    logAPIRequest(req, 'login_attempt', { ip: clientIP });

    // Validate request body
    const validation = validateRequiredFields(req.body, ['email', 'password']);
    if (!validation.valid) {
      return sendResponse(res, validation.status, { error: validation.error });
    }

    const { email, password, rememberMe = false } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendResponse(res, 400, { error: 'Invalid email format' });
    }

    const supabase = createSupabaseClient();

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password
    });

    if (error) {
      console.error('[Login API] Authentication failed:', error.message);
      logAPIRequest(req, 'login_failed', { 
        email: email.toLowerCase().trim(), 
        error: error.message,
        ip: clientIP 
      });
      
      return sendResponse(res, 401, { 
        error: 'Invalid email or password',
        message: 'Please check your credentials and try again'
      });
    }

    if (!data.user) {
      return sendResponse(res, 401, { error: 'Authentication failed' });
    }

    // Get user profile
    let profile = null;
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select(`
          id, full_name, first_name, last_name, email, phone, 
          branch, year, role, avatar_url, created_at
        `)
        .eq('id', data.user.id)
        .single();
      
      profile = profileData;
    } catch (profileError) {
      console.error('[Login API] Profile fetch error:', profileError);
      // Don't fail login if profile fetch fails
    }

    // Log successful login
    logAPIRequest(req, 'login_success', { 
      userId: data.user.id,
      email: data.user.email,
      ip: clientIP,
      hasProfile: !!profile
    });

    // Log login event to database
    try {
      await supabase
        .from('login_logs')
        .insert([{
          user_id: data.user.id,
          ip_address: clientIP,
          user_agent: req.headers['user-agent'] || 'Unknown',
          success: true,
          login_at: new Date().toISOString()
        }]);
    } catch (logError) {
      console.error('[Login API] Failed to log login event:', logError);
    }

    return sendResponse(res, 200, {
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: !!data.user.email_confirmed_at,
        lastSignIn: data.user.last_sign_in_at,
        createdAt: data.user.created_at
      },
      profile,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
        expiresIn: data.session.expires_in
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Login API] Server error:', error);
    logAPIRequest(req, 'login_error', { 
      error: error.message,
      ip: clientIP 
    });
    
    return sendResponse(res, 500, { 
      error: 'Internal server error',
      message: 'An unexpected error occurred during login'
    });
  }
}
