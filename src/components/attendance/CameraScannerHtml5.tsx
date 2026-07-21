import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, X, QrCode } from "lucide-react";

interface CameraScannerHtml5Props {
  onScanSuccess: (token: string, location: { latitude: number; longitude: number; accuracy: number }) => void;
  onScanError: (error: string) => void;
  sessionName: string;
}

const CameraScannerHtml5 = ({ onScanSuccess, onScanError, sessionName }: CameraScannerHtml5Props) => {
  const [manualToken, setManualToken] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanStatus, setScanStatus] = useState("Ready to scan");
  const [permissionStep, setPermissionStep] = useState<'idle' | 'location' | 'camera' | 'ready'>('idle');
  const [hasLocation, setHasLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number; accuracy: number} | null>(null);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = "qr-reader";

  const requestLocation = async (): Promise<{latitude: number; longitude: number; accuracy: number} | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error("❌ Geolocation not supported");
        setCameraError(
          "📍 Location access is required for attendance marking.\n\n" +
          "Your browser doesn't support location services.\n" +
          "Please use a modern browser like Chrome, Firefox, or Safari."
        );
        resolve(null);
        return;
      }

      console.log("📍 Requesting location permission...");
      setScanStatus("📍 Please allow location access when prompted");
      setPermissionStep('location');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          console.log("✅ Location granted:", location);
          console.log("Location details:", {
            lat: location.latitude,
            lng: location.longitude,
            accuracy: location.accuracy
          });
          setHasLocation(true);
          setCurrentLocation(location);
          setScanStatus("✅ Location granted! Preparing camera...");
          setPermissionStep('camera');
          resolve(location);
        },
        (error) => {
          console.error("❌ Location error:", error);
          console.error("Error code:", error.code);
          console.error("Error message:", error.message);
          setPermissionStep('idle');
          
          let errorMsg = "📍 Location permission is REQUIRED for attendance marking.\n\n";
          
          if (error.code === 1) { // PERMISSION_DENIED
            errorMsg += "You denied location permission.\n\n";
          } else if (error.code === 2) { // POSITION_UNAVAILABLE
            errorMsg += "Location information is unavailable.\n\n";
          } else if (error.code === 3) { // TIMEOUT
            errorMsg += "Location request timed out. Please try again.\n\n";
          }
          
          errorMsg += "Why we need location:\n" +
            "• Verify you're at the event location\n" +
            "• Prevent proxy attendance\n" +
            "• Maintain attendance integrity\n\n" +
            "To enable location:\n" +
            "• Desktop: Click lock icon (🔒) in address bar → Location → Allow\n" +
            "• Mobile: Settings → Apps → Browser → Permissions → Location → Allow\n" +
            "• Then click 'Open Camera' again";
          
          setCameraError(errorMsg);
          resolve(null);
        },
        {
          enableHighAccuracy: false, // Changed to false for better compatibility
          timeout: 30000, // Increased to 30 seconds
          maximumAge: 60000 // Allow cached location up to 1 minute old
        }
      );
    });
  };

  const startCamera = async () => {
    console.log("🎥 Starting HTML5 QR Code Scanner...");
    
    // Check HTTPS
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '[::1]';
    const isHTTPS = window.location.protocol === 'https:';
    
    if (!isLocalhost && !isHTTPS) {
      setCameraError(
        "🔒 HTTPS Required!\n\n" +
        "Camera access requires a secure connection (HTTPS).\n\n" +
        "Current URL: " + window.location.href + "\n\n" +
        "Please ensure your site is deployed with SSL certificate.\n" +
        "Free options: Netlify, Vercel, Cloudflare Pages (all provide automatic HTTPS)"
      );
      return;
    }
    
    setCameraError("");
    setScanStatus("Step 1/2: Requesting location permission...");
    
    // Step 1: Request location FIRST (mandatory)
    const location = await requestLocation();
    
    if (!location) {
      console.error("❌ Cannot proceed without location");
      return;
    }
    
    setScanStatus("Step 2/2: Requesting camera permission...");
    
    try {
      // FIRST: Explicitly request camera permission using getUserMedia
      // This ensures the browser shows the permission dialog
      console.log("📸 Requesting camera permission explicitly...");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }
        }
      });
      
      console.log("✅ Camera permission granted! Stream:", stream);
      
      // Stop the test stream immediately - we just needed permission
      stream.getTracks().forEach(track => {
        console.log("Stopping test track:", track.label);
        track.stop();
      });
      
      console.log("✅ Test stream stopped. Now starting Html5Qrcode scanner...");
      setScanStatus("Camera permission granted! Starting scanner...");
      
      // SECOND: Now initialize Html5Qrcode (permission already granted)
      html5QrCodeRef.current = new Html5Qrcode(scannerDivId);
      
      // Start scanning
      await html5QrCodeRef.current.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10, // Frames per second
          qrbox: { width: 250, height: 250 }, // Scanning box size
        },
        (decodedText) => {
          // Success callback
          console.log("✅ QR Code detected:", decodedText);
          setScanStatus("QR Code detected! Processing...");
          handleTokenSubmit(decodedText);
          stopCamera();
        },
        (errorMessage) => {
          // Error callback (fires continuously, so we ignore it)
          // Only log occasionally to avoid spam
        }
      );
      
      setShowCamera(true);
      setScanStatus("✅ Camera ready! Point at QR code");
      setPermissionStep('ready');
      console.log("✅ Camera started successfully");
      
    } catch (error) {
      console.error("❌ Camera error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setPermissionStep('idle');
      setCameraError(
        "📱 Camera access failed.\n\n" +
        "Please ensure:\n" +
        "1. Click 'Allow' when browser asks for camera permission\n" +
        "2. No other app is using the camera\n" +
        "3. You're on HTTPS (or localhost)\n" +
        "4. Camera permission is not blocked in browser settings\n\n" +
        "Error: " + errorMessage + "\n\n" +
        "Try clicking 'Open Camera' again and allow both permissions."
      );
      setScanStatus("❌ Camera failed to start");
    }
  };

  const stopCamera = async () => {
    console.log("🛑 Stopping camera...");
    
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        console.log("✅ Camera stopped");
      } catch (error) {
        console.error("Error stopping camera:", error);
      }
    }
    
    setShowCamera(false);
    setScanStatus("Camera stopped");
  };

  const handleTokenSubmit = async (token?: string) => {
    const finalToken = token || manualToken.trim();
    
    if (!finalToken) {
      onScanError("Please enter a QR code token");
      return;
    }

    console.log("🎫 Processing token:", finalToken);
    
    // Check if we have location from camera flow
    if (currentLocation && hasLocation) {
      console.log("✅ Using existing location:", currentLocation);
      onScanSuccess(finalToken, currentLocation);
      setManualToken("");
      return;
    }
    
    // For manual token entry, request location
    setIsGettingLocation(true);
    const location = await requestLocation();
    
    if (!location) {
      onScanError("Location permission is required to mark attendance. Please enable location access and try again.");
      setIsGettingLocation(false);
      return;
    }
    
    onScanSuccess(finalToken, location);
    setIsGettingLocation(false);
    setManualToken("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Code Scanner
        </CardTitle>
        <CardDescription>
          Scan QR code to mark attendance for "{sessionName}"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Status Indicator */}
        {permissionStep !== 'idle' && permissionStep !== 'ready' && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  permissionStep === 'location' || permissionStep === 'camera' ? 'bg-blue-600 animate-pulse' : 'bg-green-600'
                }`}>
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Location Permission</p>
                  <p className="text-xs text-muted-foreground">
                    {permissionStep === 'location' ? '⏳ Waiting for your response...' : '✅ Granted'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  permissionStep === 'camera' ? 'bg-blue-600 animate-pulse' : 'bg-gray-300'
                }`}>
                  <span className={`text-sm font-bold ${permissionStep === 'camera' ? 'text-white' : 'text-gray-500'}`}>2</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Camera Permission</p>
                  <p className="text-xs text-muted-foreground">
                    {permissionStep === 'camera' ? '⏳ Waiting for your response...' : '⏸️ Pending'}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-blue-700 dark:text-blue-300 font-medium">
              💡 Please click "Allow" when your browser asks for permissions
            </p>
          </div>
        )}

        {cameraError && (
          <Alert variant="destructive">
            <AlertDescription>
              <div className="whitespace-pre-line text-sm">
                {cameraError}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Camera Section */}
        {showCamera ? (
          <div className="space-y-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              <div id={scannerDivId} className="w-full"></div>
              
              {/* Status Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-3 text-center">
                <p className="text-sm font-medium">{scanStatus}</p>
              </div>
            </div>

            <Button
              onClick={stopCamera}
              variant="destructive"
              className="w-full gap-2"
            >
              <X className="w-4 h-4" />
              Close Camera
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
              <QrCode className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Use your camera to scan the QR code or enter the token manually
              </p>
              <Button 
                onClick={startCamera} 
                className="gap-2"
                type="button"
              >
                <Camera className="w-4 h-4" />
                Open Camera
              </Button>
            </div>
          </div>
        )}

        {/* Manual Token Entry */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Or enter token manually:</p>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter QR code token"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTokenSubmit()}
            />
            <Button
              onClick={() => handleTokenSubmit()}
              disabled={isGettingLocation || !manualToken.trim()}
            >
              {isGettingLocation ? "Processing..." : "Submit"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraScannerHtml5;
