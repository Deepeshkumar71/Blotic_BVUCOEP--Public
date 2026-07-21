import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, MapPin, Clock, Download, Copy, CheckCircle2 } from "lucide-react";
import { requestLocationPermission, type LocationData } from "@/utils/permissions";

interface AttendanceQRGeneratorProps {
  onSessionCreated?: (sessionId: string) => void;
}

const AttendanceQRGenerator = ({ onSessionCreated }: AttendanceQRGeneratorProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [sessionName, setSessionName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [radiusMeters, setRadiusMeters] = useState(100);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [useLocation, setUseLocation] = useState(true);
  
  // Generated session state
  const [generatedSession, setGeneratedSession] = useState<any>(null);
  const [qrCodeToken, setQrCodeToken] = useState("");
  const [copied, setCopied] = useState(false);

  // Get current location on mount
  useEffect(() => {
    if (useLocation) {
      getCurrentLocation();
    }
  }, [useLocation]);

  const getCurrentLocation = async () => {
    const location = await requestLocationPermission();
    if (location) {
      setCurrentLocation(location);
      toast({
        title: "Location captured",
        description: `Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}`,
        className: "bg-green-600 border-green-700 text-white",
      });
    } else {
      toast({
        title: "Location unavailable",
        description: "Could not get your current location. Session will not have location verification.",
        variant: "destructive",
      });
    }
  };

  // Generate unique token
  const generateToken = () => {
    return `ATD-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const token = generateToken();
      const now = new Date();
      const validUntil = new Date(now.getTime() + durationMinutes * 60000);

      const sessionData = {
        session_name: sessionName,
        description: description || null,
        qr_code_token: token,
        valid_from: now.toISOString(),
        valid_until: validUntil.toISOString(),
        is_active: true,
        session_location_lat: useLocation && currentLocation ? currentLocation.latitude : null,
        session_location_lng: useLocation && currentLocation ? currentLocation.longitude : null,
        allowed_radius_meters: useLocation ? radiusMeters : null,
      };

      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) throw error;
      return { data, token };
    },
    onSuccess: ({ data, token }) => {
      setGeneratedSession(data);
      setQrCodeToken(token);
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions"] });
      
      toast({
        title: "QR Code Generated!",
        description: `Session "${sessionName}" created successfully`,
        className: "bg-green-600 border-green-700 text-white",
      });

      if (onSessionCreated) {
        onSessionCreated(data.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionName.trim()) {
      toast({
        title: "Session name required",
        description: "Please enter a name for this attendance session",
        variant: "destructive",
      });
      return;
    }

    if (useLocation && !currentLocation) {
      toast({
        title: "Location required",
        description: "Please allow location access or disable location verification",
        variant: "destructive",
      });
      return;
    }

    createSessionMutation.mutate();
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('attendance-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `attendance-qr-${sessionName.replace(/\s+/g, '-')}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(qrCodeToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Token copied!",
      description: "QR code token copied to clipboard",
      className: "bg-green-600 border-green-700 text-white",
    });
  };

  const handleReset = () => {
    setGeneratedSession(null);
    setQrCodeToken("");
    setSessionName("");
    setDescription("");
    setDurationMinutes(30);
    setRadiusMeters(100);
    setCurrentLocation(null);
  };

  // Show generated QR code
  if (generatedSession && qrCodeToken) {
    const validUntil = new Date(generatedSession.valid_until);
    const timeRemaining = Math.max(0, Math.floor((validUntil.getTime() - Date.now()) / 60000));

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-6 h-6" />
            QR Code Generated
          </CardTitle>
          <CardDescription>
            Display this QR code for members to scan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-lg">{generatedSession.session_name}</h3>
            {generatedSession.description && (
              <p className="text-sm text-muted-foreground">{generatedSession.description}</p>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
              <Clock className="w-4 h-4" />
              <span>Valid for {timeRemaining} minutes</span>
            </div>
            
            {generatedSession.session_location_lat && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>
                  Location: {generatedSession.session_location_lat.toFixed(6)}, 
                  {generatedSession.session_location_lng.toFixed(6)} 
                  (±{generatedSession.allowed_radius_meters}m)
                </span>
              </div>
            )}
          </div>

          {/* QR Code Display */}
          <div className="flex justify-center p-8 bg-white rounded-lg border-2 border-border">
            <QRCodeSVG
              id="attendance-qr-code"
              value={qrCodeToken}
              size={300}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Token Display */}
          <div className="space-y-2">
            <Label>Session Token</Label>
            <div className="flex gap-2">
              <Input
                value={qrCodeToken}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={handleCopyToken}
                variant="outline"
                size="icon"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleDownloadQR}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Download className="w-4 h-4" />
              Download QR
            </Button>
            <Button
              onClick={handleReset}
              className="flex-1 gap-2"
            >
              <QrCode className="w-4 h-4" />
              Generate New
            </Button>
          </div>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-700 dark:text-yellow-400">
            <strong>Note:</strong> This QR code will expire in {timeRemaining} minutes. 
            Keep this page open or download the QR code for display.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show creation form
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-6 h-6" />
          Generate Attendance QR Code
        </CardTitle>
        <CardDescription>
          Create a time-limited QR code for attendance tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session Name */}
          <div className="space-y-2">
            <Label htmlFor="sessionName">
              Session Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sessionName"
              placeholder="e.g., Weekly Meeting, Workshop Session"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add details about this session..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">
              Valid Duration (minutes) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="duration"
              type="number"
              min="5"
              max="480"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
              required
            />
            <p className="text-xs text-muted-foreground">
              QR code will be valid for {durationMinutes} minutes ({Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m)
            </p>
          </div>

          {/* Location Verification */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="useLocation">Enable Location Verification</Label>
              <input
                id="useLocation"
                type="checkbox"
                checked={useLocation}
                onChange={(e) => setUseLocation(e.target.checked)}
                className="w-4 h-4 rounded"
              />
            </div>

            {useLocation && (
              <>
                {/* Current Location */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  {currentLocation ? (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-600">Location Captured</p>
                        <p className="text-xs text-muted-foreground">
                          Lat: {currentLocation.latitude.toFixed(6)}, 
                          Lng: {currentLocation.longitude.toFixed(6)}
                          {currentLocation.accuracy && ` (±${Math.round(currentLocation.accuracy)}m)`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Location Not Set</p>
                        <p className="text-xs text-muted-foreground">
                          Click the button below to capture your current location
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    onClick={getCurrentLocation}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    {currentLocation ? 'Update Location' : 'Get Current Location'}
                  </Button>
                </div>

                {/* Allowed Radius */}
                <div className="space-y-2">
                  <Label htmlFor="radius">Allowed Radius (meters)</Label>
                  <Input
                    id="radius"
                    type="number"
                    min="10"
                    max="1000"
                    value={radiusMeters}
                    onChange={(e) => setRadiusMeters(parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Members must be within {radiusMeters}m of your location to mark attendance
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium text-blue-700 dark:text-blue-400">How it works:</p>
            <ul className="text-blue-600 dark:text-blue-300 space-y-1 list-disc list-inside text-xs">
              <li>QR code will be valid for the specified duration</li>
              <li>Members must scan within the time window</li>
              {useLocation && <li>Location verification ensures physical presence</li>}
              <li>Each member can scan only once per session</li>
              <li>You can view attendance records in real-time</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full gap-2"
            size="lg"
            disabled={createSessionMutation.isPending}
          >
            {createSessionMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                Generate QR Code
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AttendanceQRGenerator;
