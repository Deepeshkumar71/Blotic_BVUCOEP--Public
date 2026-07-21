import { createClient } from '@supabase/supabase-js';

// Vercel serverless function for analytics summary
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sbdrzesfuweacfssdwzk.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseKey) {
      console.error('[Analytics API] No Supabase key available');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch data in parallel
    const [usersRes, eventsRes, registrationsRes, announcementsRes] = await Promise.all([
      supabase.from('profiles').select('id, created_at, role'),
      supabase.from('events').select('id, created_at, event_date'),
      supabase.from('event_registrations').select('id, created_at'),
      supabase.from('announcements').select('id, created_at, is_active'),
    ]);

    // Error handling
    if (usersRes.error) return res.status(400).json({ error: usersRes.error.message });
    if (eventsRes.error) return res.status(400).json({ error: eventsRes.error.message });
    if (registrationsRes.error) return res.status(400).json({ error: registrationsRes.error.message });
    if (announcementsRes.error) return res.status(400).json({ error: announcementsRes.error.message });

    const users = usersRes.data || [];
    const events = eventsRes.data || [];
    const registrations = registrationsRes.data || [];
    const announcements = announcementsRes.data || [];

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const newUsersLast30Days = users.filter((u) => new Date(u.created_at) >= last30Days).length;
    const newUsersLast7Days = users.filter((u) => new Date(u.created_at) >= last7Days).length;
    const upcomingEvents = events.filter((e) => new Date(e.event_date) >= now).length;
    const pastEvents = events.filter((e) => new Date(e.event_date) < now).length;
    const activeAnnouncements = announcements.filter((a) => a.is_active).length;

    // Role distribution aligned with current roles in app
    const roleDistribution = {
      admin: users.filter((u) => u.role === 'admin').length,
      core: users.filter((u) => u.role === 'core').length,
      co_head: users.filter((u) => u.role === 'co_head').length,
      member: users.filter((u) => u.role === 'member').length,
      student: users.filter((u) => u.role === 'student' || !u.role).length,
    };

    return res.status(200).json({
      totalUsers: users.length,
      totalEvents: events.length,
      totalRegistrations: registrations.length,
      totalAnnouncements: announcements.length,
      newUsersLast30Days,
      newUsersLast7Days,
      upcomingEvents,
      pastEvents,
      activeAnnouncements,
      roleDistribution,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Analytics API] Server error:', err);
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}
