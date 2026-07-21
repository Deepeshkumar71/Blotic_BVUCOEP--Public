import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, QrCode } from "lucide-react";
import { motion } from "framer-motion";

interface AttendanceScannerSimpleProps {
  onScanSuccess: (token: string, location: { latitude: number; longitude: number; accuracy: number }) => void;
  onScanError: (error: string) => void;
  sessionName: string;
}

const AttendanceScannerSimple = ({ onScanSuccess, onScanError, sessionName }: AttendanceScannerSimpleProps) => {
  const [manualToken, setManualToken] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleManualSubmit = async () => {
    if (!manualToken.trim()) {
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
          
          onScanSuccess(manualToken.trim(), location);
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
          
          onScanSuccess(manualToken.trim(), dummyLocation);
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
      
      onScanSuccess(manualToken.trim(), dummyLocation);
      setIsGettingLocation(false);
      setManualToken("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-6 h-6" />
              Mark Attendance
            </CardTitle>
            <CardDescription>
              Marking attendance for: {sessionName}
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Manual Token Entry */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
            <QrCode className="w-12 h-12 mx-auto mb-3 text-blue-600" />
            <p className="text-sm font-medium mb-2">Manual Token Entry</p>
            <p className="text-xs text-muted-foreground">
              Enter the QR code token shown on the admin's screen
            </p>
          </div>

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

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleManualSubmit}
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
          </motion.div>
          </motion.div>

          {/* Info */}
          <motion.div
            className="bg-muted/50 rounded-lg p-4 space-y-2 text-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
          <p className="font-medium">How it works:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Admin displays QR code on screen</li>
            <li>Copy the token text from below the QR code</li>
            <li>Paste it in the field above</li>
            <li>Click "Mark Attendance"</li>
            <li>Your location will be captured automatically</li>
          </ol>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AttendanceScannerSimple;
