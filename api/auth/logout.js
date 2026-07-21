import { 
  handleCORS, 
  verifyUserToken, 
  sendResponse, 
  logAPIRequest 
} from '../_lib/supabase.js';

// User logout API with session invalidation
export default async function handler(req, res) {
  // Handle CORS
  if (handleCORS(req, res)) return;

  // Only allow POST requests
  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method not allowed' });
  }

  const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

  try {
    logAPIRequest(req, 'logout_attempt', { ip: clientIP });

    // Verify user token
    const authResult = await verifyUserToken(req.headers.authorization);
    if (authResult.error) {
      // Even if token is invalid, we'll still return success for logout
      logAPIRequest(req, 'logout_invalid_token', { ip: clientIP });
      return sendResponse(res, 200, { 
        message: 'Logged out successfully',
        timestamp: new Date().toISOString()
      });
    }

    const { user, supabase } = authResult;

    // Get logout scope from request body
    const { scope = 'local' } = req.body || {};

    console.log(`[Logout API] Logging out user ${user.id} with scope: ${scope}`);

    // Perform logout
    const { error } = await supabase.auth.signOut({ 
      scope: scope === 'global' ? 'global' : 'local' 
    });

    if (error) {
      console.error('[Logout API] Logout error:', error);
      logAPIRequest(req, 'logout_failed', { 
        userId: user.id, 
        error: error.message,
        scope,
        ip: clientIP 
      });
      
      return sendResponse(res, 400, { 
        error: 'Logout failed',
        message: error.message 
      });
    }

    // Log logout event to database
    try {
      await supabase
        .from('login_logs')
        .insert([{
          user_id: user.id,
          ip_address: clientIP,
          user_agent: req.headers['user-agent'] || 'Unknown',
          success: true,
          logout_at: new Date().toISOString(),
          logout_scope: scope
        }]);
    } catch (logError) {
      console.error('[Logout API] Failed to log logout event:', logError);
    }

    logAPIRequest(req, 'logout_success', { 
      userId: user.id,
      scope,
      ip: clientIP 
    });

    console.log(`[Logout API] User ${user.id} logged out successfully`);

    return sendResponse(res, 200, {
      message: scope === 'global' 
        ? 'Logged out from all devices successfully' 
        : 'Logged out successfully',
      scope,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Logout API] Server error:', error);
    logAPIRequest(req, 'logout_error', { 
      error: error.message,
      ip: clientIP 
    });
    
    // Still return success for logout even if there's an error
    return sendResponse(res, 200, { 
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });
  }
}
