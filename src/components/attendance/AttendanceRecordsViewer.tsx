import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Users, 
  Clock, 
  MapPin, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Calendar,
  Smartphone,
  Globe,
  Navigation
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  session_id: string;
  user_id: string;
  scanned_at: string;
  scan_location_lat: number;
  scan_location_lng: number;
  distance_from_session: number | null;
  location_accuracy: number | null;
  is_valid: boolean;
  is_within_time: boolean;
  is_within_location: boolean;
  device_info: any;
  ip_address: string | null;
  user_agent: string | null;
  profiles: {
    full_name: string;
    email: string;
    avatar_url: string | null;
    role: string;
    branch: string | null;
    year: number | null;
  };
}

interface AttendanceRecordsViewerProps {
  sessionId: string;
  sessionName: string;
}

const AttendanceRecordsViewer = ({ sessionId, sessionName }: AttendanceRecordsViewerProps) => {
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Fetch attendance records
  const { data: records, isLoading } = useQuery({
    queryKey: ["attendance-records", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            avatar_url,
            role,
            branch,
            year
          )
        `)
        .eq('session_id', sessionId)
        .order('scanned_at', { ascending: false });

      if (error) throw error;
      return data as AttendanceRecord[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });

  const validCount = records?.filter(r => r.is_valid).length || 0;
  const invalidCount = records?.filter(r => !r.is_valid).length || 0;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6" />
                Attendance Records
              </CardTitle>
              <CardDescription className="mt-2">
                {sessionName}
              </CardDescription>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {records?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Scans
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Valid</span>
              </div>
              <div className="text-2xl font-bold">{validCount}</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">Invalid</span>
              </div>
              <div className="text-2xl font-bold">{invalidCount}</div>
            </div>
          </div>

          {/* Records List */}
          {records && records.length > 0 ? (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    record.is_valid
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  {/* Avatar */}
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={record.profiles.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10">
                      {getInitials(record.profiles.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate">
                        {record.profiles.full_name}
                      </p>
                      <Badge variant={record.is_valid ? "default" : "destructive"} className="text-xs">
                        {record.is_valid ? 'Valid' : 'Invalid'}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(record.scanned_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {record.scan_location_lat.toFixed(4)}, {record.scan_location_lng.toFixed(4)}
                      </span>
                      {record.distance_from_session !== null && (
                        <span className="flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          {Math.round(record.distance_from_session)}m away
                        </span>
                      )}
                    </div>

                    {/* Validation Issues */}
                    {!record.is_valid && (
                      <div className="flex gap-2 mt-2">
                        {!record.is_within_time && (
                          <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Outside time window
                          </Badge>
                        )}
                        {!record.is_within_location && (
                          <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Outside location radius
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* View Button */}
                  <Button
                    onClick={() => setSelectedRecord(record)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium text-muted-foreground">No attendance records yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Records will appear here as members scan the QR code
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed View Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:text-red-500 [&>button]:hover:text-red-600 [&>button]:hover:bg-red-500/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Attendance Details
            </DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedRecord.profiles.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-lg">
                    {getInitials(selectedRecord.profiles.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedRecord.profiles.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedRecord.profiles.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{selectedRecord.profiles.role}</Badge>
                    {selectedRecord.profiles.branch && (
                      <Badge variant="outline">{selectedRecord.profiles.branch}</Badge>
                    )}
                    {selectedRecord.profiles.year && (
                      <Badge variant="outline">Year {selectedRecord.profiles.year}</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Validation Status */}
              <div className="space-y-3">
                <h4 className="font-semibold">Validation Status</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className={`p-3 rounded-lg border ${
                    selectedRecord.is_valid
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {selectedRecord.is_valid ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-xs font-medium">Overall</span>
                    </div>
                    <p className="text-sm font-semibold">
                      {selectedRecord.is_valid ? 'Valid' : 'Invalid'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-lg border ${
                    selectedRecord.is_within_time
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium">Time</span>
                    </div>
                    <p className="text-sm font-semibold">
                      {selectedRecord.is_within_time ? 'On Time' : 'Late'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-lg border ${
                    selectedRecord.is_within_location
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs font-medium">Location</span>
                    </div>
                    <p className="text-sm font-semibold">
                      {selectedRecord.is_within_location ? 'In Range' : 'Out of Range'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scan Information */}
              <div className="space-y-3">
                <h4 className="font-semibold">Scan Information</h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date & Time</p>
                      <p className="text-sm font-medium">
                        {formatDate(selectedRecord.scanned_at)} at {formatTime(selectedRecord.scanned_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Scan Location</p>
                      <p className="text-sm font-medium font-mono">
                        {selectedRecord.scan_location_lat.toFixed(6)}, {selectedRecord.scan_location_lng.toFixed(6)}
                      </p>
                      {selectedRecord.location_accuracy && (
                        <p className="text-xs text-muted-foreground">
                          Accuracy: ±{Math.round(selectedRecord.location_accuracy)}m
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedRecord.distance_from_session !== null && (
                    <div className="flex items-center gap-3">
                      <Navigation className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Distance from Session</p>
                        <p className="text-sm font-medium">
                          {Math.round(selectedRecord.distance_from_session)} meters
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Device Information */}
              <div className="space-y-3">
                <h4 className="font-semibold">Device Information</h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  {selectedRecord.ip_address && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">IP Address</p>
                        <p className="text-sm font-medium font-mono">{selectedRecord.ip_address}</p>
                      </div>
                    </div>
                  )}

                  {selectedRecord.device_info && (
                    <div className="flex items-start gap-3">
                      <Smartphone className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Device Details</p>
                        <div className="text-xs font-mono bg-background rounded p-2 space-y-1">
                          {selectedRecord.device_info.platform && (
                            <p>Platform: {selectedRecord.device_info.platform}</p>
                          )}
                          {selectedRecord.device_info.language && (
                            <p>Language: {selectedRecord.device_info.language}</p>
                          )}
                          {selectedRecord.device_info.screenResolution && (
                            <p>Screen: {selectedRecord.device_info.screenResolution}</p>
                          )}
                          {selectedRecord.device_info.timezone && (
                            <p>Timezone: {selectedRecord.device_info.timezone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedRecord.user_agent && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">User Agent</p>
                        <p className="text-xs font-mono bg-background rounded p-2 break-all">
                          {selectedRecord.user_agent}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Map Link */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                  View on Map
                </p>
                <a
                  href={`https://www.google.com/maps?q=${selectedRecord.scan_location_lat},${selectedRecord.scan_location_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Open in Google Maps →
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AttendanceRecordsViewer;
