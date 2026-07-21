import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { Monitor, Smartphone, Tablet } from "@/components/icons";

type UserSession = Tables<'user_sessions'>;

interface SessionWithIcon extends UserSession {
  icon: typeof Monitor | typeof Smartphone | typeof Tablet;
}

export const useUserSessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user sessions
  const {
    data: sessions,
    isLoading,
    error
  } = useQuery({
    queryKey: ['user-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_active_at', { ascending: false });

      if (error) throw error;

      // Add icons based on device type
      const sessionsWithIcons: SessionWithIcon[] = data.map(session => ({
        ...session,
        icon: getDeviceIcon(session.device_type || 'desktop'),
      }));

      return sessionsWithIcons;
    },
    enabled: !!user?.id,
  });

  // Logout from specific device
  const logoutFromDeviceMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions', user?.id] });
      toast({
        title: 'Success!',
        description: 'Device has been logged out successfully.',
        className: 'bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to logout from device',
        variant: 'destructive',
        className: 'bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md',
      });
    },
  });

  // Logout from all devices
  const logoutFromAllDevicesMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Deactivate all sessions
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (sessionError) throw sessionError;

      // Sign out globally
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
      if (signOutError) throw signOutError;
    },
    onSuccess: () => {
      queryClient.clear(); // Clear all queries since user is logging out
      toast({
        title: 'Success!',
        description: 'Logged out from all devices successfully.',
        className: 'bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to logout from all devices',
        variant: 'destructive',
        className: 'bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md',
      });
    },
  });

  // Create or update session (called on login)
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: {
      sessionToken: string;
      deviceInfo?: {
        device_type?: string;
        device_name?: string;
        browser_name?: string;
        browser_version?: string;
        operating_system?: string;
        user_agent?: string;
      };
      locationInfo?: {
        ip_address?: string;
        country?: string;
        city?: string;
        location_string?: string;
      };
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('upsert_user_session', {
        user_id_param: user.id,
        session_token_param: sessionData.sessionToken,
        device_info: sessionData.deviceInfo || {},
        location_info: sessionData.locationInfo || {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions', user?.id] });
    },
  });

  return {
    sessions: sessions || [],
    isLoading,
    error,
    logoutFromDevice: logoutFromDeviceMutation.mutate,
    logoutFromAllDevices: logoutFromAllDevicesMutation.mutate,
    createSession: createSessionMutation.mutate,
    isLoggingOut: logoutFromDeviceMutation.isPending || logoutFromAllDevicesMutation.isPending,
  };
};

// Helper function to get device icon
const getDeviceIcon = (deviceType: string) => {
  switch (deviceType?.toLowerCase()) {
    case 'mobile':
    case 'phone':
      return Smartphone;
    case 'tablet':
      return Tablet;
    case 'desktop':
    case 'laptop':
    default:
      return Monitor;
  }
};

// Hook for recent login activity (mock data for now)
export const useLoginActivity = () => {
  const { user } = useAuth();

  // In a real app, this would fetch from an activity log table
  const mockActivity = [
    {
      id: '1',
      type: 'success',
      action: 'Successful login',
      device: 'Windows PC • Chrome',
      location: 'Mumbai, India',
      timestamp: '2 minutes ago',
    },
    {
      id: '2',
      type: 'success',
      action: 'Successful login',
      device: 'iPhone 14 • Safari',
      location: 'Mumbai, India',
      timestamp: '1 hour ago',
    },
    {
      id: '3',
      type: 'success',
      action: 'Successful login',
      device: 'Windows PC • Chrome',
      location: 'Mumbai, India',
      timestamp: 'Yesterday',
    },
    {
      id: '4',
      type: 'failed',
      action: 'Failed login attempt',
      device: 'Unknown device • Chrome',
      location: 'Delhi, India',
      timestamp: '2 days ago',
    },
  ];

  return {
    activity: mockActivity,
    isLoading: false,
  };
};
