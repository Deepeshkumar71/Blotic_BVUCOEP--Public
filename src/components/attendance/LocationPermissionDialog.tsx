import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Settings, RefreshCw, ExternalLink, Smartphone } from 'lucide-react';
import LocationHandler, { LocationError } from '@/utils/locationHandler';

interface LocationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationGranted: (location: { latitude: number; longitude: number; accuracy: number }) => void;
  onLocationDenied: () => void;
  error?: LocationError;
}

const LocationPermissionDialog = ({
  open,
  onOpenChange,
  onLocationGranted,
  onLocationDenied,
  error
}: LocationPermissionDialogProps) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [currentError, setCurrentError] = useState<LocationError | undefined>(error);
  const locationHandler = LocationHandler.getInstance();

  const handleRequestLocation = async () => {
    setIsRequesting(true);
    setCurrentError(undefined);

    const result = await locationHandler.requestLocation();
    
    if (result.data) {
      console.log("🎯 Location granted in dialog:", result.data);
      onLocationGranted(result.data);
      // Don't close dialog here - let parent handle it
    } else if (result.error) {
      console.log("❌ Location error in dialog:", result.error);
      setCurrentError(result.error);
    }
    
    setIsRequesting(false);
  };

  const handleOpenDeviceSettings = async () => {
    const canPrompt = locationHandler.canPromptDeviceLocation();
    
    if (canPrompt) {
      const success = await locationHandler.promptDeviceLocationSettings();
      if (!success) {
        // Show instructions if we can't open settings directly
        setCurrentError({
          code: 2,
          message: 'Device settings needed',
          userMessage: locationHandler.getDeviceInstructions(),
          action: 'enable_device'
        });
      }
    } else {
      // Show instructions for desktop
      setCurrentError({
        code: 2,
        message: 'Device settings needed',
        userMessage: locationHandler.getDeviceInstructions(),
        action: 'enable_device'
      });
    }
  };

  const renderErrorContent = () => {
    if (!currentError) return null;

    switch (currentError.action) {
      case 'enable_browser':
        return (
          <div className="space-y-4">
            <Alert>
              <Settings className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Browser Permission Required</p>
                  <p className="text-sm">{currentError.userMessage}</p>
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                📝 How to enable:
              </p>
              <pre className="text-xs text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                {locationHandler.getBrowserInstructions()}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleRequestLocation} disabled={isRequesting} className="flex-1">
                <RefreshCw className={`w-4 h-4 mr-2 ${isRequesting ? 'animate-spin' : ''}`} />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => onLocationDenied()}>
                Skip Location
              </Button>
            </div>
          </div>
        );

      case 'enable_device':
        return (
          <div className="space-y-4">
            <Alert>
              <Smartphone className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Device Location Services Required</p>
                  <p className="text-sm">{currentError.userMessage}</p>
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">
                📱 Device Settings:
              </p>
              <pre className="text-xs text-orange-700 dark:text-orange-300 whitespace-pre-wrap">
                {locationHandler.getDeviceInstructions()}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleOpenDeviceSettings} variant="outline" className="flex-1">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Settings
              </Button>
              <Button onClick={handleRequestLocation} disabled={isRequesting}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isRequesting ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
            
            <Button variant="ghost" onClick={() => onLocationDenied()} className="w-full">
              Continue Without Location
            </Button>
          </div>
        );

      case 'unavailable':
        return (
          <div className="space-y-4">
            <Alert variant="destructive">
              <MapPin className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Location Not Available</p>
                  <p className="text-sm">{currentError.userMessage}</p>
                </div>
              </AlertDescription>
            </Alert>

            <Button onClick={() => onLocationDenied()} className="w-full">
              Continue Without Location
            </Button>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <Alert>
              <MapPin className="w-4 h-4" />
              <AlertDescription>
                <p className="text-sm">{currentError.userMessage}</p>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={handleRequestLocation} disabled={isRequesting} className="flex-1">
                <RefreshCw className={`w-4 h-4 mr-2 ${isRequesting ? 'animate-spin' : ''}`} />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => onLocationDenied()}>
                Skip
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Location Permission Required
          </DialogTitle>
          <DialogDescription>
            We need your location to verify attendance at the event venue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {currentError ? (
            renderErrorContent()
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Why do we need your location?
                    </p>
                    <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Verify you're at the event venue</li>
                      <li>• Prevent attendance fraud</li>
                      <li>• Ensure accurate attendance records</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleRequestLocation} disabled={isRequesting} className="flex-1">
                  <MapPin className={`w-4 h-4 mr-2 ${isRequesting ? 'animate-pulse' : ''}`} />
                  {isRequesting ? 'Requesting...' : 'Allow Location'}
                </Button>
                <Button variant="outline" onClick={() => onLocationDenied()}>
                  Deny
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPermissionDialog;
