import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Read environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://sbdrzesfuweacfssdwzk.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const PORT = Number(process.env.PORT || 3001);

if (!SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn("[server] SUPABASE_SERVICE_ROLE_KEY is not set. /api/register will fail until configured.");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.use(cors());
app.use(express.json());

type RegisterBody = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  branch?: string;
  year?: number | null;
};

app.post("/api/register", async (req, res) => {
  const body: RegisterBody = req.body || {};

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const firstName = (body.firstName || "").trim();
  const lastName = (body.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check if a profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      return res.status(409).json({ error: "User already registered" });
    }

    // Create auth user (no confirmation for dev; adjust as needed)
    const { data: userCreate, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (userError || !userCreate?.user) {
      return res.status(400).json({ error: userError?.message || "Failed to create auth user" });
    }

    const userId = userCreate.user.id;

    // Determine initial role - check if this is one of the special admin emails
    const isAdminEmail = email === 'bloticbvducoep@gmail.com' || email === 'bloticbvucoep@gmail.com';
    const initialRole = isAdminEmail ? 'admin' : 'student';

    // Insert profile atomically after user creation
    const { error: profileError } = await supabaseAdmin.from("profiles").insert([
      {
        id: userId,
        email,
        full_name: fullName,
        role: initialRole,
        is_active: true,
        email_verified: true,
        phone: body.phone || null,
        branch: body.branch || null,
        year: body.year ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (profileError) {
      // Rollback: delete auth user if profile insert fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(400).json({ error: profileError.message || "Failed to create profile" });
    }

    return res.status(201).json({ ok: true });
  } catch (err) {
    const error = err as Error;
    return res.status(500).json({ error: error?.message || "Server error" });
  }
});

// Core Team endpoint
app.get("/api/core-team", async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("core_team")
      .select(`
        id, 
        user_id,
        full_name, 
        position, 
        department, 
        branch, 
        skills, 
        bio, 
        instagram_url, 
        linkedin_url, 
        whatsapp_url, 
        is_leadership, 
        is_active, 
        display_order,
        profiles:user_id (
          avatar_url
        )
      `)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error('[CoreTeam API] Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    // If no data, return empty array instead of error
    const teamMembers = data || [];
    
    return res.json({
      teamMembers,
      count: teamMembers.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const error = err as Error;
    console.error('[CoreTeam API] Server error:', error);
    return res.status(500).json({ error: error?.message || "Server error" });
  }
});

// Add dummy faculty coordinators endpoint
app.post("/api/core-team/seed-faculty", async (_req, res) => {
  try {
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
    const { data: existing } = await supabaseAdmin
      .from('core_team')
      .select('id')
      .in('id', ['faculty-1', 'faculty-2']);

    if (existing && existing.length > 0) {
      // Update existing
      for (const coordinator of facultyCoordinators) {
        await supabaseAdmin
          .from('core_team')
          .update(coordinator)
          .eq('id', coordinator.id);
      }
      return res.json({ message: 'Faculty coordinators updated successfully', count: facultyCoordinators.length });
    } else {
      // Insert new
      const { error } = await supabaseAdmin
        .from('core_team')
        .insert(facultyCoordinators);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.json({ message: 'Faculty coordinators added successfully', count: facultyCoordinators.length });
    }
  } catch (err) {
    const error = err as Error;
    console.error('[Seed Faculty API] Server error:', error);
    return res.status(500).json({ error: error?.message || "Server error" });
  }
});

// Summarized analytics for admin dashboard
app.get("/api/analytics/summary", async (_req, res) => {
  try {
    // Fetch data in parallel
    const [usersRes, eventsRes, registrationsRes, announcementsRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, created_at, role"),
      supabaseAdmin.from("events").select("id, created_at, event_date"),
      supabaseAdmin.from("event_registrations").select("id, created_at"),
      supabaseAdmin.from("announcements").select("id, created_at, is_active"),
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
      admin: users.filter((u) => u.role === "admin").length,
      core: users.filter((u) => u.role === "core").length,
      co_head: users.filter((u) => u.role === "co_head").length,
      member: users.filter((u) => u.role === "member").length,
      student: users.filter((u) => u.role === "student" || !u.role).length,
    };

    return res.json({
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
    const error = err as Error;
    return res.status(500).json({ error: error?.message || "Server error" });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${PORT}`);
});