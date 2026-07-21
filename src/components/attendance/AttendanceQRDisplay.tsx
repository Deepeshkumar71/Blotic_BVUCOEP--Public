import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Download, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { motion } from "framer-motion";

interface AttendanceQRDisplayProps {
  sessionName: string;
  qrToken: string;
}

const AttendanceQRDisplay = ({ sessionName, qrToken }: AttendanceQRDisplayProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

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
    const svg = document.getElementById('qr-code-display-svg');
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 sm:border bg-card">
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
                  id="qr-code-display-svg"
                  value={qrToken}
                  size={typeof window !== 'undefined' && window.innerWidth < 640 ? Math.min(window.innerWidth - 80, 280) : 300}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </motion.div>

            {/* Right Column - Details */}
            <div className="flex-1 space-y-4 sm:space-y-6">
              {/* Session Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <h3 className="font-semibold text-xl sm:text-2xl mb-1">{sessionName}</h3>
                <p className="text-sm text-muted-foreground">
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
                <Label className="text-sm font-medium">Session Token</Label>
                <div className="flex gap-2">
                  <Input
                    value={qrToken}
                    readOnly
                    className="font-mono text-sm bg-background"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
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
                  className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  <Download className="w-4 h-4" />
                  Download QR
                </Button>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AttendanceQRDisplay;
