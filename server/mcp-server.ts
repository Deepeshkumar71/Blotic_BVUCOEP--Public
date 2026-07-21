import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://sbdrzesfuweacfssdwzk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate required environment variables
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
  console.error('Please add it to your .env file');
  process.exit(1);
}

if (!SUPABASE_URL.includes('supabase.co')) {
  console.error('❌ ERROR: Invalid SUPABASE_URL format');
  console.error('Expected format: https://your-project.supabase.co');
  console.error('Current value:', SUPABASE_URL);
  process.exit(1);
}

console.log('✅ Environment variables validated');
console.log('📡 Connecting to Supabase:', SUPABASE_URL);

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Create an MCP server
const server = new McpServer({
  name: 'blotic-mcp-server',
  version: '1.0.0'
});

// Add a tool to get user information
server.registerTool(
  'get_user_info',
  {
    title: 'Get User Information',
    description: 'Retrieve user profile information by user ID',
    inputSchema: { userId: z.string() },
    outputSchema: { 
      id: z.string(),
      email: z.string().optional(),
      full_name: z.string().optional(),
      role: z.string().optional(),
      is_active: z.boolean().optional()
    }
  },
  async ({ userId }) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, role, is_active')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch user: ${error.message}`);
      }

      const output = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        is_active: data.is_active
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: 'text', text: `Error: ${errorMessage}` }],
        isError: true
      };
    }
  }
);

// Add a tool to get event information
server.registerTool(
  'get_events',
  {
    title: 'Get Events',
    description: 'Retrieve upcoming events',
    inputSchema: { limit: z.number().optional().default(10) },
    outputSchema: { 
      events: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        event_date: z.string(),
        location: z.string().optional()
      }))
    }
  },
  async ({ limit = 10 }) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('events')
        .select('id, title, description, event_date, location')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch events: ${error.message}`);
      }

      const output = { events: data || [] };

      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: 'text', text: `Error: ${errorMessage}` }],
        isError: true
      };
    }
  }
);

// Add a tool to get core team members
server.registerTool(
  'get_core_team',
  {
    title: 'Get Core Team Members',
    description: 'Retrieve information about core team members',
    inputSchema: { limit: z.number().optional().default(20) },
    outputSchema: { 
      teamMembers: z.array(z.object({
        id: z.string(),
        full_name: z.string(),
        position: z.string(),
        department: z.string().optional(),
        branch: z.string().optional(),
        bio: z.string().optional()
      }))
    }
  },
  async ({ limit = 20 }) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('core_team')
        .select(`
          id, 
          full_name, 
          position, 
          department, 
          branch, 
          bio
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch core team: ${error.message}`);
      }

      const output = { teamMembers: data || [] };

      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: 'text', text: `Error: ${errorMessage}` }],
        isError: true
      };
    }
  }
);

// Add a resource for application statistics
server.registerResource(
  'app-stats',
  'blotic://stats',
  {
    title: 'Application Statistics',
    description: 'Key statistics about the Blotic application',
    mimeType: 'application/json'
  },
  async () => {
    try {
      // Fetch data in parallel
      const [usersRes, eventsRes, registrationsRes, announcementsRes] = await Promise.all([
        supabaseAdmin.from('profiles').select('id, created_at, role'),
        supabaseAdmin.from('events').select('id, created_at, event_date'),
        supabaseAdmin.from('event_registrations').select('id, created_at'),
        supabaseAdmin.from('announcements').select('id, created_at, is_active'),
      ]);

      // Error handling
      if (usersRes.error) throw new Error(`Users error: ${usersRes.error.message}`);
      if (eventsRes.error) throw new Error(`Events error: ${eventsRes.error.message}`);
      if (registrationsRes.error) throw new Error(`Registrations error: ${registrationsRes.error.message}`);
      if (announcementsRes.error) throw new Error(`Announcements error: ${announcementsRes.error.message}`);

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

      // Role distribution
      const roleDistribution = {
        admin: users.filter((u) => u.role === 'admin').length,
        core: users.filter((u) => u.role === 'core').length,
        co_head: users.filter((u) => u.role === 'co_head').length,
        member: users.filter((u) => u.role === 'member').length,
        student: users.filter((u) => u.role === 'student' || !u.role).length,
      };

      const stats = {
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
      };

      return {
        contents: [
          {
            uri: 'blotic://stats',
            text: JSON.stringify(stats, null, 2),
            mimeType: 'application/json'
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        contents: [
          {
            uri: 'blotic://stats',
            text: `Error: ${errorMessage}`,
            mimeType: 'text/plain'
          }
        ]
      };
    }
  }
);

// Set up Express and HTTP transport
const app = express();
app.use(express.json());

// MCP endpoint
app.post('/mcp', async (req, res) => {
  // Create a new transport for each request to prevent request ID collisions
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  res.on('close', () => {
    transport.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// Health check endpoint
app.get('/mcp/health', (_req, res) => {
  res.json({ ok: true, server: 'blotic-mcp-server', version: '1.0.0' });
});

const MCP_PORT = parseInt(process.env.MCP_PORT || '3002');
app.listen(MCP_PORT, () => {
  console.log(`[MCP Server] listening on http://localhost:${MCP_PORT}/mcp`);
}).on('error', error => {
  console.error('[MCP Server] error:', error);
  process.exit(1);
});