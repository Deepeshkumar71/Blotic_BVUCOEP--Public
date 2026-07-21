import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ActivityManagerOptions {
  // Refresh session every X minutes to keep it alive (default: 5 minutes)
  refreshIntervalMinutes?: number;
  // Maximum idle time before showing warning (default: 8 minutes)
  maxIdleMinutes?: number;
}

export const useActivityManager = (options: ActivityManagerOptions = {}) => {
  const {
    refreshIntervalMinutes = 5,
    maxIdleMinutes = 8
  } = options;

  const { user, session } = useAuth();
  const lastActivityRef = useRef<number>(Date.now());
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Refresh session to keep it alive
  const refreshSession = useCallback(async () => {
    if (!session || !user) return;

    try {
      console.log('[ActivityManager] Refreshing session to keep alive...');
      const { error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[ActivityManager] Session refresh failed:', error);
      } else {
        console.log('[ActivityManager] Session refreshed successfully');
      }
    } catch (error) {
      console.error('[ActivityManager] Session refresh exception:', error);
    }
  }, [session, user]);

  // Check if user has been idle too long
  const checkIdleStatus = useCallback(() => {
    if (!user) return;

    const now = Date.now();
    const idleTime = now - lastActivityRef.current;
    const maxIdleMs = maxIdleMinutes * 60 * 1000;

    if (idleTime > maxIdleMs) {
      console.log('[ActivityManager] User has been idle for too long, refreshing session...');
      refreshSession();
      updateActivity(); // Reset activity timer
    }
  }, [user, maxIdleMinutes, refreshSession, updateActivity]);

  // Set up periodic session refresh
  useEffect(() => {
    if (!user || !session) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    const intervalMs = refreshIntervalMinutes * 60 * 1000;
    
    refreshIntervalRef.current = setInterval(() => {
      refreshSession();
    }, intervalMs);

    console.log(`[ActivityManager] Session refresh interval set to ${refreshIntervalMinutes} minutes`);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [user, session, refreshIntervalMinutes, refreshSession]);

  // Set up idle checking
  useEffect(() => {
    if (!user) {
      if (idleCheckIntervalRef.current) {
        clearInterval(idleCheckIntervalRef.current);
        idleCheckIntervalRef.current = null;
      }
      return;
    }

    // Check idle status every minute
    idleCheckIntervalRef.current = setInterval(checkIdleStatus, 60000);

    return () => {
      if (idleCheckIntervalRef.current) {
        clearInterval(idleCheckIntervalRef.current);
        idleCheckIntervalRef.current = null;
      }
    };
  }, [user, checkIdleStatus]);

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    const activityEvents = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus',
      'visibilitychange'
    ];

    const handleActivity = () => {
      updateActivity();
    };

    // Add event listeners
    activityEvents.forEach(event => {
      if (event === 'visibilitychange') {
        document.addEventListener(event, handleActivity, { passive: true });
      } else {
        window.addEventListener(event, handleActivity, { passive: true });
      }
    });

    // Initial activity update
    updateActivity();

    console.log('[ActivityManager] Activity listeners set up');

    return () => {
      // Remove event listeners
      activityEvents.forEach(event => {
        if (event === 'visibilitychange') {
          document.removeEventListener(event, handleActivity);
        } else {
          window.removeEventListener(event, handleActivity);
        }
      });
    };
  }, [user, updateActivity]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('[ActivityManager] Page became visible, refreshing session...');
        refreshSession();
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshSession, updateActivity]);

  return {
    refreshSession,
    updateActivity,
    lastActivity: lastActivityRef.current
  };
};

export default useActivityManager;
