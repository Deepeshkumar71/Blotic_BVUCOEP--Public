import { 
  handleCORS, 
  verifyUserToken, 
  sendResponse, 
  logAPIRequest, 
  validateRequiredFields,
  checkRateLimit 
} from './_lib/supabase.js';

// Vercel serverless function for secure password change with forced logout
export default async function handler(req, res) {
  // Handle CORS
  if (handleCORS(req, res)) return;

  // Only allow POST requests
  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
  const rateLimit = checkRateLimit(clientIP, 5, 15 * 60 * 1000); // 5 requests per 15 minutes
  
  if (!rateLimit.allowed) {
    return sendResponse(res, 429, { 
      error: 'Too many password change attempts. Please try again later.',
      retryAfter: 900 // 15 minutes
    });
  }

  try {
    logAPIRequest(req, 'password_change_attempt', { ip: clientIP });

    // Validate request body
    const validation = validateRequiredFields(req.body, ['newPassword']);
    if (!validation.valid) {
      return sendResponse(res, validation.status, { error: validation.error });
    }

    const { newPassword, currentPassword } = req.body;

    // Validate password strength
    if (newPassword.length < 8) {
      return sendResponse(res, 400, { error: 'Password must be at least 8 characters long' });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return sendResponse(res, 400, { 
        error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
      });
    }

    // Verify user token
    const authResult = await verifyUserToken(req.headers.authorization);
    if (authResult.error) {
      return sendResponse(res, authResult.status, { error: authResult.error });
    }

    const { user, supabase } = authResult;
    logAPIRequest(req, 'password_change_authenticated', { userId: user.id, ip: clientIP });

    console.log('[Password Change API] Starting password update for user:', user.id);

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      console.error('[Password Change API] Password update failed:', updateError);
      logAPIRequest(req, 'password_change_failed', { 
        userId: user.id, 
        error: updateError.message,
        ip: clientIP 
      });
      return sendResponse(res, 400, { error: updateError.message });
    }

    console.log('[Password Change API] Password updated successfully');

    // Log the password change event
    try {
      const { error: logError } = await supabase
        .from('password_changes')
        .insert([{
          user_id: user.id,
          changed_at: new Date().toISOString(),
          ip_address: clientIP,
          user_agent: req.headers['user-agent'] || 'Unknown',
          success: true
        }]);

      if (logError) {
        console.error('[Password Change API] Failed to log password change:', logError);
      }
    } catch (logError) {
      console.error('[Password Change API] Password change logging error:', logError);
    }

    // Force logout by invalidating all sessions
    console.log('[Password Change API] Forcing global logout...');
    
    try {
      // Sign out from all devices for security
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
      
      if (signOutError) {
        console.error('[Password Change API] Global signout error:', signOutError);
        // Try local signout as fallback
        await supabase.auth.signOut({ scope: 'local' });
      }
    } catch (signOutError) {
      console.error('[Password Change API] Signout error:', signOutError);
    }

    logAPIRequest(req, 'password_change_success', { 
      userId: user.id, 
      ip: clientIP,
      globalLogout: true 
    });

    console.log('[Password Change API] Password change completed successfully');

    return sendResponse(res, 200, { 
      message: 'Password updated successfully. You have been logged out from all devices for security.',
      forceLogout: true,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('[Password Change API] Server error:', err);
    logAPIRequest(req, 'password_change_error', { 
      error: err.message,
      ip: clientIP 
    });
    
    return sendResponse(res, 500, { 
      error: 'Internal server error',
      message: 'An unexpected error occurred while changing your password'
    });
  }
}
