import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle, XCircle } from "@/components/icons";

interface DebugInfo {
  environment: string;
  supabaseUrl: string;
  currentUrl: string;
  userAgent: string;
  sessionValid: boolean;
  profileLoaded: boolean;
  avatarUrl: string | null;
  role: string | null;
  email: string | null;
  userId: string | null;
  networkStatus: 'online' | 'offline';
  corsTest: 'pending' | 'success' | 'failed';
  storageTest: 'pending' | 'success' | 'failed';
}

export const ProductionDebug = () => {
  const { user, userProfile, loading, refreshProfile } = useAuth();
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    environment: 'unknown',
    supabaseUrl: '',
    currentUrl: '',
    userAgent: '',
    sessionValid: false,
    profileLoaded: false,
    avatarUrl: null,
    role: null,
    email: null,
    userId: null,
    networkStatus: 'online',
    corsTest: 'pending',
    storageTest: 'pending'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const runDiagnostics = useCallback(async () => {
    const info: DebugInfo = {
      environment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'local' : 'production',
      supabaseUrl: 'https://sbdrzesfuweacfssdwzk.supabase.co',
      currentUrl: window.location.href,
      userAgent: navigator.userAgent,
      sessionValid: !!user,
      profileLoaded: !!userProfile,
      avatarUrl: userProfile?.avatar_url || null,
      role: userProfile?.role || null,
      email: user?.email || null,
      userId: user?.id || null,
      networkStatus: navigator.onLine ? 'online' : 'offline',
      corsTest: 'pending',
      storageTest: 'pending'
    };

    // Test CORS with Supabase
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      info.corsTest = error ? 'failed' : 'success';
    } catch (error) {
      info.corsTest = 'failed';
    }

    // Test Storage access
    try {
      const { data, error } = await supabase.storage.from('avatars').list('', { limit: 1 });
      info.storageTest = error ? 'failed' : 'success';
    } catch (error) {
      info.storageTest = 'failed';
    }

    setDebugInfo(info);
  }, [user, userProfile]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
      await runDiagnostics();
    } finally {
      setIsRefreshing(false);
    }
  };

  const testAvatarLoad = () => {
    if (userProfile?.avatar_url) {
      const img = new Image();
      img.onload = () => console.log('✅ Avatar image loaded successfully');
      img.onerror = () => console.error('❌ Avatar image failed to load');
      img.src = userProfile.avatar_url;
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, [user, userProfile]); // Remove runDiagnostics from dependencies to prevent infinite loop

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Production Debug Information
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Environment</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Environment:</span>
                <Badge variant={debugInfo.environment === 'production' ? 'destructive' : 'default'}>
                  {debugInfo.environment}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Current URL:</span>
                <span className="text-xs truncate max-w-48">{debugInfo.currentUrl}</span>
              </div>
              <div className="flex justify-between">
                <span>Supabase URL:</span>
                <span className="text-xs truncate max-w-48">{debugInfo.supabaseUrl}</span>
              </div>
              <div className="flex justify-between">
                <span>Network:</span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(debugInfo.networkStatus)}
                  <span>{debugInfo.networkStatus}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Authentication</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Auth Loading:</span>
                <Badge variant={loading ? 'secondary' : 'default'}>
                  {loading ? 'Loading' : 'Complete'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Session Valid:</span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(debugInfo.sessionValid ? 'success' : 'failed')}
                  <span>{debugInfo.sessionValid ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Profile Loaded:</span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(debugInfo.profileLoaded ? 'success' : 'failed')}
                  <span>{debugInfo.profileLoaded ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span>User ID:</span>
                <span className="text-xs truncate max-w-32">{debugInfo.userId || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="text-xs truncate max-w-32">{debugInfo.email || 'None'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Profile Data</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Role:</span>
                <Badge variant={debugInfo.role === 'admin' ? 'destructive' : 'default'}>
                  {debugInfo.role || 'None'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Avatar URL:</span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(debugInfo.avatarUrl ? 'success' : 'failed')}
                  <span>{debugInfo.avatarUrl ? 'Set' : 'None'}</span>
                </div>
              </div>
              {debugInfo.avatarUrl && (
                <div className="flex justify-between">
                  <span>Avatar Domain:</span>
                  <span className="text-xs">{new URL(debugInfo.avatarUrl).hostname}</span>
                </div>
              )}
              <Button
                onClick={testAvatarLoad}
                size="sm"
                variant="outline"
                className="w-full"
                disabled={!debugInfo.avatarUrl}
              >
                Test Avatar Load
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">API Tests</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Database CORS:</span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(debugInfo.corsTest)}
                  <span>{debugInfo.corsTest}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Storage Access:</span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(debugInfo.storageTest)}
                  <span>{debugInfo.storageTest}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {debugInfo.environment === 'production' && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Production Environment Detected</h4>
            <p className="text-sm text-yellow-700">
              If you're experiencing issues with profile photos or admin dashboard access, 
              this could be due to:
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
              <li>CORS configuration in Supabase for your production domain</li>
              <li>Storage bucket policies and public access settings</li>
              <li>RLS policies not working correctly in production</li>
              <li>Network connectivity or CDN caching issues</li>
            </ul>
          </div>
        )}

        {debugInfo.avatarUrl && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Avatar Preview</h4>
            <img 
              src={debugInfo.avatarUrl} 
              alt="Avatar preview"
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              onLoad={() => console.log('✅ Avatar preview loaded')}
              onError={() => console.error('❌ Avatar preview failed')}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
