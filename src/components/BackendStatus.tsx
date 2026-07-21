import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface BackendStatusProps {
  className?: string;
}

const BackendStatus = ({ className = "" }: BackendStatusProps) => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setStatus('online');
        } else {
          setStatus('offline');
        }
      } else {
        setStatus('offline');
      }
    } catch (error) {
      console.log('[BackendStatus] Backend not available:', error);
      setStatus('offline');
    }
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkBackendHealth();
    // Check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Backend Online';
      case 'offline':
        return 'Backend Offline (Using Fallback)';
      case 'checking':
        return 'Checking Backend...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'text-green-600';
      case 'offline':
        return 'text-red-600';
      case 'checking':
        return 'text-yellow-600';
    }
  };

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {getStatusIcon()}
      <span className={getStatusColor()}>
        {getStatusText()}
      </span>
      {lastCheck && status !== 'checking' && (
        <span className="text-gray-500">
          (Last check: {lastCheck.toLocaleTimeString()})
        </span>
      )}
    </div>
  );
};

export default BackendStatus;
