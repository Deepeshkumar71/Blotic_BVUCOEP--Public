import { 
  handleCORS, 
  createSupabaseClient, 
  sendResponse, 
  logAPIRequest 
} from './_lib/supabase.js';

// Enhanced health check endpoint with database connectivity
export default async function handler(req, res) {
  // Handle CORS
  if (handleCORS(req, res)) return;

  const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

  if (req.method !== 'GET') {
    return sendResponse(res, 405, { error: 'Method not allowed' });
  }

  try {
    logAPIRequest(req, 'health_check', { ip: clientIP });

    const startTime = Date.now();
    
    // Test database connectivity
    let dbStatus = 'unknown';
    let dbLatency = 0;
    
    try {
      const supabase = createSupabaseClient();
      const dbStartTime = Date.now();
      
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      dbLatency = Date.now() - dbStartTime;
      dbStatus = error ? 'error' : 'connected';
    } catch (dbError) {
      dbStatus = 'error';
      console.error('[Health Check] Database error:', dbError);
    }

    const responseTime = Date.now() - startTime;

    const healthData = {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'unknown',
      deployment: {
        url: 'https://blotic-bvucoep.vercel.app',
        commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
        branch: process.env.VERCEL_GIT_COMMIT_REF || 'unknown'
      },
      services: {
        database: {
          status: dbStatus,
          latency: `${dbLatency}ms`
        },
        api: {
          status: 'healthy',
          responseTime: `${responseTime}ms`
        }
      },
      endpoints: {
        auth: '/api/auth/login',
        profile: '/api/user/profile',
        events: '/api/events',
        passwordChange: '/api/change-password'
      }
    };

    return sendResponse(res, 200, healthData);

  } catch (error) {
    console.error('[Health Check] Error:', error);
    logAPIRequest(req, 'health_check_error', { 
      error: error.message, 
      ip: clientIP 
    });

    return sendResponse(res, 500, {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      version: '1.0.0'
    });
  }
}
