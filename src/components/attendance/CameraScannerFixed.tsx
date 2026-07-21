import { useState, useEffect, useRef, lazy, Suspense, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, X, QrCode, MapPin } from "lucide-react";
import LocationHandler, { LocationError } from "@/utils/locationHandler";
import LocationPermissionDialog from "./LocationPermissionDialog";

// Lazy load the map component to avoid SSR issues
const LocationMap = lazy(() => import('./LocationMap'));

interface CameraScannerFixedProps {
  onScanSuccess: (token: string, location: { latitude: number; longitude: number; accuracy: number }) => void;
  onScanError: (error: string) => void;
  sessionName: string;
  preGrantedLocation?: { latitude: number; longitude: number; accuracy: number } | null;
}

const CameraScannerFixed = ({ onScanSuccess, onScanError, sessionName, preGrantedLocation }: CameraScannerFixedProps) => {
  const [manualToken, setManualToken] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanStatus, setScanStatus] = useState("");
  const [qrOn, setQrOn] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number; accuracy: number} | null>(null);
  const [hasError, setHasError] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [locationError, setLocationError] = useState<LocationError | undefined>();
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  
  // Camera timeout states
  const [timeoutSeconds, setTimeoutSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  const locationHandler = LocationHandler.getInstance();
  
  // Timeout configuration (in seconds)
  const CAMERA_TIMEOUT = 30; // 30 seconds timeout
  
  const scanner = useRef<Html5Qrcode>();
  const scannerDivId = "qr-reader";
  
  // Debouncing refs to prevent multiple scans
  const lastScannedToken = useRef<string | null>(null);
  const lastScanTime = useRef<number>(0);

  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Environment detection
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isHTTPS = window.location.protocol === 'https:';
  const isProduction = !isLocalhost;
  
  console.log("Environment:", {
    isMobile: isMobile ? "Mobile" : "Desktop",
    isLocalhost,
    isHTTPS,
    isProduction,
    hostname: window.location.hostname,
    protocol: window.location.protocol
  });

  // Error boundary
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Component error:", event.error);
      setHasError(true);
      setCameraError("An error occurred. Please refresh the page.");
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Stop scanner with proper cleanup to prevent black screen
  const stopScanner = useCallback(async () => {
    console.log("🛑 Stopping scanner...");
    
    try {
      // Stop timer first
      setIsTimerActive(false);
      setTimeoutSeconds(0);
      
      // Clear any error states immediately
      setCameraError("");
      setScanStatus("Stopping camera...");
      
      // Stop the scanner if it exists
      if (scanner.current) {
        try {
          // Check if scanner is still running before stopping
          if (qrOn) {
            await scanner.current.stop();
            console.log("✅ Scanner stopped successfully");
          }
          scanner.current.clear();
          
          // Force clear the scanner div to prevent black screen
          const scannerDiv = document.getElementById(scannerDivId);
          if (scannerDiv) {
            scannerDiv.innerHTML = '';
            console.log("✅ Scanner DOM cleared");
          }
          
          scanner.current = undefined; // Clear the reference
        } catch (scannerError) {
          console.warn("Scanner stop error (non-critical):", scannerError);
          // Force clear DOM even if scanner stop fails
          const scannerDiv = document.getElementById(scannerDivId);
          if (scannerDiv) {
            scannerDiv.innerHTML = '';
          }
        }
      }
      
      // Reset all states to initial values with a small delay to ensure DOM cleanup
      setTimeout(() => {
        setQrOn(false);
        setScanStatus("Camera stopped successfully");
        console.log("✅ Scanner cleanup completed");
      }, 100);
      
    } catch (error) {
      console.error("Error during scanner cleanup:", error);
      // Even if there's an error, reset the states to prevent blank page
      setQrOn(false);
      setIsTimerActive(false);
      setTimeoutSeconds(0);
      setCameraError("");
      setScanStatus("Camera stopped");
      
      // Force clear DOM as fallback
      try {
        const scannerDiv = document.getElementById(scannerDivId);
        if (scannerDiv) {
          scannerDiv.innerHTML = '';
        }
      } catch (domError) {
        console.warn("DOM cleanup error:", domError);
      }
    }
  }, [qrOn, scannerDivId]);

  // Camera timeout timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerActive && qrOn) {
      interval = setInterval(() => {
        setTimeoutSeconds((prev) => {
          const newTime = prev + 1;
          
          // Check if timeout reached
          if (newTime >= CAMERA_TIMEOUT) {
            console.log("⏰ Camera timeout reached, stopping scanner...");
            stopScanner();
            setCameraError(`Camera timed out after ${CAMERA_TIMEOUT} seconds. Click "Open Camera" to try again.`);
            setScanStatus("⏰ Camera timed out");
            setIsTimerActive(false);
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerActive, qrOn, CAMERA_TIMEOUT, stopScanner]);

  // Set pre-granted location for faster loading
  useEffect(() => {
    if (preGrantedLocation && !currentLocation) {
      console.log("🚀 Using pre-granted location for faster loading:", preGrantedLocation);
      setCurrentLocation(preGrantedLocation);
      setScanStatus("✅ Location verified! Opening camera scanner...");
    }
  }, [preGrantedLocation, currentLocation]);

  // Smart location request with proper callback handling
  const requestLocationWithDialog = async (token: string): Promise<void> => {
    console.log("🎯 Starting location request for token:", token);
    setPendingToken(token);
    setLocationError(undefined);
    setIsGettingLocation(true);
    setScanStatus("Getting location...");
    
    try {
      // First, try to get location directly
      const result = await locationHandler.requestLocation();
      
      if (result.data) {
        // Success! Process immediately
        console.log("✅ Location obtained directly:", result.data);
        handleLocationSuccess(result.data, token);
      } else if (result.error) {
        // Show dialog with error and options
        console.log("❌ Location error, showing dialog:", result.error);
        setLocationError(result.error);
        setShowLocationDialog(true);
        setIsGettingLocation(false); // Stop loading state when showing dialog
      }
    } catch (error) {
      console.error("❌ Unexpected error in location request:", error);
      setIsGettingLocation(false);
      setCameraError("An unexpected error occurred while getting location");
    }
  };

  // Handle successful location with proper redirection
  const handleLocationSuccess = (location: { latitude: number; longitude: number; accuracy: number }, token: string) => {
    console.log("🎯 Processing location success:", { location, token });
    
    setCurrentLocation(location);
    setScanStatus("✅ Location obtained!");
    setShowLocationDialog(false); // Close dialog if open
    setIsGettingLocation(false);
    
    // Small delay to show success message, then redirect
    setTimeout(() => {
      console.log("🚀 Submitting attendance with location...");
      setScanStatus("✅ Submitting attendance...");
      onScanSuccess(token, location);
      setPendingToken(null);
    }, 500);
  };

  // Handle location dialog result
  const handleLocationGranted = (location: { latitude: number; longitude: number; accuracy: number }) => {
    console.log("🎯 Location granted from dialog:", location);
    if (pendingToken) {
      handleLocationSuccess(location, pendingToken);
    } else {
      console.warn("⚠️ No pending token when location granted");
    }
  };

  // Handle location denied
  const handleLocationDenied = () => {
    console.log("❌ Location denied by user");
    setShowLocationDialog(false);
    setIsGettingLocation(false);
    setCameraError("Location permission is required to mark attendance");
    onScanError("Location permission required to mark attendance");
    setPendingToken(null);
  };

  // Success callback with debouncing (location already obtained)
  const onScanSuccessCallback = useCallback(async (decodedText: string) => {
    // Prevent multiple scans of the same QR code
    if (lastScannedToken.current === decodedText) {
      console.log("🔄 Ignoring duplicate scan of same QR code");
      return;
    }
    
    // Prevent rapid successive scans
    const now = Date.now();
    if (now - lastScanTime.current < 2000) { // 2 second cooldown
      console.log("⏱️ Scan too soon, ignoring (cooldown active)");
      return;
    }
    
    console.log("✅ QR Code scanned:", decodedText);
    lastScannedToken.current = decodedText;
    lastScanTime.current = now;
    
    setScanStatus("✅ QR Code detected! Submitting...");
    
    // Stop scanner immediately to prevent more scans
    await stopScanner();
    
    try {
      // Location is already obtained, submit directly
      if (currentLocation) {
        console.log("🚀 Submitting attendance with existing location...");
        setTimeout(() => {
          onScanSuccess(decodedText, currentLocation);
        }, 300); // Small delay to show success message
      } else {
        // Fallback: request location if somehow not available
        console.log("⚠️ Location not available, requesting...");
        await requestLocationWithDialog(decodedText);
      }
    } catch (error) {
      console.error("Error in scan callback:", error);
      setCameraError("An error occurred while processing the scan");
      onScanError("Failed to process scan");
      // Reset on error to allow retry
      lastScannedToken.current = null;
    }
  }, [currentLocation, stopScanner, onScanSuccess, requestLocationWithDialog, onScanError]);

  // Error callback (called continuously, so we ignore it)
  const onScanFailCallback = (error: string) => {
    // Ignore - this fires constantly while scanning
  };

  // Start camera (after location is obtained)
  const startCamera = useCallback(async () => {
    console.log("🎥 Starting QR Scanner...");
    console.log("Current URL:", window.location.href);
    console.log("Protocol:", window.location.protocol);
    setCameraError("");
    setScanStatus("");
    
    // Reset debouncing for fresh scan session
    lastScannedToken.current = null;
    lastScanTime.current = 0;

    // FIRST: Check if location is already available (pre-granted or previously obtained)
    if (!currentLocation) {
      console.log("📍 Requesting location first...");
      setScanStatus("📍 Getting location permission...");
      
      try {
        const result = await locationHandler.requestLocation();
        
        if (result.data) {
          console.log("✅ Location obtained:", result.data);
          setCurrentLocation(result.data);
          setScanStatus("✅ Location obtained! Starting camera...");
        } else if (result.error) {
          console.log("❌ Location error:", result.error);
          setLocationError(result.error);
          setShowLocationDialog(true);
          setQrOn(false);
          return; // Stop here, wait for user to resolve location
        }
      } catch (error) {
        console.error("❌ Location request failed:", error);
        setCameraError("Location permission is required before using camera");
        setQrOn(false);
        return;
      }
    } else {
      console.log("🚀 Location already available, skipping permission request");
      setScanStatus("✅ Location verified! Starting camera...");
    }

    // NOW start camera (location is confirmed)
    console.log("📸 Location confirmed, starting camera...");
    setQrOn(true);
    setScanStatus("📸 Starting camera...");

    // Wait for DOM to update (longer delay for production)
    const delay = isProduction ? 500 : 100; // 500ms for production, 100ms for localhost
    console.log(`Waiting ${delay}ms for DOM update...`);
    await new Promise(resolve => setTimeout(resolve, delay));

    // Step 3: Start camera
    try {
      // Check if scanner div exists
      const scannerDiv = document.getElementById(scannerDivId);
      console.log("Scanner div exists:", !!scannerDiv);
      
      if (!scannerDiv) {
        throw new Error("Scanner div not found in DOM");
      }

      console.log("Scanner div found, initializing Html5Qrcode...");
      scanner.current = new Html5Qrcode(scannerDivId);

      // Production-specific configuration (more conservative)
      const cameraConfig = isProduction 
        ? { facingMode: "environment" } // Production: simple config
        : { facingMode: "environment" }; // Localhost: same for now

      const scanConfig = isProduction 
        ? {
            fps: isMobile ? 10 : 15, // INCREASED FPS for faster scanning
            qrbox: { width: 250, height: 250 }, // LARGER box for better detection
            aspectRatio: 1.0,
            disableFlip: false, // Enable flip for better detection
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true // Enable for better performance
            },
            // Optimized video constraints for faster scanning
            videoConstraints: {
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
              facingMode: "environment"
            }
          }
        : isMobile 
          ? {
              fps: 15, // Higher FPS for mobile localhost
              qrbox: { width: 250, height: 250 }, // Larger box
              aspectRatio: 1.0,
              disableFlip: false,
              videoConstraints: {
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                aspectRatio: 1.777778,
                facingMode: "environment"
              }
            }
          : {
              fps: 20, // High FPS for desktop localhost
              qrbox: { width: 300, height: 300 }, // Large box for desktop
              aspectRatio: 1.0,
              disableFlip: false,
              videoConstraints: {
                width: { min: 1280, ideal: 1920, max: 1920 },
                height: { min: 720, ideal: 1080, max: 1080 },
                facingMode: "environment"
              }
            };

      console.log("Starting scanner with config:", { cameraConfig, scanConfig, isMobile });
      
      await scanner.current.start(
        cameraConfig,
        scanConfig,
        onScanSuccessCallback,
        onScanFailCallback
      );

      console.log("✅ Scanner started successfully");
      setScanStatus("✅ Camera ready! Point at QR code");
      
      // Start timer
      setTimeoutSeconds(0);
      setIsTimerActive(true);
      console.log(`⏰ Timer started - camera will timeout in ${CAMERA_TIMEOUT} seconds`);
    } catch (error) {
      console.error("❌ Camera start failed:", error);
      setQrOn(false);
      
      let errorMessage = "";
      
      if (isProduction) {
        errorMessage = isMobile 
          ? "📱 Production Mobile Error:\n" +
            "1. Ensure you're on HTTPS (secure connection)\n" +
            "2. Allow camera permission when prompted\n" +
            "3. Close other camera apps\n" +
            "4. Try Chrome or Safari browser\n" +
            "5. Clear browser cache and try again"
          : "🖥️ Production Desktop Error:\n" +
            "1. Ensure you're on HTTPS (secure connection)\n" +
            "2. Allow camera permission when prompted\n" +
            "3. Close other camera apps/tabs\n" +
            "4. Try Chrome or Edge browser\n" +
            "5. Check if camera is working in other apps";
      } else {
        errorMessage = isMobile 
          ? "📱 Localhost Mobile Error:\n" +
            "1. Allow camera permission\n" +
            "2. Close other camera apps\n" +
            "3. Try refreshing the page"
          : "🖥️ Localhost Desktop Error:\n" +
            "1. Allow camera permission\n" +
            "2. Close other camera apps\n" +
            "3. Camera should work on localhost";
      }
      
      // Add protocol warning for production
      if (isProduction && !isHTTPS) {
        errorMessage += "\n\n⚠️ WARNING: Camera requires HTTPS in production!";
      }
          
      setCameraError(`${errorMessage}\n\nTechnical Error: ${error}`);
    }
  }, [currentLocation, locationHandler, isProduction, isHTTPS, isMobile, onScanSuccessCallback]);

  // Auto-start camera when location is verified
  useEffect(() => {
    if (currentLocation && !qrOn && scanStatus.includes("Opening camera scanner")) {
      console.log("🎥 Auto-starting camera with verified location...");
      setTimeout(() => {
        startCamera();
      }, 1000); // 1 second delay to show the status message
    }
  }, [currentLocation, qrOn, scanStatus, startCamera]);

  // Handle manual token
  const handleManualSubmit = async () => {
    const token = manualToken.trim();
    if (!token) {
      onScanError("Please enter a token");
      return;
    }

    try {
      // Use the intelligent location system with proper redirection
      await requestLocationWithDialog(token);
      setManualToken("");
    } catch (error) {
      console.error("Error submitting token:", error);
      onScanError("Failed to submit token");
      setIsGettingLocation(false);
      setScanStatus("");
    }
  };

  // Cleanup on unmount - prevent blank page issues
  useEffect(() => {
    return () => {
      // Cleanup scanner on component unmount
      if (scanner.current) {
        try {
          scanner.current.stop().catch((error) => {
            console.warn("Scanner cleanup warning:", error);
          });
          scanner.current.clear();
          scanner.current = undefined;
        } catch (error) {
          console.warn("Scanner cleanup error (non-critical):", error);
        }
      }
    };
  }, []); // Empty dependency array - only run on unmount

  // Alert if camera blocked
  useEffect(() => {
    if (!qrOn && cameraError) {
      console.warn("Camera is not accessible");
    }
  }, [qrOn, cameraError]);

  // Error fallback - prevent blank page
  if (hasError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Scanner Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              An error occurred while loading the scanner. Please try the options below:
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Button 
              onClick={() => {
                setHasError(false);
                setCameraError("");
                setScanStatus("");
                setQrOn(false);
                setIsTimerActive(false);
                setTimeoutSeconds(0);
              }}
              className="w-full"
            >
              Try Again
            </Button>
            
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="relative z-10 bg-background">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-bold">
            QR Code Scanner
          </CardTitle>
          <CardDescription className="text-base sm:text-lg">
            Scan QR code to mark attendance for "{sessionName}"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">


        {/* Error Message */}
        {cameraError && (
          <Alert variant="destructive">
            <AlertDescription>
              <div className="whitespace-pre-line text-sm">
                {cameraError}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Camera View */}
        {qrOn ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div 
                className="relative bg-black rounded-lg overflow-hidden shadow-lg" 
                style={{ 
                  width: '100%', 
                  maxWidth: '430px',
                  position: 'relative',
                  zIndex: 1
                }}
              >
              <div 
                id={scannerDivId} 
                style={{ 
                  width: '100%', 
                  height: '320px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              ></div>
              <style>{`
                /* Force all elements to stay contained */
                #${scannerDivId} * {
                  position: relative !important;
                  max-width: 100% !important;
                  max-height: 320px !important;
                }
                
                #${scannerDivId} video {
                  width: 100% !important;
                  height: 320px !important;
                  max-width: 430px !important;
                  max-height: 320px !important;
                  object-fit: cover !important;
                  position: relative !important;
                  top: 0 !important;
                  left: 0 !important;
                  z-index: 1 !important;
                }
                
                #${scannerDivId} canvas {
                  display: none !important;
                }
                
                #${scannerDivId} > div {
                  position: relative !important;
                  width: 100% !important;
                  height: 320px !important;
                  max-width: 430px !important;
                  max-height: 320px !important;
                  overflow: hidden !important;
                }
                
                /* Mobile-specific fixes */
                @media (max-width: 768px) {
                  #${scannerDivId} video {
                    transform: none !important;
                    -webkit-transform: none !important;
                  }
                  
                  #${scannerDivId} {
                    -webkit-overflow-scrolling: touch !important;
                  }
                }
                
                /* Prevent any fullscreen overlays */
                #${scannerDivId} .qr-scanner-overlay,
                #${scannerDivId} .html5-qrcode-element {
                  position: relative !important;
                  width: 100% !important;
                  height: 320px !important;
                  max-width: 430px !important;
                  max-height: 320px !important;
                }
              `}</style>
              </div>
            </div>

            <Button
              onClick={async () => {
                try {
                  await stopScanner();
                } catch (error) {
                  console.error("Error closing camera:", error);
                  // Force reset states to prevent blank page
                  setQrOn(false);
                  setIsTimerActive(false);
                  setTimeoutSeconds(0);
                  setCameraError("");
                  setScanStatus("Camera closed");
                }
              }}
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
                Click below to start scanning QR codes
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
        <div className="space-y-2 pt-4 border-t">
          <p className="text-sm font-medium">Or enter token manually:</p>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter QR code token"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
            />
            <Button
              onClick={handleManualSubmit}
              disabled={isGettingLocation || !manualToken.trim()}
            >
              {isGettingLocation ? "Getting Location..." : "Submit"}
            </Button>
          </div>
        </div>


        </CardContent>
      </Card>

      {/* Location Permission Dialog */}
      <LocationPermissionDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        onLocationGranted={handleLocationGranted}
        onLocationDenied={handleLocationDenied}
        error={locationError}
      />
    </>
  );
};

export default CameraScannerFixed;
