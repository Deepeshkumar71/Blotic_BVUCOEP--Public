import { useState, useRef, useEffect, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface EventQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onScanSuccess: (gamesRemaining: number) => void;
}

const EventQRScanner = ({ isOpen, onClose, eventId, onScanSuccess }: EventQRScannerProps) => {
  const [cameraError, setCameraError] = useState("");
  const [scanStatus, setScanStatus] = useState("");
  const [qrOn, setQrOn] = useState(false);
  const [timeoutSeconds, setTimeoutSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [scanResult, setScanResult] = useState<{
    gamesRemaining: number;
    message: string;
    scanTime: string;
  } | null>(null);
  
  const scanner = useRef<Html5Qrcode>();
  const scannerDivId = "event-qr-reader";
  const lastScannedToken = useRef<string | null>(null);
  const lastScanTime = useRef<number>(0);
  const hasAttemptedStart = useRef<boolean>(false);
  const { toast } = useToast();
  
  const CAMERA_TIMEOUT = 30; // 30 seconds

  // Stop scanner with proper cleanup
  const stopScanner = useCallback(async () => {
    // Don't stop if we're in the middle of starting
    if (isStarting) {
      console.log("⚠️ [EventQR] Ignoring stop request - scanner is starting");
      return;
    }
    
    console.log("🛑 [EventQR] Stopping scanner...");
    
    try {
      setIsTimerActive(false);
      setTimeoutSeconds(0);
      
      if (scanner.current && qrOn) {
        try {
          console.log("🛑 [EventQR] Calling scanner.stop()...");
          await scanner.current.stop();
          console.log("✅ [EventQR] Scanner stopped successfully");
          
          // Wait a bit before clearing
          await new Promise(resolve => setTimeout(resolve, 100));
          
          scanner.current.clear();
          console.log("✅ [EventQR] Scanner cleared");
          
          const scannerDiv = document.getElementById(scannerDivId);
          if (scannerDiv) {
            scannerDiv.innerHTML = '';
            console.log("✅ [EventQR] Scanner div cleared");
          }
          
          scanner.current = undefined;
        } catch (scannerError) {
          console.warn("[EventQR] Scanner stop error:", scannerError);
          // Force clear even on error
          const scannerDiv = document.getElementById(scannerDivId);
          if (scannerDiv) {
            scannerDiv.innerHTML = '';
          }
          scanner.current = undefined;
        }
      }
      
      setQrOn(false);
      setScanStatus("");
      setCameraError("");
      hasAttemptedStart.current = false;
      
    } catch (error) {
      console.error("[EventQR] Cleanup error:", error);
      setQrOn(false);
      setIsTimerActive(false);
      setTimeoutSeconds(0);
      hasAttemptedStart.current = false;
    }
  }, [qrOn, scannerDivId, isStarting]);

  // Camera timeout timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerActive && qrOn) {
      interval = setInterval(() => {
        setTimeoutSeconds((prev) => {
          const newTime = prev + 1;
          
          if (newTime >= CAMERA_TIMEOUT) {
            console.log("⏰ [EventQR] Camera timeout reached");
            stopScanner();
            toast({
              title: "Camera Timeout",
              description: `Camera closed after ${CAMERA_TIMEOUT} seconds`,
              className: "bg-yellow-600 border-yellow-700 text-white",
            });
            setIsTimerActive(false);
            onClose();
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
  }, [isTimerActive, qrOn, CAMERA_TIMEOUT, stopScanner, toast, onClose]);

  // Handle Arena Login QR
  const handleArenaLoginQR = async (qrData: string) => {
    try {
      setScanStatus("🎮 Authenticating Arena login...");
      
      // Extract session ID from QR data
      const url = new URL(qrData);
      const sessionId = url.searchParams.get('session');
      
      if (!sessionId) {
        throw new Error('Invalid Arena QR code');
      }
      
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Please log in to authenticate Arena');
      }
      
      // Authenticate the QR session
      console.log("🔐 Calling authenticate_qr_session with:", { sessionId, userId: session.user.id });
      
      const { data, error } = await supabase.rpc('authenticate_qr_session', {
        p_session_id: sessionId,
        p_user_id: session.user.id
      });
      
      console.log("📥 RPC Response:", { data, error });
      
      if (error) {
        console.error("❌ Arena auth error:", error);
        throw new Error('Failed to authenticate Arena session');
      }
      
      if (data === true) {
        console.log("✅ Arena authentication successful!");
        
        // Reset scanned token to prevent re-scanning
        lastScannedToken.current = null;
        
        // Force stop scanner immediately - multiple approaches
        console.log("🛑 Forcing scanner stop for Arena login...");
        setIsTimerActive(false);
        setQrOn(false);
        
        // Stop the scanner hardware
        if (scanner.current) {
          try {
            console.log("🛑 Stopping camera stream...");
            await scanner.current.stop();
            await scanner.current.clear();
            
            // Force clear the div
            const scannerDiv = document.getElementById(scannerDivId);
            if (scannerDiv) {
              scannerDiv.innerHTML = '';
            }
            
            scanner.current = undefined;
            console.log("✅ Scanner stopped and cleared");
          } catch (e) {
            console.warn("Scanner stop error:", e);
            // Force clear even on error
            const scannerDiv = document.getElementById(scannerDivId);
            if (scannerDiv) {
              scannerDiv.innerHTML = '';
            }
          }
        }
        
        // Show success message
        toast({
          title: "Arena Login Successful!",
          description: "You can now use Blotic Arena on your desktop",
          className: "bg-green-600 border-green-700 text-white",
        });
        
        // Close dialog after a short delay to ensure camera stops
        setTimeout(() => {
          onClose();
        }, 100);
      } else {
        console.warn("⚠️ RPC returned false - session may be expired or already used");
        
        // Force stop scanner
        setIsTimerActive(false);
        if (scanner.current && qrOn) {
          try {
            await scanner.current.stop();
            scanner.current.clear();
            scanner.current = undefined;
          } catch (e) {
            console.warn("Scanner stop error:", e);
          }
        }
        setQrOn(false);
        
        toast({
          title: "Arena Login Failed",
          description: "QR session expired or invalid",
          variant: "destructive",
        });
        
        onClose();
      }
    } catch (err) {
      console.error("❌ Arena login error:", err);
      
      // Force stop scanner on error
      setIsTimerActive(false);
      if (scanner.current && qrOn) {
        try {
          await scanner.current.stop();
          scanner.current.clear();
          scanner.current = undefined;
        } catch (e) {
          console.warn("Scanner stop error:", e);
        }
      }
      setQrOn(false);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to authenticate Arena login';
      toast({
        title: "Arena Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      lastScannedToken.current = null;
      onClose();
    }
  };

  // Handle QR scan
  const handleScan = async (decodedText: string) => {
    console.log("📱 [EventQR] QR code detected:", decodedText);
    
    // Prevent duplicate scans within 3 seconds
    const now = Date.now();
    if (lastScannedToken.current === decodedText && now - lastScanTime.current < 3000) {
      console.log("⏭️ [EventQR] Ignoring duplicate scan");
      return;
    }
    
    lastScannedToken.current = decodedText;
    lastScanTime.current = now;
    
    // Detect QR type
    const isArenaLoginQR = decodedText.includes('/login?session=') || decodedText.includes('session=');
    
    if (isArenaLoginQR) {
      console.log("🎮 [EventQR] Detected Arena Login QR");
      await handleArenaLoginQR(decodedText);
      return;
    }
    
    // Handle regular event QR
    setScanStatus("🔍 Processing event QR code...");
    
    try {
      console.log("📤 [EventQR] Calling scan-game-qr with:", { eventId, qrCodeData: decodedText });
      
      // Refresh the session to get a fresh token
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError) {
        console.error("❌ [EventQR] Session refresh error:", sessionError);
        throw new Error('Session expired. Please log in again.');
      }
      
      if (!session?.access_token) {
        throw new Error('Not authenticated. Please log in again.');
      }
      
      console.log("🔑 [EventQR] Auth token present:", !!session.access_token);
      console.log("🔑 [EventQR] Token length:", session.access_token.length);
      console.log("🔑 [EventQR] User ID:", session.user?.id);
      console.log("🔑 [EventQR] User email:", session.user?.email);
      
      const requestBody = {
        eventId,
        qrCodeData: decodedText,
        deviceInfo: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          platform: navigator.platform,
        }
      };
      
      console.log("📤 [EventQR] Request body:", requestBody);
      
      // Use fetch directly to ensure headers are sent correctly
      const response = await fetch(
        'https://sbdrzesfuweacfssdwzk.supabase.co/functions/v1/scan-game-qr',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': 'your_supabase_anon_key',
          },
          body: JSON.stringify(requestBody)
        }
      );
      
      console.log("📥 [EventQR] Response status:", response.status);
      console.log("📥 [EventQR] Response headers:", Object.fromEntries(response.headers.entries()));
      
      let data;
      try {
        data = await response.json();
        console.log("📥 [EventQR] Response data:", data);
      } catch (e) {
        console.error("❌ [EventQR] Failed to parse response:", e);
        const text = await response.text();
        console.log("📥 [EventQR] Response text:", text);
        throw new Error(`Server returned invalid JSON (status ${response.status})`);
      }
      
      if (!response.ok) {
        console.error("❌ [EventQR] Request failed with status:", response.status);
        console.error("❌ [EventQR] Error data:", data);
        
        // Handle specific error codes
        if (response.status === 500) {
          throw new Error(data.error || 'Server error. Please try again in a moment.');
        } else if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        } else if (response.status === 403) {
          throw new Error(data.error || 'Access denied. Check your registration status.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      
      if (data?.success) {
        console.log("✅ [EventQR] Scan successful:", data);
        
        // Stop camera immediately after successful scan
        console.log("🛑 Stopping camera after successful event scan...");
        setIsTimerActive(false);
        setQrOn(false);
        
        if (scanner.current) {
          try {
            await scanner.current.stop();
            await scanner.current.clear();
            
            const scannerDiv = document.getElementById(scannerDivId);
            if (scannerDiv) {
              scannerDiv.innerHTML = '';
            }
            
            scanner.current = undefined;
            console.log("✅ Camera stopped successfully");
          } catch (e) {
            console.warn("Scanner stop error:", e);
          }
        }
        
        // Set scan result and show confirmation dialog
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit',
          hour12: true 
        });
        
        setScanResult({
          gamesRemaining: data.games_remaining,
          message: data.message || `${data.games_remaining} game${data.games_remaining !== 1 ? 's' : ''} remaining`,
          scanTime: timeString
        });
        
        // Show success dialog (scanner dialog will be hidden by conditional rendering)
        setShowSuccessDialog(true);
        onScanSuccess(data.games_remaining);
      } else {
        throw new Error(data.error || 'Scan failed');
      }
    } catch (err: unknown) {
      console.error("❌ [EventQR] Error processing scan:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process QR code';
      toast({
        title: "Scan Failed",
        description: errorMessage,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl",
      });
      
      // Reset for retry
      lastScannedToken.current = null;
    }
  };

  // Start scanner
  const startScanner = useCallback(async () => {
    // Prevent multiple simultaneous starts
    if (isStarting || qrOn) {
      console.log("⚠️ [EventQR] Camera already starting or running, ignoring...");
      return;
    }
    
    console.log("🎥 [EventQR] Starting camera...");
    setIsStarting(true);
    setCameraError("");
    setScanStatus("📸 Starting camera...");
    
    // Set qrOn to true to render the div
    setQrOn(true);
    
    // Wait for DOM to actually render using requestAnimationFrame
    console.log("Waiting for DOM to render...");
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 100); // Extra 100ms buffer
        });
      });
    });
    
    try {
      // Check if scanner div exists
      const scannerDiv = document.getElementById(scannerDivId);
      console.log("Scanner div exists:", !!scannerDiv);
      console.log("All divs in document:", Array.from(document.querySelectorAll('div[id]')).map(d => d.id));
      
      if (!scannerDiv) {
        throw new Error("Scanner div not found in DOM");
      }
      
      console.log("Scanner div found, initializing Html5Qrcode...");
      scanner.current = new Html5Qrcode(scannerDivId);
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const cameraConfig = {
        facingMode: "environment"
      };
      
      // Higher FPS and larger qrbox for faster scanning (matching attendance system)
      const scanConfig = {
        fps: isMobile ? 20 : 30, // Much higher FPS for faster detection
        qrbox: { width: 300, height: 300 }, // Larger box for better detection
        aspectRatio: 1.0,
        disableFlip: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        },
        videoConstraints: {
          width: { min: 640, ideal: 1920, max: 1920 },
          height: { min: 480, ideal: 1080, max: 1080 },
          facingMode: "environment"
        }
      };
      
      console.log("Starting scanner with config:", { cameraConfig, scanConfig, isMobile });
      
      await scanner.current.start(
        cameraConfig,
        scanConfig,
        (decodedText) => {
          console.log("✅ [EventQR] QR detected:", decodedText);
          handleScan(decodedText);
        },
        () => {
          // Error callback - called continuously, ignore
        }
      );
      
      console.log("✅ [EventQR] Scanner started successfully");
      
      // Fix: Force video element to have proper dimensions
      setTimeout(() => {
        const scannerDiv = document.getElementById(scannerDivId);
        if (scannerDiv) {
          const video = scannerDiv.querySelector('video');
          if (video) {
            // Force video to be visible with proper dimensions
            video.style.width = '100%';
            video.style.height = '320px';
            video.style.maxWidth = '430px';
            video.style.objectFit = 'cover';
            video.style.display = 'block';
            console.log("✅ [EventQR] Video dimensions fixed:", {
              width: video.style.width,
              height: video.style.height,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight
            });
          } else {
            console.log("❌ No video element found in scanner div!");
          }
        }
      }, 500);
      
      setScanStatus("✅ Camera ready! Point at QR code");
      setIsTimerActive(true);
      setTimeoutSeconds(0);
      setIsStarting(false);
      
    } catch (error) {
      console.error("❌ [EventQR] Camera error:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("❌ [EventQR] Error details:", errorMsg);
      
      setCameraError("Failed to start camera. Please allow camera access and try again.");
      setQrOn(false);
      setIsStarting(false);
      
      toast({
        title: "Camera Error",
        description: "Failed to start camera. Please check permissions and try again.",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white",
      });
    }
  }, [scannerDivId, toast, isStarting, qrOn]);

  // Auto-start camera when dialog opens
  useEffect(() => {
    if (isOpen && !qrOn && !isStarting && !hasAttemptedStart.current) {
      console.log("🎬 [EventQR] Dialog opened - auto-starting camera");
      hasAttemptedStart.current = true;
      startScanner();
    } else if (!isOpen) {
      hasAttemptedStart.current = false;
    }
  }, [isOpen, qrOn, isStarting, startScanner]);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen && qrOn) {
      stopScanner();
    }
    
    return () => {
      // Only cleanup on actual unmount, not on re-renders
      if (scanner.current && qrOn) {
        stopScanner();
      }
    };
  }, [isOpen]);

  return (
    <>
    <Dialog open={isOpen && !showSuccessDialog} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl backdrop-blur-md" style={{
        backdropFilter: 'blur(8px)',
      }}>
        <style>{`
          [data-state="open"] ~ .fixed.inset-0 {
            background-color: rgba(0, 0, 0, 0.8) !important;
            backdrop-filter: blur(12px) !important;
          }
        `}</style>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan QR Code to Play
          </DialogTitle>
          <DialogDescription>
            Point your camera at the event QR code to play a game
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Always render scanner div but hide when not in use */}
          <div style={{ display: qrOn ? 'block' : 'none' }}>
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
                />
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
                
                {/* Timer display */}
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-3 py-1 rounded-full font-mono">
                  ⏱️ {CAMERA_TIMEOUT - timeoutSeconds}s
                </div>
                
                {/* Close button */}
                <Button
                  onClick={() => {
                    stopScanner();
                    onClose();
                  }}
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 left-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
              
            {scanStatus && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <AlertDescription className="text-sm text-green-700 dark:text-green-400">
                  {scanStatus}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <AnimatePresence mode="wait">
          {isStarting && !qrOn && (
            <motion.div 
              key="starting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="text-center p-6"
            >
              <div className="w-12 h-12 mx-auto mb-3 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">
                Starting camera...
              </p>
            </motion.div>
          )}
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
          {!qrOn && !isStarting && cameraError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="destructive">
                <AlertDescription className="text-sm">
                  {cameraError}
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2 mt-4">
                <Button
                  onClick={startScanner}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Camera className="w-4 h-4" />
                  Try Again
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  Make sure to allow camera access when prompted by your browser
                </p>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>

    {/* Success Confirmation Dialog */}
    <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
      <DialogContent className="max-w-md backdrop-blur-md" style={{
        backdropFilter: 'blur(8px)',
      }}>
        <style>{`
          [data-state="open"] ~ .fixed.inset-0 {
            background-color: rgba(0, 0, 0, 0.85) !important;
            backdrop-filter: blur(16px) !important;
          }
          /* Make close button bigger and align with title */
          .max-w-md button[class*="absolute"][class*="right-4"][class*="top-4"] {
            width: 32px !important;
            height: 32px !important;
            top: 24px !important;
            right: 24px !important;
          }
          .max-w-md button[class*="absolute"][class*="right-4"][class*="top-4"] svg {
            width: 20px !important;
            height: 20px !important;
          }
        `}</style>
        <DialogHeader>
          <DialogTitle>
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex items-center gap-2 text-green-600"
            >
              <span className="text-2xl">🎮</span>
              Game Played Successfully!
            </motion.span>
          </DialogTitle>
        </DialogHeader>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="space-y-4 py-4"
        >
          {/* Scan Time */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="bg-muted/50 rounded-lg p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Scan Time</span>
              <span className="text-lg font-mono font-semibold">{scanResult?.scanTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Games Remaining</span>
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                className="text-2xl font-bold text-green-600"
              >
                {scanResult?.gamesRemaining}
              </motion.span>
            </div>
          </motion.div>
          
          {/* Message */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground">
              {scanResult?.message}
            </p>
          </motion.div>
          
          {/* Close Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                onClose();
              }}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              Close
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default EventQRScanner;
