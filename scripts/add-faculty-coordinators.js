// Script to add dummy faculty coordinators to core_team table
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbdrzesfuweacfssdwzk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

async function addFacultyCoordinators() {
  try {
    console.log('Adding faculty coordinators to core_team table...');
    
    // First, check if they already exist
    const { data: existing } = await supabase
      .from('core_team')
      .select('id')
      .in('id', ['faculty-1', 'faculty-2']);
    
    if (existing && existing.length > 0) {
      console.log('Faculty coordinators already exist, updating...');
      
      for (const coordinator of facultyCoordinators) {
        const { error } = await supabase
          .from('core_team')
          .update(coordinator)
          .eq('id', coordinator.id);
        
        if (error) {
          console.error(`Error updating ${coordinator.full_name}:`, error);
        } else {
          console.log(`Updated ${coordinator.full_name}`);
        }
      }
    } else {
      console.log('Inserting new faculty coordinators...');
      
      const { error } = await supabase
        .from('core_team')
        .insert(facultyCoordinators);
      
      if (error) {
        console.error('Error inserting faculty coordinators:', error);
      } else {
        console.log('Successfully added faculty coordinators!');
      }
    }
    
    // Verify the data
    const { data: verify } = await supabase
      .from('core_team')
      .select('*')
      .eq('position', 'Faculty Coordinator')
      .eq('is_active', true);
    
    console.log('Faculty coordinators in database:', verify?.length || 0);
    verify?.forEach(coordinator => {
      console.log(`- ${coordinator.full_name} (${coordinator.department})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addFacultyCoordinators();
