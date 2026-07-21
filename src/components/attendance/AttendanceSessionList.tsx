import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Users, MapPin, Clock, QrCode, Trash2, StopCircle, CheckCircle2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { motion } from "framer-motion";

interface AttendanceSessionListProps {
  onSelectSession: (sessionId: string, sessionName: string) => void;
  onViewRecords: (sessionId: string, sessionName: string) => void;
  onShowQR: (sessionId: string, sessionName: string, token: string) => void;
  isAdmin?: boolean;
  isRequestingLocation?: boolean;
}

const AttendanceSessionList = ({ onSelectSession, onViewRecords, onShowQR, isAdmin = false, isRequestingLocation = false }: AttendanceSessionListProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSuperAdmin } = useRoleCheck();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [endSessionDialogOpen, setEndSessionDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<{ id: string; name: string } | null>(null);

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      // First delete all attendance records for this session
      const { error: recordsError } = await supabase
        .from('attendance_records')
        .delete()
        .eq('session_id', sessionId);

      if (recordsError) {
        console.error("Error deleting records:", recordsError);
        // Continue anyway to try deleting the session
      }

      // Then delete the session
      const { error } = await supabase
        .from('attendance_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      return sessionId;
    },
    onSuccess: (deletedSessionId) => {
      // Invalidate both admin and member queries
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions", true] });
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions", false] });
      
      toast({
        title: "Session Deleted",
        description: "Attendance session has been deleted successfully",
        className: "bg-green-600 border-green-700 text-white",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('attendance_sessions')
        .update({ 
          valid_until: now,
          is_active: false 
        })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions"] });
      toast({
        title: "Session Ended",
        description: "Attendance session has been ended successfully",
        className: "bg-green-600 border-green-700 text-white",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to end session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEndSession = (sessionId: string, sessionName: string) => {
    setSelectedSession({ id: sessionId, name: sessionName });
    setEndSessionDialogOpen(true);
  };

  const confirmEndSession = () => {
    if (selectedSession) {
      endSessionMutation.mutate(selectedSession.id);
    }
    setEndSessionDialogOpen(false);
    setSelectedSession(null);
  };

  const handleDelete = (sessionId: string, sessionName: string) => {
    setSelectedSession({ id: sessionId, name: sessionName });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedSession) {
      deleteSessionMutation.mutate(selectedSession.id);
    }
    setDeleteDialogOpen(false);
    setSelectedSession(null);
  };

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["attendance-sessions", isAdmin],
    queryFn: async () => {
      let query = supabase
        .from('attendance_sessions')
        .select('*');

      // For members, only show active sessions
      if (!isAdmin) {
        const now = new Date().toISOString();
        query = query
          .eq('is_active', true)
          .gte('valid_until', now);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 10000, // Auto-refetch every 10 seconds for real-time updates
    refetchIntervalInBackground: true, // Continue refetching even when tab is not focused
  });

  // Fetch user's attendance records (for members only)
  const { data: userAttendance } = useQuery({
    queryKey: ["user-attendance", user?.id],
    queryFn: async () => {
      if (!user?.id || isAdmin) return [];
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('session_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map(record => record.session_id);
    },
    enabled: !isAdmin && !!user?.id,
    refetchInterval: 10000, // Auto-refetch every 10 seconds for real-time attendance status
    refetchIntervalInBackground: true, // Continue refetching even when tab is not focused
  });

  const isSessionActive = (session: { valid_from: string; valid_until: string; is_active: boolean }) => {
    const now = new Date();
    const validFrom = new Date(session.valid_from);
    const validUntil = new Date(session.valid_until);
    return now >= validFrom && now <= validUntil && session.is_active;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Attendance Sessions</CardTitle>
          <CardDescription>
            {isAdmin ? "Create a new session to get started" : "No active sessions available"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
      {sessions.map((session) => {
        const active = isSessionActive(session);
        const validUntil = new Date(session.valid_until);
        const timeRemaining = Math.max(0, Math.floor((validUntil.getTime() - Date.now()) / 60000));
        const hasAttended = userAttendance?.includes(session.id);

        return (
          <Card key={session.id} className={`${active ? "border-green-500/30 bg-green-500/5" : "border-muted"} transition-all duration-200 hover:shadow-md`}>
            {/* Header - Avatar and Basic Info */}
            <div className="p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                    {session.session_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-sm truncate">{session.session_name}</h3>
                      <Badge variant={active ? "default" : "secondary"} className={`text-xs ${active ? "bg-green-600" : ""}`}>
                        {active ? "Active" : "Expired"}
                      </Badge>
                    </div>
                    {session.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{session.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Session Details */}
            <div className="px-4 pb-2 space-y-1 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{format(new Date(session.created_at), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{active ? `${timeRemaining}m left` : 'Ended'}</span>
              </div>
              {session.session_location_lat && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">±{session.allowed_radius_meters}m radius</span>
                </div>
              )}
              {isAdmin && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{session.total_scans || 0} scans</span>
                </div>
              )}
            </div>

            {/* Actions - Stacked Vertically */}
            <div className="px-4 pb-4 space-y-2">
              <div className="flex gap-2">
                {!isAdmin && active && (
                  hasAttended ? (
                    <Button
                      disabled
                      variant="outline"
                      className="flex-1 gap-1 border-green-600 text-green-600 text-xs h-7"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Marked</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => onSelectSession(session.id, session.session_name)}
                      disabled={isRequestingLocation}
                      className="flex-1 gap-1 text-xs h-8 transition-all duration-200"
                    >
                      {isRequestingLocation ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="w-3 h-3" />
                          <span>Scan</span>
                        </>
                      )}
                    </Button>
                  )
                )}
                {isAdmin && (
                  <>
                    {active && (
                      <Button
                        onClick={() => onShowQR(session.id, session.session_name, session.qr_code_token)}
                        variant="outline"
                        className="flex-1 gap-1 text-xs h-8"
                      >
                        <QrCode className="w-3 h-3" />
                        <span>QR</span>
                      </Button>
                    )}
                    <motion.div
                      className="flex-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => onViewRecords(session.id, session.session_name)}
                        variant="outline"
                        className="gap-1 text-xs h-8 w-full"
                      >
                        <Users className="w-3 h-3" />
                        <span>View</span>
                      </Button>
                    </motion.div>
                    {/* For expired sessions, show Remove button next to View */}
                    {isSuperAdmin() && !active && (
                      <Button
                        onClick={() => handleDelete(session.id, session.session_name)}
                        variant="outline"
                        className="flex-1 gap-1 text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                        disabled={deleteSessionMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </Button>
                    )}
                  </>
                )}
              </div>
              {isAdmin && active && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEndSession(session.id, session.session_name)}
                    variant="destructive"
                    className="flex-1 gap-1 text-xs h-8"
                    disabled={endSessionMutation.isPending}
                  >
                    <StopCircle className="w-3 h-3" />
                    <span>End Session</span>
                  </Button>
                  {/* For active sessions, show Remove button next to End Session */}
                  {isSuperAdmin() && (
                    <Button
                      onClick={() => handleDelete(session.id, session.session_name)}
                      variant="outline"
                      className="flex-1 gap-1 text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                      disabled={deleteSessionMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Session?</AlertDialogTitle>
            <AlertDialogDescription className="mb-4">
              Are you sure you want to delete "{selectedSession?.name}"? This action cannot be undone and all attendance records will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>

    {/* End Session Confirmation Dialog */}
    <AlertDialog open={endSessionDialogOpen} onOpenChange={setEndSessionDialogOpen}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>End Attendance Session?</AlertDialogTitle>
            <AlertDialogDescription className="mb-4">
              Are you sure you want to end "{selectedSession?.name}"? No more attendance can be marked after this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEndSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
};

export default AttendanceSessionList;
