import { useState } from "react";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/utils/animations";
import { QrCode, Users, AlertCircle, Plus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import LocationHandler, { LocationError } from "@/utils/locationHandler";
import LocationPermissionDialog from "@/components/attendance/LocationPermissionDialog";
// Testing with simple version first
import AttendanceQRGeneratorSimple from "@/components/attendance/AttendanceQRGeneratorSimple";
import AttendanceQRDisplay from "@/components/attendance/AttendanceQRDisplay";
import AttendanceSessionList from "@/components/attendance/AttendanceSessionList";
import AttendanceScannerSimple from "@/components/attendance/AttendanceScannerSimple";
import CameraScanner from "@/components/attendance/CameraScanner";
import CameraScannerFixed from "@/components/attendance/CameraScannerFixed";
import AttendanceRecordsViewerSimple from "@/components/attendance/AttendanceRecordsViewerSimple";
import AttendanceSuccessAnimation from "@/components/attendance/AttendanceSuccessAnimation";
// import AttendanceScanner from "@/components/attendance/AttendanceScanner";
// import AttendanceQRGenerator from "@/components/attendance/AttendanceQRGenerator";
// import AttendanceRecordsViewer from "@/components/attendance/AttendanceRecordsViewer";

const Attendance = () => {
  const { isSuperAdmin, isCore, isStudent } = useRoleCheck();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSessionName, setSelectedSessionName] = useState<string>("");
  const [selectedQRToken, setSelectedQRToken] = useState<string>("");
  const [showGenerator, setShowGenerator] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [locationError, setLocationError] = useState<LocationError | undefined>(undefined);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [preGrantedLocation, setPreGrantedLocation] = useState<{latitude: number; longitude: number; accuracy: number} | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successData, setSuccessData] = useState<{
    userName: string;
    sessionName: string;
    location?: { latitude: number; longitude: number; accuracy: number };
  } | null>(null);
  const isAdminOrCore = isSuperAdmin() || isCore();
  
  const locationHandler = LocationHandler.getInstance();
  
  // Block students from accessing attendance system
  if (isStudent()) {
    return (
      <div className="container mx-auto max-w-4xl">
        <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertCircle className="w-6 h-6" />
              Access Restricted
            </CardTitle>
            <CardDescription className="text-yellow-600 dark:text-yellow-500">
              The attendance system is only available for club members, co-heads, core team, and admins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If you are a club member and seeing this message, please contact the admin to update your role.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSessionCreated = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  // Pre-request location permission when "Mark Attendance" is clicked
  const handleMarkAttendance = async (sessionId: string, sessionName: string) => {
    console.log("🎯 Mark Attendance clicked - pre-requesting location...");
    setIsRequestingLocation(true);
    setLocationError(undefined);
    
    try {
      // Try to get location permission immediately
      const result = await locationHandler.requestLocation();
      
      if (result.data) {
        // Success! Location granted, proceed to scanner with pre-granted location
        console.log("✅ Location pre-granted:", result.data);
        setPreGrantedLocation(result.data);
        setSelectedSessionId(sessionId);
        setSelectedSessionName(sessionName);
        setShowScanner(true);
        
        toast({
          title: "Location Verified",
          description: "Opening camera scanner...",
        });
      } else if (result.error) {
        // Show location dialog for user to resolve
        console.log("❌ Location error, showing dialog:", result.error);
        setLocationError(result.error);
        setShowLocationDialog(true);
        setSelectedSessionId(sessionId);
        setSelectedSessionName(sessionName);
      }
    } catch (error) {
      console.error("❌ Unexpected error in pre-request:", error);
      toast({
        title: "Error",
        description: "Failed to request location permission",
        variant: "destructive",
      });
    } finally {
      setIsRequestingLocation(false);
    }
  };

  // Handle location granted from dialog
  const handleLocationGranted = (location: { latitude: number; longitude: number; accuracy: number }) => {
    console.log("🎯 Location granted from dialog:", location);
    setPreGrantedLocation(location);
    setShowLocationDialog(false);
    setShowScanner(true);
    
    toast({
      title: "Location Verified",
      description: "Opening camera scanner...",
    });
  };

  // Handle location denied from dialog
  const handleLocationDenied = () => {
    console.log("❌ Location denied by user");
    setShowLocationDialog(false);
    toast({
      title: "Location Required",
      description: "Location permission is required to mark attendance",
      variant: "destructive",
    });
  };

  // Handle success animation completion - fast update without reload
  const handleSuccessAnimationComplete = () => {
    console.log("🎯 Success animation completed, updating data...");
    setShowSuccessAnimation(false);
    setSuccessData(null);
    setPreGrantedLocation(null);
    
    // Fast real-time update using React Query invalidation (no page reload needed)
    queryClient.invalidateQueries({ queryKey: ["attendance-sessions"] });
    queryClient.invalidateQueries({ queryKey: ["user-attendance"] });
    
    console.log("✅ Data refreshed instantly!");
  };

  const handleScanSuccess = async (token: string, location: { latitude: number; longitude: number; accuracy: number }) => {
    try {
      console.log("Scanning token:", token);
      console.log("Location:", location || "No location provided");
      
      // 1. Find the session by QR token
      const { data: session, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('qr_code_token', token)
        .single();

      console.log("Session found:", session);
      console.log("Session error:", sessionError);

      if (sessionError || !session) {
        toast({
          title: "Invalid QR Code",
          description: `This QR code is not valid or session not found. Token: ${token.substring(0, 20)}...`,
          variant: "destructive",
        });
        return;
      }

      // 2. Check if session is active
      const now = new Date();
      const validFrom = new Date(session.valid_from);
      const validUntil = new Date(session.valid_until);
      
      if (!session.is_active || now < validFrom || now > validUntil) {
        toast({
          title: "Session Expired",
          description: "This attendance session is no longer active",
          variant: "destructive",
        });
        return;
      }

      // 3. Check if already marked
      const { data: existing } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', session.id)
        .eq('user_id', user?.id)
        .single();

      if (existing) {
        toast({
          title: "Already Marked",
          description: "You have already marked attendance for this session",
          variant: "destructive",
        });
        return;
      }

      // 4. Mark attendance with location
      const attendanceData = {
        session_id: session.id,
        user_id: user?.id,
        scan_location_lat: location.latitude,
        scan_location_lng: location.longitude,
        location_accuracy: location.accuracy,
        device_info: { userAgent: navigator.userAgent },
        user_agent: navigator.userAgent,
      };

      console.log("Attempting to insert attendance record:", attendanceData);

      const { data: insertData, error: insertError } = await supabase
        .from('attendance_records')
        .insert(attendanceData)
        .select();

      console.log("Insert result:", insertData);
      console.log("Insert error:", insertError);

      if (insertError) {
        toast({
          title: "Failed to Mark Attendance",
          description: `${insertError.message} (Code: ${insertError.code})`,
          variant: "destructive",
        });
        return;
      }

      // Success! Show beautiful animation
      setSuccessData({
        userName: userProfile?.full_name || user?.email || 'User',
        sessionName: session.session_name,
        location: location
      });
      setShowSuccessAnimation(true);
      
      // Close scanner immediately
      setShowScanner(false);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleScanError = (error: string) => {
    toast({
      title: "Scan Error",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background pt-8 pb-2 px-1 sm:py-8 sm:px-6"
    >
      <div className="container mx-auto max-w-6xl px-0 sm:px-4">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-1 sm:mb-2">
            Attendance System
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage and track attendance sessions
          </p>
        </div>

        {isAdminOrCore ? (
          showGenerator ? (
            <div className="space-y-2 sm:space-y-4 relative pb-20">
              <AttendanceQRGeneratorSimple />
              
              {/* Fixed Bottom Button */}
              <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg px-4 sm:px-6 py-4 z-50">
                <Button
                  onClick={() => setShowGenerator(false)}
                  className="gap-2 w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  ← Back to Sessions
                </Button>
              </div>
            </div>
          ) : showQR ? (
            <div className="space-y-2 sm:space-y-4 relative pb-20">
              <AttendanceQRDisplay
                sessionName={selectedSessionName}
                qrToken={selectedQRToken}
              />
              
              {/* Fixed Bottom Button */}
              <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg px-4 sm:px-6 py-4 z-50">
                <Button
                  onClick={() => setShowQR(false)}
                  className="gap-2 w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  ← Back to Sessions
                </Button>
              </div>
            </div>
          ) : showRecords ? (
            <div className="space-y-2 sm:space-y-4 relative pb-20">
              <AttendanceRecordsViewerSimple
                sessionId={selectedSessionId || ""}
                sessionName={selectedSessionName}
              />
              
              {/* Fixed Bottom Button */}
              <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg px-4 sm:px-6 py-4 z-50">
                <Button
                  onClick={() => setShowRecords(false)}
                  className="gap-2 w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  ← Back to Sessions
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-6">
              <div className="bg-card border border-border rounded-lg sm:rounded-xl p-2 sm:p-6">
                <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="text-center sm:text-left">
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">Session Management</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Create and manage attendance sessions</p>
                  </div>
                  <Button
                    onClick={() => setShowGenerator(true)}
                    className="gap-2 w-full sm:w-auto sm:self-start"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Session
                  </Button>
                </div>
              <AttendanceSessionList
                onSelectSession={handleMarkAttendance}
                isRequestingLocation={isRequestingLocation}
                onShowQR={(id, name, token) => {
                  setSelectedSessionId(id);
                  setSelectedSessionName(name);
                  setSelectedQRToken(token);
                  setShowQR(true);
                }}
                onViewRecords={(id, name) => {
                  setSelectedSessionId(id);
                  setSelectedSessionName(name);
                  setShowRecords(true);
                }}
                isAdmin={true}
              />
              </div>
            </div>
          )
        ) : showScanner ? (
          <div className="space-y-2 sm:space-y-4 relative pb-24">
            {selectedSessionName ? (
              <CameraScannerFixed
                sessionName={selectedSessionName}
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
                preGrantedLocation={preGrantedLocation}
              />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">
                    No session selected. Please go back and select a session.
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Fixed Bottom Action Bar - Photo Management Style */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    {selectedSessionName ? `Scanning for: ${selectedSessionName}` : 'QR Code Scanner Active'}
                  </p>
                  <Button
                    onClick={() => {
                      setShowScanner(false);
                      setSelectedSessionId(null);
                      setSelectedSessionName("");
                    }}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Sessions
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg sm:rounded-xl p-2 sm:p-6">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-1 sm:mb-2">Available Sessions</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Select a session to mark your attendance</p>
            </div>
            <AttendanceSessionList
              onSelectSession={handleMarkAttendance}
              isRequestingLocation={isRequestingLocation}
              onShowQR={(id, name, token) => {
                // Members don't see this button
              }}
              onViewRecords={(id, name) => {
                // Members don't see this button
              }}
              isAdmin={false}
            />
          </div>
        )}
      </div>

      {/* Location Permission Dialog */}
      <LocationPermissionDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        onLocationGranted={handleLocationGranted}
        onLocationDenied={handleLocationDenied}
        error={locationError}
      />

      {/* Success Animation */}
      <AttendanceSuccessAnimation
        show={showSuccessAnimation}
        userName={successData?.userName || ''}
        sessionName={successData?.sessionName || ''}
        location={successData?.location}
        onAnimationComplete={handleSuccessAnimationComplete}
      />
    </motion.div>
  );
};

export default Attendance;
