import { createClient } from '@supabase/supabase-js';

// Vercel serverless function for core team API
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
      console.error('[API] No Supabase key available');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch core team members
    const { data, error } = await supabase
      .from('core_team')
      .select(`
        id, 
        user_id,
        full_name, 
        position, 
        department, 
        branch, 
        year,
        skills, 
        bio, 
        instagram_url, 
        linkedin_url, 
        whatsapp_url, 
        is_leadership, 
        is_active, 
        display_order,
        avatar_url
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[API] Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    const teamMembers = data || [];
    
    return res.status(200).json({
      teamMembers,
      count: teamMembers.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[API] Server error:', err);
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}
