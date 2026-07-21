import { 
  handleCORS, 
  createSupabaseClient, 
  sendResponse, 
  logAPIRequest 
} from '../_lib/supabase.js';

// Events API - Public endpoint for fetching events
export default async function handler(req, res) {
  // Handle CORS
  if (handleCORS(req, res)) return;

  const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

  try {
    logAPIRequest(req, 'events_access', { method: req.method, ip: clientIP });

    switch (req.method) {
      case 'GET':
        return handleGetEvents(req, res);
      default:
        return sendResponse(res, 405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Events API] Error:', error);
    logAPIRequest(req, 'events_error', { error: error.message, ip: clientIP });
    return sendResponse(res, 500, { error: 'Internal server error' });
  }
}

// Get events with optional filtering
async function handleGetEvents(req, res) {
  try {
    const supabase = createSupabaseClient();
    
    const { 
      limit = 50, 
      offset = 0, 
      upcoming = false,
      featured = false,
      category,
      search 
    } = req.query;

    let query = supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        event_date,
        event_time,
        location,
        category,
        featured,
        image_url,
        registration_url,
        max_participants,
        current_participants,
        status,
        created_at,
        updated_at
      `)
      .eq('status', 'published')
      .order('event_date', { ascending: true });

    // Filter upcoming events
    if (upcoming === 'true') {
      const now = new Date().toISOString();
      query = query.gte('event_date', now);
    }

    // Filter featured events
    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    // Filter by category
    if (category) {
      query = query.eq('category', category);
    }

    // Search in title and description
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: events, error, count } = await query;

    if (error) {
      console.error('[Events API] Get events error:', error);
      return sendResponse(res, 400, { error: 'Failed to fetch events' });
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    return sendResponse(res, 200, {
      events: events || [],
      pagination: {
        total: totalCount || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < (totalCount || 0)
      },
      filters: {
        upcoming: upcoming === 'true',
        featured: featured === 'true',
        category,
        search
      },
      message: 'Events retrieved successfully'
    });

  } catch (error) {
    console.error('[Events API] Get events error:', error);
    return sendResponse(res, 500, { error: 'Failed to retrieve events' });
  }
}
