import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getSessionTimeoutMs } from '@/utils/adminSettingsManager';

export const useSessionTimeout = () => {
  const navigate = useNavigate();

  const getSessionTimeout = useCallback(() => {
    return getSessionTimeoutMs();
  }, []);

  const updateLastActivity = useCallback(() => {
    localStorage.setItem('lastActivityTime', Date.now().toString());
  }, []);

  const checkInactivity = useCallback(async () => {
    const lastActivity = localStorage.getItem('lastActivityTime');
    if (!lastActivity) {
      updateLastActivity();
      return;
    }

    const timeoutDuration = getSessionTimeout();
    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);

    if (timeSinceLastActivity >= timeoutDuration) {
      // Session expired - logout user
      console.log('🔒 Session expired due to inactivity');
      await supabase.auth.signOut();
      localStorage.removeItem('lastActivityTime');
      navigate('/session-expired');
    }
  }, [getSessionTimeout, updateLastActivity, navigate]);

  useEffect(() => {
    // Initialize last activity time
    updateLastActivity();

    // Activity events to track
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Update last activity on user interaction
    const handleActivity = () => {
      updateLastActivity();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Check inactivity every minute
    const inactivityInterval = setInterval(checkInactivity, 60000);

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(inactivityInterval);
    };
  }, [updateLastActivity, checkInactivity]);
};
