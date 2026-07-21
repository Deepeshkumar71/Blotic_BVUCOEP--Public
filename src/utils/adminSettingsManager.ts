/**
 * Centralized Admin Settings Manager
 * Uses Supabase database for cross-device consistency
 * Falls back to localStorage cache for performance
 */

import { supabase } from '@/integrations/supabase/client';

export interface AdminSettings {
  // General
  siteTitle: string;
  siteEmail: string;
  siteDescription: string;
  contactPhone: string;
  
  // Registration
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  
  // Events
  allowEventRegistration: boolean;
  
  // Security
  sessionTimeoutMinutes: number;
  minPasswordLength: number;
}

const DEFAULT_SETTINGS: AdminSettings = {
  // General
  siteTitle: "BLOTIC",
  siteEmail: "bloticbvducoep@gmail.com",
  siteDescription: "Bharati Vidyapeeth's Premier Blockchain & Web3 Club",
  contactPhone: "+91 1234567890",
  
  // Registration
  registrationEnabled: true,
  emailVerificationRequired: true,
  
  // Events
  allowEventRegistration: true,
  
  // Security
  sessionTimeoutMinutes: 60,
  minPasswordLength: 6,
};

const CACHE_KEY = "adminSettings_cache";
const CACHE_TIMESTAMP_KEY = "adminSettings_timestamp";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

let settingsCache: AdminSettings | null = null;
let cacheTimestamp = 0;

/**
 * Get admin settings from database (synchronous with cache)
 * Use getAdminSettingsAsync() for fresh data from database
 */
export const getAdminSettings = (): AdminSettings => {
  // Return cached settings if available and fresh
  if (settingsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return { ...settingsCache };
  }

  // Try localStorage cache
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < CACHE_DURATION) {
          const settings = JSON.parse(cached);
          settingsCache = settings;
          cacheTimestamp = parseInt(timestamp);
          return { ...DEFAULT_SETTINGS, ...settings };
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Cache read error:', error);
  }

  // Fallback to defaults and trigger async refresh
  getAdminSettingsAsync().catch(console.error);
  return { ...DEFAULT_SETTINGS };
};

/**
 * Get admin settings from database (async)
 */
export const getAdminSettingsAsync = async (): Promise<AdminSettings> => {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('key, value');

    if (error) {
      console.error('❌ Error fetching settings from database:', error);
      return { ...DEFAULT_SETTINGS };
    }

    if (!data || data.length === 0) {
      console.log('📋 No settings in database, using defaults');
      return { ...DEFAULT_SETTINGS };
    }

    // Merge all settings from database
    const dbSettings: Partial<AdminSettings> = {};
    data.forEach(row => {
      if (row.value && typeof row.value === 'object') {
        Object.assign(dbSettings, row.value);
      }
    });

    const mergedSettings = { ...DEFAULT_SETTINGS, ...dbSettings };

    // Update cache
    settingsCache = mergedSettings;
    cacheTimestamp = Date.now();
    
    // Update localStorage cache
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(mergedSettings));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, cacheTimestamp.toString());
      }
    } catch (error) {
      console.warn('⚠️ Cache write error:', error);
    }

    console.log('✅ Settings loaded from database:', mergedSettings);
    return mergedSettings;
  } catch (error) {
    console.error('❌ Error loading admin settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
};

/**
 * Save admin settings to database
 */
export const saveAdminSettings = async (settings: AdminSettings): Promise<boolean> => {
  try {
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return false;
    }
    
    if (!session) {
      console.error('❌ No active session - user must be logged in to save settings');
      return false;
    }

    console.log('📋 Saving settings as user:', session.user.email);

    // Prepare settings by category
    const settingsData = [
      {
        key: 'general',
        value: {
          siteTitle: settings.siteTitle,
          siteEmail: settings.siteEmail,
          siteDescription: settings.siteDescription,
          contactPhone: settings.contactPhone
        }
      },
      {
        key: 'registration',
        value: {
          registrationEnabled: settings.registrationEnabled,
          emailVerificationRequired: settings.emailVerificationRequired
        }
      },
      {
        key: 'events',
        value: {
          allowEventRegistration: settings.allowEventRegistration
        }
      },
      {
        key: 'security',
        value: {
          sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
          minPasswordLength: settings.minPasswordLength
        }
      }
    ];

    // Update each setting in database
    for (const setting of settingsData) {
      console.log(`📝 Saving ${setting.key}...`);
      
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key: setting.key,
          value: setting.value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error(`❌ Error saving ${setting.key}:`, error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return false;
      }
      
      console.log(`✅ ${setting.key} saved successfully`);
    }

    // Update cache
    settingsCache = settings;
    cacheTimestamp = Date.now();
    
    // Update localStorage cache
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, cacheTimestamp.toString());
      }
    } catch (error) {
      console.warn('⚠️ Cache write error:', error);
    }

    // Dispatch event for real-time updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adminSettingsUpdated', { detail: settings }));
    }
    
    console.log('✅ Admin settings saved to database successfully');
    return true;
  } catch (error) {
    console.error('❌ Error saving admin settings:', error);
    return false;
  }
};

/**
 * Get a specific setting value
 */
export const getSetting = <K extends keyof AdminSettings>(key: K): AdminSettings[K] => {
  const settings = getAdminSettings();
  return settings[key];
};

/**
 * Update a specific setting
 */
export const updateSetting = async <K extends keyof AdminSettings>(
  key: K,
  value: AdminSettings[K]
): Promise<boolean> => {
  try {
    const settings = await getAdminSettingsAsync();
    settings[key] = value;
    return await saveAdminSettings(settings);
  } catch (error) {
    console.error(`❌ Error updating setting ${key}:`, error);
    return false;
  }
};

/**
 * Reset settings to defaults
 */
export const resetAdminSettings = async (): Promise<boolean> => {
  return await saveAdminSettings({ ...DEFAULT_SETTINGS });
};

/**
 * Initialize settings - call this on app startup
 */
export const initializeSettings = async (): Promise<void> => {
  try {
    await getAdminSettingsAsync();
    console.log('✅ Settings initialized');
  } catch (error) {
    console.error('❌ Error initializing settings:', error);
  }
};

/**
 * Check if registration is enabled
 */
export const isRegistrationEnabled = (): boolean => {
  return getSetting('registrationEnabled');
};

/**
 * Check if email verification is required
 */
export const isEmailVerificationRequired = (): boolean => {
  return getSetting('emailVerificationRequired');
};

/**
 * Check if event registration is allowed
 */
export const isEventRegistrationAllowed = (): boolean => {
  return getSetting('allowEventRegistration');
};

/**
 * Get session timeout in milliseconds
 */
export const getSessionTimeoutMs = (): number => {
  return getSetting('sessionTimeoutMinutes') * 60 * 1000;
};

/**
 * Get minimum password length
 */
export const getMinPasswordLength = (): number => {
  const minLength = getSetting('minPasswordLength');
  return minLength >= 6 ? minLength : 6; // Enforce minimum of 6
};
