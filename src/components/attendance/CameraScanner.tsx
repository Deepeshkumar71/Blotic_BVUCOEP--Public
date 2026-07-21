import { useState, useRef, useEffect, useCallback } from "react";
import jsQR from "jsqr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, QrCode, X, Scan } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CameraScannerProps {
  onScanSuccess: (token: string, location: { latitude: number; longitude: number; accuracy: number }) => void;
  onScanError: (error: string) => void;
  sessionName: string;
}

const CameraScanner = ({ onScanSuccess, onScanError, sessionName }: CameraScannerProps) => {
  const [manualToken, setManualToken] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("Ready to scan");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef<boolean>(false);
  const [streamActive, setStreamActive] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const scanForQR = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !scanningRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanForQR);
      return;
    }

    // Set canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Scan for QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      console.log("🎯 QR Code found:", code.data);
      setScanStatus("QR Code detected!");
      scanningRef.current = false;
      setIsScanning(false);
      stopCamera();
      handleTokenSubmit(code.data);
    } else {
      setScanStatus("Scanning for QR code...");
      requestAnimationFrame(scanForQR);
    }
  }, []);

  const startCamera = async () => {
    try {
      setCameraError("");
      setPermissionDenied(false);
      setScanStatus("Requesting camera permission...");
      console.log("🎥 Starting camera...");

      // Check if camera permission is already denied
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          console.log("Camera permission status:", permissionStatus.state);
          
          if (permissionStatus.state === 'denied') {
            setPermissionDenied(true);
            setCameraError("Camera permission denied. Please reset permissions in your browser settings.");
            return;
          }
        } catch (e) {
          console.log("Permission API not supported, continuing...");
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        },
        audio: false
      });

      console.log("✅ Got camera stream", stream.getVideoTracks()[0].getSettings());

      if (videoRef.current) {
        console.log("Setting up video element...");
        
        // Set stream
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setStreamActive(true);
        
        // Force video attributes before loading
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;
        videoRef.current.defaultMuted = true;
        
        setShowCamera(true);
        setVideoReady(false);
        setScanStatus("Loading camera...");
        
        console.log("Video element setup complete, stream attached");
        console.log("Video srcObject:", videoRef.current.srcObject);
        console.log("Stream active:", stream.active);
        console.log("Stream tracks:", stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));

        // Immediate play attempt (before metadata loads)
        setTimeout(() => {
          if (videoRef.current && streamRef.current) {
            console.log("Immediate play attempt (before metadata)...");
            videoRef.current.play().then(() => {
              console.log("✅ Immediate play successful!");
              setIsScanning(true);
              scanningRef.current = true;
              setScanStatus("Point camera at QR code");
              requestAnimationFrame(scanForQR);
            }).catch(e => {
              console.log("Immediate play failed, waiting for metadata:", e.message);
            });
          }
        }, 50);
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = async () => {
          console.log("📹 Video metadata loaded");
          console.log("Video element:", videoRef.current);
          console.log("Video srcObject:", videoRef.current?.srcObject);
          console.log("Video dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);
          console.log("Video readyState:", videoRef.current?.readyState);
          
          setVideoReady(true);
          
          if (videoRef.current) {
            try {
              // Force play with multiple attempts
              videoRef.current.muted = true;
              videoRef.current.playsInline = true;
              videoRef.current.setAttribute('playsinline', 'true');
              videoRef.current.setAttribute('webkit-playsinline', 'true');
              videoRef.current.defaultMuted = true;
              
              console.log("Attempting to play video...");
              const playPromise = videoRef.current.play();
              
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    console.log("▶️ Video playing successfully");
                    console.log("Video paused:", videoRef.current?.paused);
                    console.log("Video currentTime:", videoRef.current?.currentTime);
                    
                    setIsScanning(true);
                    scanningRef.current = true;
                    setScanStatus("Point camera at QR code");
                    
                    // Start scanning loop
                    requestAnimationFrame(scanForQR);
                  })
                  .catch((playError) => {
                    console.error("❌ Play failed:", playError);
                    console.error("Error name:", playError.name);
                    console.error("Error message:", playError.message);
                    setScanStatus("Tap video to start");
                  });
              }
            } catch (playError) {
              console.error("❌ Play setup failed:", playError);
              setScanStatus("Tap video to start");
            }
          }
        };
        
        // Also listen for canplay event
        videoRef.current.oncanplay = () => {
          console.log("🎬 Video can play event");
          if (videoRef.current && videoRef.current.paused) {
            console.log("Video is paused, attempting to play...");
            videoRef.current.play().catch(e => {
              console.log("Auto-play from canplay failed:", e.message);
            });
          }
        };

        // Multiple fallback attempts
        const attemptPlay = async (delay: number, attemptNum: number) => {
          setTimeout(async () => {
            if (videoRef.current && videoRef.current.paused && streamRef.current) {
              try {
                console.log(`🔄 Play attempt ${attemptNum} (after ${delay}ms)...`);
                await videoRef.current.play();
                console.log(`✅ Play attempt ${attemptNum} successful!`);
                
                if (!scanningRef.current) {
                  setIsScanning(true);
                  scanningRef.current = true;
                  setScanStatus("Point camera at QR code");
                  requestAnimationFrame(scanForQR);
                }
              } catch (e) {
                console.log(`❌ Play attempt ${attemptNum} failed:`, (e as Error).message);
              }
            }
          }, delay);
        };
        
        // Try multiple times with increasing delays
        attemptPlay(100, 1);
        attemptPlay(300, 2);
        attemptPlay(500, 3);
        attemptPlay(1000, 4);
        attemptPlay(2000, 5);
      }
    } catch (error: any) {
      console.error("❌ Camera error:", error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setCameraError("Camera permission denied. Please allow camera access and try again.");
      } else if (error.name === 'NotFoundError') {
        setCameraError("No camera found on this device.");
      } else if (error.name === 'NotReadableError') {
        setCameraError("Camera is already in use by another application.");
      } else {
        setCameraError(`Camera error: ${error.message || 'Unknown error'}`);
      }
      
      setShowCamera(false);
    }
  };

  // Effect to handle stream attachment and force video to play
  useEffect(() => {
    if (streamActive && videoRef.current && streamRef.current) {
      console.log("useEffect: Stream is active, forcing video setup...");
      
      const video = videoRef.current;
      const stream = streamRef.current;
      
      // Ensure stream is attached
      if (video.srcObject !== stream) {
        console.log("Re-attaching stream in useEffect");
        video.srcObject = stream;
      }
      
      // Try to play immediately
      const tryPlay = () => {
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA or better
          console.log("Video ready state sufficient, playing...");
          video.play().then(() => {
            console.log("✅ useEffect play successful!");
            if (!scanningRef.current) {
              setIsScanning(true);
              scanningRef.current = true;
              setScanStatus("Point camera at QR code");
              requestAnimationFrame(scanForQR);
            }
          }).catch(e => {
            console.log("useEffect play failed:", e.message);
          });
        } else {
          console.log("Video not ready yet, readyState:", video.readyState);
        }
      };
      
      // Try immediately and with delays
      tryPlay();
      setTimeout(tryPlay, 100);
      setTimeout(tryPlay, 300);
      setTimeout(tryPlay, 500);
    }
  }, [streamActive, scanForQR]);

  const stopCamera = () => {
    console.log("🛑 Stopping camera...");
    scanningRef.current = false;
    setIsScanning(false);
    setVideoReady(false);
    setStreamActive(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("Track stopped:", track.kind);
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setShowCamera(false);
    setScanStatus("Ready to scan");
  };

  const handleTokenSubmit = async (token?: string) => {
    const finalToken = token || manualToken.trim();
    
    if (!finalToken) {
      onScanError("Please enter a QR code token");
      return;
    }

    console.log("🎫 Processing token:", finalToken);
    setIsGettingLocation(true);

    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          onScanSuccess(finalToken, location);
          setIsGettingLocation(false);
          setManualToken("");
        },
        () => {
          // Location failed, use dummy
          const dummyLocation = { latitude: 0, longitude: 0, accuracy: 0 };
          onScanSuccess(finalToken, dummyLocation);
          setIsGettingLocation(false);
          setManualToken("");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      const dummyLocation = { latitude: 0, longitude: 0, accuracy: 0 };
      onScanSuccess(finalToken, dummyLocation);
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
        {/* Camera Section */}
        {showCamera ? (
          <div className="space-y-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: '400px', width: '100%' }}>
              <video
                ref={videoRef}
                key={streamActive ? 'active' : 'inactive'}
                autoPlay
                playsInline
                muted
                webkit-playsinline="true"
                x5-playsinline="true"
                x-webkit-airplay="allow"
                controls={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  backgroundColor: '#000',
                  transform: 'scaleX(1)',
                  visibility: 'visible',
                  opacity: 1,
                  zIndex: 1
                }}
                onLoadedMetadata={() => {
                  console.log("Video metadata loaded event");
                  if (videoRef.current) {
                    console.log("Video dimensions:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
                    console.log("Video readyState:", videoRef.current.readyState);
                  }
                }}
                onPlay={() => {
                  console.log("Video play event fired");
                }}
                onPause={() => {
                  console.log("Video pause event fired");
                }}
                onClick={async () => {
                  console.log("Video clicked, paused:", videoRef.current?.paused);
                  if (videoRef.current?.paused) {
                    try {
                      await videoRef.current.play();
                      if (!scanningRef.current) {
                        setIsScanning(true);
                        scanningRef.current = true;
                        setScanStatus("Point camera at QR code");
                        requestAnimationFrame(scanForQR);
                      }
                    } catch (e) {
                      console.error("Click play failed:", e);
                    }
                  }
                }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-green-400 rounded-xl w-64 h-64 animate-pulse opacity-80"></div>
              </div>
              
              {/* Debug Info */}
              <div className="absolute top-4 left-4 bg-black/80 text-white text-xs p-2 rounded font-mono" style={{ zIndex: 10 }}>
                <div>Stream: {streamRef.current ? '✓' : '✗'}</div>
                <div>Active: {streamRef.current?.active ? '✓' : '✗'}</div>
                <div>Video: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0}</div>
                <div>Ready: {videoRef.current?.readyState || 0}/4</div>
                <div>Playing: {videoRef.current?.paused === false ? '✓' : '✗'}</div>
                <div>Scanning: {isScanning ? '✓' : '✗'}</div>
                <div>SrcObj: {videoRef.current?.srcObject ? '✓' : '✗'}</div>
              </div>
              
              {/* Tap to play overlay if video is paused */}
              {videoRef.current?.paused && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer"
                  style={{ zIndex: 5 }}
                  onClick={async () => {
                    if (videoRef.current) {
                      try {
                        await videoRef.current.play();
                        console.log("▶️ Manual play from overlay successful");
                      } catch (e) {
                        console.error("Manual play from overlay failed:", e);
                      }
                    }
                  }}
                >
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">▶️</div>
                    <div className="text-lg font-semibold">Tap to Start Camera</div>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2">
                  <Scan className="w-4 h-4 animate-pulse" />
                  <span>{scanStatus}</span>
                </div>
                {videoRef.current?.paused && (
                  <div className="text-xs mt-1 text-yellow-300">
                    👆 Tap video to start
                  </div>
                )}
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
            
            <Alert className="bg-green-50 border-green-200">
              <Scan className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Camera is active. Point at the QR code to scan automatically.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <QrCode className="w-16 h-16 mx-auto mb-4 text-blue-600" />
              <h3 className="font-medium text-blue-900 mb-2">Scan QR Code</h3>
              <p className="text-sm text-blue-700 mb-4">
                Use your camera to scan the QR code or enter the token manually
              </p>
              <Button onClick={startCamera} className="gap-2">
                <Camera className="w-4 h-4" />
                Open Camera
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

export default CameraScanner;
