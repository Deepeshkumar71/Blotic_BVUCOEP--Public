import { useState, useRef, useEffect } from "react";
import jsQR from "jsqr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, QrCode, X, Scan } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AttendanceScannerWithCameraProps {
  onScanSuccess: (token: string, location: { latitude: number; longitude: number; accuracy: number }) => void;
  onScanError: (error: string) => void;
  sessionName: string;
}

const AttendanceScannerWithCamera = ({ onScanSuccess, onScanError, sessionName }: AttendanceScannerWithCameraProps) => {
  const [manualToken, setManualToken] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("Point camera at QR code...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start scanning loop with requestAnimationFrame
  useEffect(() => {
    if (showCamera && isScanning) {
      const scan = () => {
        if (!isScanning) return;
        
        scanQRCode();
        animationFrameRef.current = requestAnimationFrame(scan);
      };
      
      scan();
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [showCamera, isScanning]);

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.log("Video not ready yet, readyState:", video.readyState);
      return;
    }

    // Set canvas size to match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log("Canvas size set to:", canvas.width, "x", canvas.height);
    }

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data and scan for QR code
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code) {
      console.log("✅ QR Code detected:", code.data);
      setScanStatus("QR Code detected! Processing...");
      setIsScanning(false);
      stopCamera();
      handleManualSubmit(code.data);
    } else {
      setScanStatus("Scanning... Point at QR code");
    }
  };

  const startCamera = async () => {
    try {
      setCameraError("");
      setScanStatus("Starting camera...");
      console.log("🎥 Requesting camera access...");
      
      // Request camera permission with simpler constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      });
      
      console.log("✅ Camera access granted, stream:", stream);
      
      if (videoRef.current) {
        console.log("📹 Setting video source...");
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Show camera UI immediately
        setShowCamera(true);
        
        // Force video to load and play
        videoRef.current.onloadedmetadata = () => {
          console.log("📊 Video metadata loaded");
          if (videoRef.current) {
            console.log("Video dimensions:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
            setIsScanning(true);
            setScanStatus("Camera ready! Point at QR code");
          }
        };

        // Multiple attempts to start video
        const tryPlay = async () => {
          if (videoRef.current) {
            try {
              console.log("▶️ Attempting to play video...");
              videoRef.current.muted = true; // Ensure muted
              await videoRef.current.play();
              console.log("✅ Video playing successfully!");
              return true;
            } catch (playError) {
              console.error("❌ Error playing video:", playError);
              return false;
            }
          }
          return false;
        };

        // Try immediately
        setTimeout(tryPlay, 100);
        // Try again after a delay
        setTimeout(tryPlay, 500);
        // Try once more
        setTimeout(tryPlay, 1000);
      }
    } catch (error) {
      console.error("❌ Camera error:", error);
      setCameraError("Camera access denied. Please allow camera access and try again.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setIsScanning(false);
    setScanStatus("Point camera at QR code...");
  };

  const handleManualSubmit = async (scannedToken?: string) => {
    const token = scannedToken || manualToken.trim();
    
    console.log("handleManualSubmit called with token:", token);
    
    if (!token) {
      onScanError("Please enter a QR code token");
      return;
    }

    setIsGettingLocation(true);

    // Try to get location, but don't fail if unavailable
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          
          onScanSuccess(token, location);
          setIsGettingLocation(false);
          setManualToken("");
        },
        (error) => {
          // Location failed, but continue with null location
          console.warn("Location error:", error.message);
          const dummyLocation = {
            latitude: 0,
            longitude: 0,
            accuracy: 0,
          };
          
          onScanSuccess(token, dummyLocation);
          setIsGettingLocation(false);
          setManualToken("");
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      // No geolocation support, use dummy location
      const dummyLocation = {
        latitude: 0,
        longitude: 0,
        accuracy: 0,
      };
      
      onScanSuccess(token, dummyLocation);
      setIsGettingLocation(false);
      setManualToken("");
    }
  };

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
        {/* Camera View or Manual Entry Image */}
        <div className="space-y-4">
          {showCamera ? (
            <>
              <div className="relative bg-black rounded-lg overflow-hidden min-h-[320px]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  controls={false}
                  className="w-full h-80 object-cover block"
                  style={{ 
                    minHeight: '320px', 
                    backgroundColor: 'black',
                    display: 'block',
                    width: '100%',
                    height: '320px'
                  }}
                  onClick={async () => {
                    if (videoRef.current && videoRef.current.paused) {
                      try {
                        await videoRef.current.play();
                        console.log("📱 Video started by user click");
                      } catch (e) {
                        console.error("Click play failed:", e);
                      }
                    }
                  }}
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-4 border-green-500 rounded-lg w-64 h-64 animate-pulse"></div>
                </div>
                
                {/* Debug info */}
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
                  Video: {videoRef.current?.readyState === 4 ? 'Ready' : 'Loading'}
                  <br />
                  Playing: {videoRef.current?.paused ? 'No' : 'Yes'}
                  <br />
                  Size: {videoRef.current?.videoWidth}x{videoRef.current?.videoHeight}
                </div>

                {/* Status bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-center gap-2 text-white">
                    <Scan className="w-5 h-5 animate-pulse" />
                    <span className="font-medium">{scanStatus}</span>
                  </div>
                  <div className="text-center text-xs mt-2 text-white/70">
                    {videoRef.current?.paused ? "Tap video to start" : "Camera active"}
                  </div>
                </div>
                
                {/* Close button */}
                <Button
                  onClick={stopCamera}
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Alert className="bg-green-500/10 border-green-500/20">
                <Scan className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-sm text-green-700 dark:text-green-400">
                  📸 Camera is scanning! Point at the QR code and hold steady.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                <QrCode className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                <p className="text-sm font-medium mb-2">Manual Token Entry</p>
                <p className="text-xs text-muted-foreground">
                  Enter the QR code token shown on the admin's screen
                </p>
              </div>
              <Button
                onClick={startCamera}
                variant="outline"
                className="w-full gap-2"
              >
                <Camera className="w-4 h-4" />
                Open Camera
              </Button>
              {cameraError && (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">
                    {cameraError}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        {/* Manual Token Entry Form */}
        <div className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="token">QR Code Token</Label>
            <Input
              id="token"
              placeholder="ATD-1234567890-abc123"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              disabled={isGettingLocation}
            />
            <p className="text-xs text-muted-foreground">
              Copy the token from the QR code display
            </p>
          </div>

          <Button
            onClick={() => handleManualSubmit()}
            className="w-full gap-2"
            size="lg"
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Getting Location...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                Mark Attendance
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-xs">
          <p className="font-medium">How it works:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Admin displays QR code on screen</li>
            <li>Copy the token text from below the QR code</li>
            <li>Paste it in the field above</li>
            <li>Click "Mark Attendance"</li>
            <li>Your location will be captured automatically</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceScannerWithCamera;
