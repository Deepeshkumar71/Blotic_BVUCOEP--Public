// Shared Supabase client for API routes
import { createClient } from '@supabase/supabase-js';

/**
 * Initialize Supabase client for API routes
 * @param {string} token - Optional user token for authenticated requests
 * @returns {Object} Supabase client instance
 */
export function createSupabaseClient(token = null) {
  // Use environment variables - NEW SERVER
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sbdrzesfuweacfssdwzk.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key';
  
  if (!supabaseKey) {
    throw new Error('Supabase key not found');
  }

  const options = {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  };

  // Add authorization header if token provided
  if (token) {
    options.global = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  return createClient(supabaseUrl, supabaseKey, options);
}

/**
 * Verify user token and get user data
 * @param {string} authHeader - Authorization header from request
 * @returns {Object} User data or error
 */
export async function verifyUserToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'No authorization token provided', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createSupabaseClient(token);

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { error: 'Invalid or expired token', status: 401 };
    }

    return { user, supabase };
  } catch (error) {
    return { error: 'Token verification failed', status: 401 };
  }
}

/**
 * Standard API response helper
 * @param {Object} res - Response object
 * @param {number} status - HTTP status code
 * @param {Object} data - Response data
 * @returns {Object} JSON response
 */
export function sendResponse(res, status, data) {
  return res.status(status).json({
    success: status >= 200 && status < 300,
    timestamp: new Date().toISOString(),
    ...data
  });
}

/**
 * Handle CORS preflight requests
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {boolean} True if handled, false otherwise
 */
export function handleCORS(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

/**
 * Log API request for monitoring
 * @param {Object} req - Request object
 * @param {string} action - Action being performed
 * @param {Object} metadata - Additional metadata
 */
export function logAPIRequest(req, action, metadata = {}) {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    action,
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    ...metadata
  };

  console.log('[API]', JSON.stringify(logData));
}

/**
 * Validate required fields in request body
 * @param {Object} body - Request body
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation result
 */
export function validateRequiredFields(body, requiredFields) {
  const missing = requiredFields.filter(field => !body[field]);
  
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(', ')}`,
      status: 400
    };
  }

  return { valid: true };
}

/**
 * Rate limiting helper (simple in-memory implementation)
 */
const rateLimitMap = new Map();

export function checkRateLimit(ip, maxRequests = 100, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip);
  
  // Remove old requests
  const recentRequests = requests.filter(time => time > windowStart);
  
  if (recentRequests.length >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  
  return { allowed: true, remaining: maxRequests - recentRequests.length };
}
