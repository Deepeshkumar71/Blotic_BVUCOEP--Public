import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type UserPreferences = Tables<'user_preferences'>;
type UserPreferencesInsert = TablesInsert<'user_preferences'>;
type UserPreferencesUpdate = TablesUpdate<'user_preferences'>;

export const useUserPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user preferences
  const {
    data: preferences,
    isLoading,
    error
  } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // Return default preferences if none exist
      if (!data) {
        return {
          id: '',
          user_id: user.id,
          email_notifications: true,
          event_reminders: true,
          marketing_emails: false,
          sms_notifications: false,
          sms_verified: false,
          push_notifications: true,
          notification_frequency: 'immediate' as const,
          profile_visibility: 'public' as const,
          show_email: false,
          show_phone: false,
          theme: 'system' as const,
          language: 'en',
          created_at: null,
          updated_at: null,
        } as UserPreferences;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  // Update user preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<UserPreferencesUpdate>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences', user?.id] });
      toast({
        title: 'Success!',
        description: 'Your preferences have been updated.',
        className: 'bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update preferences',
        variant: 'destructive',
        className: 'bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md',
      });
    },
  });

  return {
    preferences,
    isLoading,
    error,
    updatePreferences: updatePreferencesMutation.mutate,
    isUpdating: updatePreferencesMutation.isPending,
  };
};

// Hook for notification preferences specifically
export const useNotificationPreferences = () => {
  const { preferences, updatePreferences, isUpdating } = useUserPreferences();

  const updateNotificationPreference = (key: keyof UserPreferences, value: boolean | string) => {
    updatePreferences({ [key]: value });
  };

  return {
    emailNotifications: preferences?.email_notifications ?? true,
    eventReminders: preferences?.event_reminders ?? true,
    marketingEmails: preferences?.marketing_emails ?? false,
    smsNotifications: preferences?.sms_notifications ?? false,
    smsVerified: preferences?.sms_verified ?? false,
    pushNotifications: preferences?.push_notifications ?? true,
    notificationFrequency: preferences?.notification_frequency ?? 'immediate',
    updateNotificationPreference,
    isUpdating,
  };
};

// Hook for privacy preferences
export const usePrivacyPreferences = () => {
  const { preferences, updatePreferences, isUpdating } = useUserPreferences();

  const updatePrivacyPreference = (key: keyof UserPreferences, value: boolean | string) => {
    updatePreferences({ [key]: value });
  };

  return {
    profileVisibility: preferences?.profile_visibility ?? 'public',
    showEmail: preferences?.show_email ?? false,
    showPhone: preferences?.show_phone ?? false,
    updatePrivacyPreference,
    isUpdating,
  };
};

// Hook for UI preferences
export const useUIPreferences = () => {
  const { preferences, updatePreferences, isUpdating } = useUserPreferences();

  const updateUIPreference = (key: keyof UserPreferences, value: string) => {
    updatePreferences({ [key]: value });
  };

  return {
    theme: preferences?.theme ?? 'system',
    language: preferences?.language ?? 'en',
    updateUIPreference,
    isUpdating,
  };
};
