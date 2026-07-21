import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, QrCode, X, Scan } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CameraScannerNewProps {
  onScanSuccess: (token: string, location: { latitude: number; longitude: number; accuracy: number }) => void;
  onScanError: (error: string) => void;
  sessionName: string;
}

const CameraScannerNew = ({ onScanSuccess, onScanError, sessionName }: CameraScannerNewProps) => {
  const [manualToken, setManualToken] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("Ready to scan");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number; accuracy: number} | null>(null);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);
  const scanningRef = useRef<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCamera = () => {
    console.log("🛑 Stopping camera...");
    setShowCamera(false);
    setIsScanning(false);
    scanningRef.current = false;
    setScanStatus("Ready to scan");
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
      stopCamera();
    };
  }, []);

  // QR scanning loop
  useEffect(() => {
    if (!isScanning || !showCamera) return;

    const scanQRCode = () => {
      if (!webcamRef.current || !canvasRef.current) return;

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      const image = new Image();
      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          console.log("✅ QR Code detected:", code.data);
          setScanStatus("QR Code detected! Processing...");
          setIsScanning(false);
          scanningRef.current = false;
          stopCamera();
          handleTokenSubmit(code.data);
        }
      };
      image.src = imageSrc;
    };

    const scanInterval = setInterval(scanQRCode, 300);
    return () => clearInterval(scanInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning, showCamera]);

  const requestLocation = async (): Promise<{latitude: number; longitude: number; accuracy: number} | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error("❌ Geolocation not supported");
        setLocationPermissionDenied(true);
        setCameraError(
          "📍 Location access is required for attendance marking.\n\n" +
          "Your browser doesn't support location services.\n" +
          "Please use a modern browser like Chrome, Firefox, or Safari."
        );
        resolve(null);
        return;
      }

      console.log("📍 Requesting location permission...");
      setScanStatus("Requesting location access...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          console.log("✅ Location granted:", location);
          setHasLocation(true);
          setCurrentLocation(location);
          setLocationPermissionDenied(false);
          resolve(location);
        },
        (error) => {
          console.error("❌ Location permission denied:", error);
          setLocationPermissionDenied(true);
          setHasLocation(false);
          setCameraError(
            "📍 Location permission is REQUIRED for attendance marking.\n\n" +
            "Why we need location:\n" +
            "• Verify you're at the event location\n" +
            "• Prevent proxy attendance\n" +
            "• Maintain attendance integrity\n\n" +
            "To enable location:\n" +
            "• Desktop: Click lock icon (🔒) → Location → Allow\n" +
            "• Mobile: Settings → Apps → Browser → Permissions → Location → Allow\n" +
            "• Refresh page and try again"
          );
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const requestCamera = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      console.log("📸 Requesting camera permission...");
      setScanStatus("Requesting camera access...");

      // Use react-webcam's built-in permission handling
      // This will trigger the browser's permission dialog
      setShowCamera(true);

      // Set a timeout to check if camera started successfully
      setTimeout(() => {
        if (webcamRef.current) {
          console.log("✅ Camera component mounted successfully");
          resolve(true);
        } else {
          console.error("❌ Camera component failed to mount");
          setCameraError(
            "📱 Camera access failed.\n\n" +
            "The camera permission dialog should have appeared.\n" +
            "If it didn't show or you clicked 'Block', please:\n\n" +
            "1. Refresh the page (F5)\n" +
            "2. Click 'Open Camera' again\n" +
            "3. When the permission dialog appears, click 'Allow'\n\n" +
            "Browser permission reset:\n" +
            "• Desktop: Click lock icon (🔒) → Camera → Allow\n" +
            "• Mobile: Settings → Apps → Browser → Camera → Allow"
          );
          setPermissionDenied(true);
          resolve(false);
        }
      }, 2000);
    });
  };

  const startCamera = async () => {
    console.log("🎥 Starting camera flow...");
    console.log("Current URL:", window.location.href);
    console.log("Protocol:", window.location.protocol);
    console.log("User interaction: Direct button click");

    setCameraError("");
    setPermissionDenied(false);
    setLocationPermissionDenied(false);
    setIsRequestingPermissions(true);

    // Check HTTPS first
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
      setPermissionDenied(true);
      setIsRequestingPermissions(false);
      return;
    }

    // Step 1: Request location FIRST (mandatory)
    const location = await requestLocation();

    if (!location) {
      console.error("❌ Cannot proceed without location");
      setIsRequestingPermissions(false);
      return;
    }

    // Step 2: Request camera permission
    const cameraGranted = await requestCamera();

    if (cameraGranted) {
      console.log("✅ Camera permission flow completed successfully");
      setScanStatus("Loading camera...");
    }

    setIsRequestingPermissions(false);
  };

  const handleUserMedia = () => {
    console.log("✅ Camera stream started successfully");
    setScanStatus("Camera ready! Point at QR code");
    setIsScanning(true);
    scanningRef.current = true;
  };

  const handleUserMediaError = (error: string | DOMException) => {
    console.error("❌ Camera error:", error);
    console.error("Error details:", {
      name: typeof error === 'string' ? 'string' : error.name,
      message: typeof error === 'string' ? error : error.message,
      isHTTPS: window.location.protocol === 'https:',
      hostname: window.location.hostname,
      userAgent: navigator.userAgent
    });
    
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorName = typeof error === 'string' ? '' : error.name;
    
    if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
      setPermissionDenied(true);
      
      // Check if it's a mobile browser issue
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        setCameraError(
          "📱 Camera permission denied on mobile. This might be because:\n\n" +
          "1. You previously denied camera access\n" +
          "2. Camera is blocked in browser settings\n" +
          "3. Another app is using the camera\n\n" +
          "To fix:\n" +
          "• Android Chrome: Settings → Site Settings → Camera → Allow\n" +
          "• iOS Safari: Settings → Safari → Camera → Allow\n" +
          "• Try closing other apps that might use the camera\n" +
          "• Restart your browser"
        );
      } else {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings and try again.");
      }
    } else if (errorName === 'NotFoundError') {
      setCameraError("No camera found on this device.");
    } else if (errorName === 'NotReadableError') {
      setCameraError("Camera is already in use by another application. Please close other apps using the camera.");
    } else if (errorName === 'OverconstrainedError') {
      setCameraError("Camera constraints not supported. Trying with default settings...");
      // Retry with simpler constraints
      setTimeout(() => {
        setShowCamera(false);
        setTimeout(() => startCamera(), 100);
      }, 1000);
    } else {
      setCameraError(`Camera error: ${errorMessage || errorName || 'Unknown error'}. Please check browser permissions.`);
    }
    
    setShowCamera(false);
  };

  const videoConstraints = {
    facingMode: { ideal: "environment" },
    width: { ideal: 1280 },
    height: { ideal: 720 }
  };

  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname === '[::1]';
  const isHTTPS = window.location.protocol === 'https:';
  const needsHTTPS = !isLocalhost && !isHTTPS;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-6 h-6" />
          Mark Attendance
        </CardTitle>
        <CardDescription>
          Marking attendance for: {sessionName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* HTTPS Warning */}
        {needsHTTPS && (
          <Alert variant="destructive" className="border-2">
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-bold text-lg">🔒 HTTPS Required for Camera Access</p>
                <p>Your site is currently using HTTP. Mobile browsers and modern desktop browsers block camera access on non-secure sites.</p>
                <p className="font-semibold">Solutions:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Deploy to Netlify:</strong> Automatic HTTPS (Recommended)</li>
                  <li><strong>Deploy to Vercel:</strong> Automatic HTTPS</li>
                  <li><strong>Enable SSL:</strong> Add SSL certificate to your domain</li>
                </ul>
                <p className="text-sm mt-2 italic">Current URL: {window.location.href}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Camera Section */}
        {showCamera ? (
          <div className="space-y-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: '320px' }}>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                onUserMedia={handleUserMedia}
                onUserMediaError={handleUserMediaError}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                className="rounded-lg"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              {/* Scanning overlay */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-4 border-green-400 rounded-xl w-64 h-64 animate-pulse opacity-80"></div>
                </div>
              )}
              
              {/* Status */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2">
                  <Scan className={`w-4 h-4 ${isScanning ? 'animate-pulse' : ''}`} />
                  <span>{scanStatus}</span>
                </div>
              </div>
              
              {/* Close button */}
              <Button
                onClick={stopCamera}
                variant="destructive"
                size="icon"
                className="absolute top-4 right-4"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <Scan className="w-4 h-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                📸 Camera is active! Point at the QR code to scan automatically.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800 rounded-lg p-6 text-center">
              <QrCode className="w-16 h-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Scan QR Code</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                Use your camera to scan the QR code or enter the token manually
              </p>
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startCamera();
                }} 
                className="gap-2"
                type="button"
                disabled={isRequestingPermissions}
              >
                {isRequestingPermissions ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Requesting Permissions...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Open Camera
                  </>
                )}
              </Button>
            </div>
            
            {cameraError && (
              <Alert variant="destructive">
                <AlertDescription>
                  <div className="space-y-2">
                    <p>{cameraError}</p>
                    {permissionDenied && (
                      <div className="text-xs mt-2 space-y-1">
                        <p className="font-semibold">To reset camera permissions:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li><strong>Chrome/Edge:</strong> Click the lock icon in address bar → Site settings → Camera → Allow</li>
                          <li><strong>Firefox:</strong> Click the lock icon → Clear permissions → Reload page</li>
                          <li><strong>Safari:</strong> Safari menu → Settings → Websites → Camera → Allow</li>
                          <li><strong>Mobile:</strong> Go to device Settings → Apps → Browser → Permissions → Camera → Allow</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Manual Entry */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Or Enter Token Manually</Label>
            <Input
              id="token"
              placeholder="ATD-1234567890-abc123"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              disabled={isGettingLocation}
            />
          </div>

          <Button
            onClick={() => handleTokenSubmit()}
            className="w-full gap-2"
            size="lg"
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                Mark Attendance
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraScannerNew;
