import { createClient } from '@supabase/supabase-js';

// Vercel serverless function for seeding faculty coordinators
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
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sbdrzesfuweacfssdwzk.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseKey) {
      console.error('[Seed Faculty API] No Supabase key available');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const facultyCoordinators = [
      {
        id: 'faculty-1',
        full_name: 'Dr. Sarah Johnson',
        position: 'Faculty Coordinator',
        department: 'Computer Science',
        branch: 'CSE',
        bio: 'Dr. Sarah Johnson is a distinguished professor in Computer Science with over 15 years of experience in blockchain technology and distributed systems. She has published numerous research papers and actively guides students in cutting-edge technology projects.',
        skills: ['Blockchain Technology', 'Distributed Systems', 'Research', 'Mentoring'],
        instagram_url: null,
        linkedin_url: 'https://linkedin.com/in/sarah-johnson-cs',
        whatsapp_url: '+919876543210',
        is_leadership: false,
        is_active: true,
        display_order: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'faculty-2',
        full_name: 'Prof. Michael Chen',
        position: 'Faculty Coordinator',
        department: 'Information Technology',
        branch: 'IT',
        bio: 'Prof. Michael Chen is an experienced faculty member specializing in emerging technologies and student development. He has been instrumental in establishing industry partnerships and guiding students towards successful careers in technology.',
        skills: ['Emerging Technologies', 'Industry Relations', 'Student Development', 'Project Management'],
        instagram_url: null,
        linkedin_url: 'https://linkedin.com/in/michael-chen-it',
        whatsapp_url: '+919876543211',
        is_leadership: false,
        is_active: true,
        display_order: 101,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Check if they already exist
    const { data: existing } = await supabase
      .from('core_team')
      .select('id')
      .in('id', ['faculty-1', 'faculty-2']);

    if (existing && existing.length > 0) {
      // Update existing
      for (const coordinator of facultyCoordinators) {
        await supabase
          .from('core_team')
          .update(coordinator)
          .eq('id', coordinator.id);
      }
      return res.status(200).json({ 
        message: 'Faculty coordinators updated successfully', 
        count: facultyCoordinators.length 
      });
    } else {
      // Insert new
      const { error } = await supabase
        .from('core_team')
        .insert(facultyCoordinators);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ 
        message: 'Faculty coordinators added successfully', 
        count: facultyCoordinators.length 
      });
    }
  } catch (err) {
    console.error('[Seed Faculty API] Server error:', err);
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}
