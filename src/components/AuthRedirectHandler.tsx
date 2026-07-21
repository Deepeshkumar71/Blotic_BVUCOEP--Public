import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthRedirect = () => {
      const urlParams = new URLSearchParams(location.search);
      const hashParams = new URLSearchParams(location.hash.substring(1));
      
      // Check for Supabase auth parameters
      const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
      const code = urlParams.get('code') || hashParams.get('code');
      const type = urlParams.get('type') || hashParams.get('type');
      const error = urlParams.get('error') || hashParams.get('error');
      
      console.log('🔧 AuthRedirectHandler - Current URL:', window.location.href);
      console.log('🔧 AuthRedirectHandler - Found params:', { 
        accessToken: !!accessToken, 
        refreshToken: !!refreshToken, 
        code: !!code, 
        type, 
        error 
      });
      
      // If we have auth parameters but we're not on the reset-password page
      if ((accessToken || code || type === 'recovery') && location.pathname !== '/reset-password') {
        console.log('🔧 AuthRedirectHandler - Redirecting to reset-password page');
        
        // Preserve all the auth parameters
        const params = new URLSearchParams();
        if (accessToken) params.set('access_token', accessToken);
        if (refreshToken) params.set('refresh_token', refreshToken);
        if (code) params.set('code', code);
        if (type) params.set('type', type);
        if (error) params.set('error', error);
        
        // Redirect to reset-password with all parameters
        navigate(`/reset-password?${params.toString()}`, { replace: true });
      }
      
      // If we have an error, redirect to reset-password to handle it
      if (error && location.pathname !== '/reset-password') {
        console.log('🔧 AuthRedirectHandler - Error found, redirecting to reset-password');
        navigate(`/reset-password${location.search}`, { replace: true });
      }
    };

    handleAuthRedirect();
  }, [location, navigate]);

  return null; // This component doesn't render anything
}
