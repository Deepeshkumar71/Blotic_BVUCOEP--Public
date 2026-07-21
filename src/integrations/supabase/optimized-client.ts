/**
 * Optimized Supabase Client - Phase 2B
 * 
 * This client is optimized for performance:
 * 1. Lazy initialization of realtime features
 * 2. Minimal initial bundle size
 * 3. Smart feature loading based on usage
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Core client with minimal features for initial load
const createCoreClient = () => {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'blotic-auth-token',
      debug: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'blotic-web-app',
      }
    },
    db: {
      schema: 'public',
    },
    // Disable realtime by default - will be enabled on demand
    realtime: {
      params: {
        eventsPerSecond: 0, // Disable initially
      },
    },
  });
};

// Singleton pattern for client instance
let clientInstance: SupabaseClient<Database> | null = null;

// Get the core client (always available)
export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!clientInstance) {
    clientInstance = createCoreClient();
  }
  return clientInstance;
};

// Lazy-loaded realtime client
let realtimeEnabled = false;

export const enableRealtime = async (): Promise<SupabaseClient<Database>> => {
  const client = getSupabaseClient();
  
  if (!realtimeEnabled) {
    console.log('[Supabase] Enabling realtime features...');
    
    // Reconfigure client with realtime enabled
    const realtimeClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'blotic-auth-token',
        debug: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'blotic-web-app-realtime',
        }
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    
    // Replace the singleton instance
    clientInstance = realtimeClient;
    realtimeEnabled = true;
    
    console.log('[Supabase] Realtime features enabled');
  }
  
  return client;
};

// Convenience exports for common operations
export const supabase = getSupabaseClient();

// Auth-specific client (lightweight)
export const authClient = {
  signUp: (credentials: any) => supabase.auth.signUp(credentials),
  signIn: (credentials: any) => supabase.auth.signInWithPassword(credentials),
  signOut: () => supabase.auth.signOut(),
  getSession: () => supabase.auth.getSession(),
  getUser: () => supabase.auth.getUser(),
  onAuthStateChange: (callback: any) => supabase.auth.onAuthStateChange(callback),
  resetPassword: (email: string) => supabase.auth.resetPasswordForEmail(email),
  updatePassword: (password: string) => supabase.auth.updateUser({ password }),
};

// Database-specific client (core queries)
export const dbClient = {
  from: (table: string) => supabase.from(table),
  rpc: (fn: string, args?: any) => supabase.rpc(fn, args),
  storage: supabase.storage,
};

// Realtime-specific client (lazy loaded)
export const realtimeClient = {
  subscribe: async (table: string, callback: any) => {
    const client = await enableRealtime();
    return client
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  },
  
  channel: async (name: string) => {
    const client = await enableRealtime();
    return client.channel(name);
  }
};

// Performance monitoring
export const supabaseMetrics = {
  getConnectionInfo: () => ({
    realtimeEnabled,
    clientInitialized: !!clientInstance,
    url: SUPABASE_URL,
  }),
  
  resetConnection: () => {
    clientInstance = null;
    realtimeEnabled = false;
    console.log('[Supabase] Connection reset');
  }
};

// Export default client for backward compatibility
export default supabase;
