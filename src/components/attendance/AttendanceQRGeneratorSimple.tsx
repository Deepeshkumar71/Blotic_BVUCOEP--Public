import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Download, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const AttendanceQRGeneratorSimple = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sessionName, setSessionName] = useState("");
  const [description, setDescription] = useState("");
  const [sessionDate, setSessionDate] = useState(() => {
    // Get current date in Indian timezone (IST - UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  });
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [qrToken, setQrToken] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateToken = () => {
    return `ATD-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const token = generateToken();
      const now = new Date();
      const validUntil = new Date(now.getTime() + durationMinutes * 60000);

      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert([{
          created_by: user?.id,
          session_name: sessionName,
          description: description || null,
          qr_code_token: token,
          valid_from: now.toISOString(),
          valid_until: validUntil.toISOString(),
          is_active: true,
          session_location_lat: null,
          session_location_lng: null,
          allowed_radius_meters: null,
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, token };
    },
    onSuccess: ({ data, token }) => {
      setQrToken(token);
      setShowQR(true);
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions"] });
      
      toast({
        title: "Session Created!",
        description: `"${sessionName}" is now active`,
        className: "bg-green-600 border-green-700 text-white",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!sessionName.trim()) {
      toast({
        title: "Session name required",
        description: "Please enter a name for the attendance session",
        variant: "destructive",
      });
      return;
    }

    createSessionMutation.mutate();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(qrToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Token copied!",
      description: "QR code token copied to clipboard",
      className: "bg-green-600 border-green-700 text-white",
    });
  };

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
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

  const handleReset = () => {
    setShowQR(false);
    setQrToken("");
    setSessionName("");
    setDescription("");
  };

  if (showQR && qrToken) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="qr-display"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
        >
      <Card className="border-0 sm:border">
        <CardHeader className="pb-3 sm:pb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
              QR Code Generated
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Display this QR code for members to scan
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {/* Two Column Layout for Desktop */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left Column - QR Code */}
            <motion.div
              className="flex justify-center lg:justify-start lg:flex-shrink-0"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
            >
              <div className="p-4 sm:p-6 bg-white rounded-lg border-2">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={qrToken}
                  size={window.innerWidth < 640 ? Math.min(window.innerWidth - 80, 280) : 300}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </motion.div>

            {/* Right Column - Details */}
            <div className="flex-1 space-y-4 sm:space-y-6">
              {/* Session Info */}
              <motion.div
                className="bg-muted/50 rounded-lg p-3 sm:p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <h3 className="font-semibold text-base sm:text-lg">{sessionName}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Attendance session active
                </p>
              </motion.div>

              {/* Token */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <Label className="text-xs sm:text-sm">Session Token</Label>
                <div className="flex gap-2">
                  <Input
                    value={qrToken}
                    readOnly
                    className="font-mono text-xs sm:text-sm"
                  />
                  <Button
                    onClick={handleCopy}
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
              </motion.div>

              {/* Actions */}
              <motion.div
                className="flex flex-col sm:flex-row gap-2 sm:gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="flex-1 gap-2 text-sm sm:text-base"
                >
                  <Download className="w-4 h-4" />
                  Download QR
                </Button>
                <Button
                  onClick={handleReset}
                  className="flex-1 gap-2 text-sm sm:text-base"
                >
                  <QrCode className="w-4 h-4" />
                  Generate New
                </Button>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <Card className="border-0 sm:border">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
          Generate Attendance QR Code
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Create a QR code for attendance tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
        {/* Session Name */}
        <div className="space-y-2">
          <Label htmlFor="sessionName" className="text-xs sm:text-sm">
            Session Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="sessionName"
            placeholder="e.g., Weekly Meeting, Workshop Session"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className="text-sm sm:text-base"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-xs sm:text-sm">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Add details about this session..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-sm sm:text-base min-h-[60px] sm:min-h-[80px]"
          />
        </div>

        {/* Session Date */}
        <div className="space-y-2">
          <Label htmlFor="sessionDate" className="text-xs sm:text-sm">
            Session Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="sessionDate"
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="text-sm sm:text-base"
          />
          <p className="text-xs text-muted-foreground">
            Auto-set to today's date (Indian Time)
          </p>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-xs sm:text-sm">Valid Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min="5"
            max="480"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
            className="text-sm sm:text-base"
          />
          <p className="text-xs text-muted-foreground">
            Session will be active for {durationMinutes} minutes
          </p>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          className="w-full gap-2 text-sm sm:text-base"
          size="lg"
        >
          <QrCode className="w-4 h-4" />
          Generate QR Code
        </Button>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4 text-xs sm:text-sm space-y-2">
          <p className="font-medium text-blue-700 dark:text-blue-400 text-xs sm:text-sm">Quick QR Generator:</p>
          <ul className="text-blue-600 dark:text-blue-300 space-y-1 list-disc list-inside text-xs">
            <li>Generate instant QR codes for attendance</li>
            <li>Download or display on screen</li>
            <li>Members can scan to mark attendance</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceQRGeneratorSimple;
