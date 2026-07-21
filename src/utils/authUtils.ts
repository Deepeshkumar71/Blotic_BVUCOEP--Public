// Authentication utility functions

/**
 * Clears all authentication-related data from browser storage
 * This ensures complete logout across both localhost and deployed environments
 */
export const clearAuthStorage = () => {
  console.log('🧹 Clearing all authentication storage...');
  
  // List of all possible Supabase storage keys
  const supabaseKeys = [
    'supabase.auth.token',
    'sb-sbdrzesfuweacfssdwzk-auth-token',
    'supabase-auth-token',
    'sb-auth-token',
    'blotic-auth-token', // Custom storage key from client config
    'sb-sbdrzesfuweacfssdwzk-auth-token-code-verifier',
    'sb-sbdrzesfuweacfssdwzk-auth-token-refresh-token',
  ];
  
  // Clear specific keys from localStorage
  supabaseKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  // Clear all keys that start with 'sb-' (Supabase prefix)
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase')) {
      localStorage.removeItem(key);
    }
  });
  
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase')) {
      sessionStorage.removeItem(key);
    }
  });
  
  console.log('✅ Authentication storage cleared');
};

/**
 * Clears authentication-related cookies
 */
export const clearAuthCookies = () => {
  console.log('🍪 Clearing authentication cookies...');
  
  // Get all cookies and clear Supabase-related ones
  document.cookie.split(";").forEach((cookie) => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    const trimmedName = name.trim();
    
    if (trimmedName.includes('sb-') || trimmedName.includes('supabase') || trimmedName.includes('auth')) {
      // Clear cookie for current domain
      document.cookie = `${trimmedName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      // Clear cookie for parent domain
      document.cookie = `${trimmedName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      // Clear cookie for all subdomains
      const domain = window.location.hostname.split('.').slice(-2).join('.');
      document.cookie = `${trimmedName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${domain}`;
    }
  });
  
  console.log('✅ Authentication cookies cleared');
};

/**
 * Performs a complete logout cleanup
 * This function ensures logout works in both development and production
 */
export const performCompleteLogout = () => {
  console.log('🔓 Performing complete logout...');
  
  // Clear all storage
  clearAuthStorage();
  
  // Clear all cookies
  clearAuthCookies();
  
  // Clear any cached data
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        if (cacheName.includes('auth') || cacheName.includes('supabase')) {
          caches.delete(cacheName);
        }
      });
    });
  }
  
  console.log('✅ Complete logout performed');
};

/**
 * Redirects to home page after logout
 * Uses different methods for localhost vs deployed
 */
export const redirectAfterLogout = () => {
  console.log('🔄 Redirecting after logout...');
  
  // Small delay to ensure storage is cleared
  setTimeout(() => {
    // Use window.location.href for immediate redirect
    window.location.href = '/';
  }, 50);
};
