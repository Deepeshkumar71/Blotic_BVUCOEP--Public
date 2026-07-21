import { useState, useEffect } from "react";
import { QrScanner } from "@yudiel/react-qr-scanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, MapPin, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { requestCameraPermission, requestLocationPermission, type LocationData } from "@/utils/permissions";

interface AttendanceScannerProps {
  onScanSuccess: (token: string, location: LocationData) => void;
  onScanError: (error: string) => void;
}

const AttendanceScanner = ({ onScanSuccess, onScanError }: AttendanceScannerProps) => {
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [permissionError, setPermissionError] = useState<string>("");

  // Check permissions on mount
  useEffect(() => {
    checkAllPermissions();
  }, []);

  const checkAllPermissions = async () => {
    setPermissionError("");
    
    // Check camera
    const camera = await requestCameraPermission();
    setCameraPermission(camera);
    
    // Check location
    const location = await requestLocationPermission();
    setLocationPermission(location !== null);
    setLocationData(location);

    if (!camera || !location) {
      setPermissionError("Both camera and location permissions are required to mark attendance.");
    }
  };

  const handleRetryPermissions = async () => {
    await checkAllPermissions();
  };

  const handleScan = (result: string) => {
    if (!locationData) {
      onScanError("Location data not available");
      return;
    }

    setIsScanning(false);
    onScanSuccess(result, locationData);
  };

  const handleError = (error: Error) => {
    console.error("[Scanner] Error:", error);
    onScanError(error.message);
  };

  const startScanning = () => {
    if (cameraPermission && locationPermission && locationData) {
      setIsScanning(true);
    } else {
      setPermissionError("Please grant all required permissions first.");
    }
  };

  // Show permission request UI
  if (cameraPermission === null || locationPermission === null) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-6 h-6" />
            Checking Permissions...
          </CardTitle>
          <CardDescription>
            Verifying camera and location access
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // Show permission denied UI
  if (!cameraPermission || !locationPermission) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="w-6 h-6" />
            Permissions Required
          </CardTitle>
          <CardDescription>
            Camera and location access are required to mark attendance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Permission Status */}
          <div className="space-y-3">
            <div className={`flex items-center gap-3 p-3 rounded-lg ${cameraPermission ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              {cameraPermission ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <div className="flex-1">
                <p className="font-medium">Camera Permission</p>
                <p className="text-sm text-muted-foreground">
                  {cameraPermission ? 'Granted' : 'Denied - Required to scan QR code'}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${locationPermission ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              {locationPermission ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <div className="flex-1">
                <p className="font-medium">Location Permission</p>
                <p className="text-sm text-muted-foreground">
                  {locationPermission ? 'Granted' : 'Denied - Required to verify your presence'}
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {permissionError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{permissionError}</AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="font-medium text-sm">How to enable permissions:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Click the "Allow Permissions" button below</li>
              <li>Your browser will ask for camera and location access</li>
              <li>Click "Allow" for both permissions</li>
              <li>Once granted, you can scan the QR code</li>
            </ol>
          </div>

          {/* Retry Button */}
          <Button 
            onClick={handleRetryPermissions}
            className="w-full gap-2"
            size="lg"
          >
            <RefreshCw className="w-4 h-4" />
            Allow Permissions
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show scanner UI
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-6 h-6" />
          Scan Attendance QR Code
        </CardTitle>
        <CardDescription>
          Position the QR code within the frame to mark your attendance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status - Success */}
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 p-3 rounded-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>Camera and location permissions granted</span>
        </div>

        {/* Location Info */}
        {locationData && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <MapPin className="w-4 h-4" />
            <span>
              Location: {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
              {locationData.accuracy && ` (±${Math.round(locationData.accuracy)}m)`}
            </span>
          </div>
        )}

        {/* Scanner */}
        {isScanning ? (
          <div className="relative aspect-square rounded-lg overflow-hidden bg-black">
            <QrScanner
              onDecode={handleScan}
              onError={handleError}
              constraints={{
                facingMode: 'environment'
              }}
            />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-4 border-primary/50 rounded-lg m-12"></div>
            </div>
          </div>
        ) : (
          <div className="aspect-square rounded-lg bg-muted/50 flex items-center justify-center border-2 border-dashed border-border">
            <div className="text-center space-y-4">
              <Camera className="w-16 h-16 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Click "Start Scanning" to begin</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isScanning ? (
            <Button 
              onClick={startScanning}
              className="flex-1 gap-2"
              size="lg"
            >
              <Camera className="w-4 h-4" />
              Start Scanning
            </Button>
          ) : (
            <Button 
              onClick={() => setIsScanning(false)}
              variant="outline"
              className="flex-1 gap-2"
              size="lg"
            >
              <XCircle className="w-4 h-4" />
              Stop Scanning
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceScanner;
