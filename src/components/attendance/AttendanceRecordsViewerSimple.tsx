import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Download, Clock, MapPin, Eye, Mail, User, Calendar, Trash2, Search, X } from "lucide-react";
import { format } from "date-fns";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, lazy, Suspense, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { highlightText } from "@/utils/highlightText";

// Lazy load the map component
const LocationMap = lazy(() => import('./LocationMap'));

interface AttendanceRecord {
  id: string;
  session_id: string;
  user_id: string;
  scanned_at: string;
  scan_location_lat?: number;
  scan_location_lng?: number;
  location_accuracy?: number;
  profiles: {
    id: string;
    full_name?: string;
    email: string;
    avatar_url?: string;
    phone?: string;
    branch?: string;
    year?: number;
    role?: string;
    department?: string;
    bio?: string;
    github_url?: string;
    linkedin_url?: string;
    instagram_url?: string;
    whatsapp_url?: string;
  };
}

interface AttendanceRecordsViewerSimpleProps {
  sessionId: string;
  sessionName: string;
}

const AttendanceRecordsViewerSimple = ({ sessionId, sessionName }: AttendanceRecordsViewerSimpleProps) => {
  const { isSuperAdmin, hasRole } = useRoleCheck();
  const navigate = useNavigate();
  const isAdmin = isSuperAdmin() || hasRole("admin");
  const isCore = hasRole("core");
  const canView = isAdmin || isCore; // Both admin and core can view
  const canDelete = isAdmin; // Only admin can delete
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getLocationName = (lat: number, lng: number) => {
    if (!lat || !lng || (lat === 0 && lng === 0)) return "Location not available";
    // You can integrate with a reverse geocoding API here
    // For now, showing coordinates in a readable format
    return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
  };

  const handleViewProfile = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setShowProfileDialog(true);
  };

  // Remove attendance record mutation
  const removeRecordMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', recordId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-records", sessionId] });
      toast({
        title: "Record Removed",
        description: "Attendance record has been successfully removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove attendance record. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveRecord = (recordId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to remove ${userName}'s attendance record?`)) {
      removeRecordMutation.mutate(recordId);
    }
  };


  const { data: allRecords, isLoading } = useQuery({
    queryKey: ["attendance-records", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          profiles:user_id (*)
        `)
        .eq('session_id', sessionId)
        .order('scanned_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Filter records based on search query
  const records = useMemo(() => {
    if (!searchQuery.trim() || !allRecords) return allRecords;
    
    const query = searchQuery.toLowerCase().trim();
    return allRecords.filter(record => {
      const fullName = (record.profiles?.full_name || '').toLowerCase();
      const email = (record.profiles?.email || '').toLowerCase();
      const phone = (record.profiles?.phone || '').toLowerCase();
      const year = (record.profiles?.year || '').toString();
      
      return fullName.includes(query) || 
             email.includes(query) || 
             phone.includes(query) || 
             year.includes(query);
    });
  }, [allRecords, searchQuery]);

  const handleDownloadExcel = async () => {
    if (!records || records.length === 0) return;

    try {
      // Dynamically import xlsx only when export is triggered (lazy loading)
      const XLSX = await import('xlsx');

      // Prepare data for Excel
      const excelData = records.map((record, index) => ({
        'S.No': index + 1,
        'Name': record.profiles?.full_name || 'N/A',
        'Email': record.profiles?.email || 'N/A',
        'Phone': record.profiles?.phone || 'N/A',
        'Year': record.profiles?.year || 'N/A',
        'Attendance Time': format(new Date(record.scanned_at), 'MMM dd, yyyy HH:mm:ss'),
        'Latitude': record.scan_location_lat || 'N/A',
        'Longitude': record.scan_location_lng || 'N/A',
        'Location Accuracy (m)': record.location_accuracy ? `±${record.location_accuracy.toFixed(0)}m` : 'N/A'
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths for better readability
      const colWidths = [
        { wch: 8 },   // S.No
        { wch: 20 },  // Name
        { wch: 25 },  // Email
        { wch: 15 },  // Phone
        { wch: 8 },   // Year
        { wch: 20 },  // Attendance Time
        { wch: 12 },  // Latitude
        { wch: 12 },  // Longitude
        { wch: 18 }   // Location Accuracy
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance Records');

      // Generate filename
      const fileName = `attendance-${sessionName.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

      // Download the file
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export attendance records. Please try again.",
        variant: "destructive",
      });
    }
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
    <div className="min-h-screen bg-background text-foreground p-3 sm:p-6">
      {/* Header Section */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Attendance Records
          </h1>
          <p className="text-muted-foreground text-sm">
            Viewing attendance for {sessionName}
          </p>
        </div>

        {/* Stats Section */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {records?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Users Registered
              </div>
            </div>

            {records && records.length > 0 && (
              <Button
                onClick={handleDownloadExcel}
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, phone, or year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 focus:border-cyan-500 focus:ring-cyan-500"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Search Results Info */}
          {searchQuery && (
            <div className="text-sm text-muted-foreground">
              Showing {records?.length || 0} of {allRecords?.length || 0} records
            </div>
          )}
        </div>
      </div>

      {/* Records Section */}
      <div className="max-w-4xl mx-auto">
        {!records || records.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-card border border-border rounded-xl p-8 max-w-md mx-auto">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">No Attendance Yet</h3>
              <p className="text-sm text-muted-foreground">
                Attendance records will appear here once members mark their attendance
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record, index) => (
              <motion.div
                key={record.id}
                className="bg-card border border-border rounded-xl p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* User Info Row */}
                <div className="flex items-center gap-4 mb-3">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={record.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-foreground font-semibold">
                      {record.profiles?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {highlightText(record.profiles?.full_name || 'Unknown User', searchQuery)}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        Present
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {highlightText(record.profiles?.email || 'No email', searchQuery)}
                    </p>
                  </div>
                </div>

                {/* Details Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span className="text-xs">Time:</span>
                      <span className="font-medium">
                        {format(new Date(record.scanned_at), 'HH:mm:ss')}
                      </span>
                    </div>
                    
                    {record.profiles?.year && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span className="text-xs">Year:</span>
                        <span className="font-medium">{record.profiles.year}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {canView && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        onClick={() => handleViewProfile(record)}
                        variant="outline"
                        size="default"
                        className="gap-2 h-10 flex-1 sm:flex-initial"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">View</span>
                      </Button>
                      {canDelete && (
                        <Button
                          onClick={() => handleRemoveRecord(record.id, record.profiles?.full_name || 'Unknown User')}
                          variant="outline"
                          size="default"
                          className="gap-2 h-10 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 flex-1 sm:flex-initial"
                          disabled={removeRecordMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm">Remove</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Detail Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden [&>button]:text-red-500 [&>button]:hover:text-red-600 [&>button]:hover:bg-red-100 [&>button]:dark:hover:bg-red-950">
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
          </DialogHeader>

          {selectedRecord && selectedRecord.profiles && (
            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 mt-4">
              {/* Column 1: Profile */}
              <div className="space-y-4">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    {/* Mobile: Centered layout */}
                    <div className="flex flex-col items-center text-center lg:hidden">
                      <Avatar className="h-24 w-24 mb-2 border-2 border-primary/20">
                        <AvatarImage 
                          src={selectedRecord.profiles.avatar_url || undefined} 
                          className="object-cover w-full h-full"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                          {selectedRecord.profiles.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl mb-1">
                        {selectedRecord.profiles.full_name || 'Unknown User'}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {selectedRecord.profiles.role ? (
                          <Badge variant="secondary" className="text-sm capitalize">
                            {selectedRecord.profiles.role.replace('_', ' ')}
                          </Badge>
                        ) : null}
                      </CardDescription>
                    </div>
                    
                    {/* Desktop: Horizontal layout */}
                    <div className="hidden lg:flex lg:items-center lg:gap-4">
                      <Avatar className="h-20 w-20 border-2 border-primary/20 flex-shrink-0">
                        <AvatarImage 
                          src={selectedRecord.profiles.avatar_url || undefined} 
                          className="object-cover w-full h-full"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                          {selectedRecord.profiles.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">
                          {selectedRecord.profiles.full_name || 'Unknown User'}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {selectedRecord.profiles.role ? (
                            <Badge variant="secondary" className="text-sm capitalize">
                              {selectedRecord.profiles.role.replace('_', ' ')}
                            </Badge>
                          ) : null}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* Email */}
                    {selectedRecord.profiles.email && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground mb-0.5">Email</p>
                          <p className="text-base font-medium break-all">{selectedRecord.profiles.email}</p>
                        </div>
                      </div>
                    )}

                    {/* Phone */}
                    {selectedRecord.profiles.phone && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground mb-0.5">Phone</p>
                          <p className="text-base font-medium">{selectedRecord.profiles.phone}</p>
                        </div>
                      </div>
                    )}

                    {/* Department */}
                    {selectedRecord.profiles.department && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground mb-0.5">Department</p>
                          <p className="text-base font-medium">{selectedRecord.profiles.department}</p>
                        </div>
                      </div>
                    )}

                    {/* Year */}
                    {selectedRecord.profiles.year && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground mb-0.5">Year</p>
                          <p className="text-base font-medium">{selectedRecord.profiles.year}</p>
                        </div>
                      </div>
                    )}

                    {/* Bio */}
                    {selectedRecord.profiles.bio && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground mb-0.5">Bio</p>
                          <p className="text-sm text-muted-foreground">{selectedRecord.profiles.bio}</p>
                        </div>
                      </div>
                    )}

                    {/* Social Media Links */}
                    {(selectedRecord.profiles.github_url || selectedRecord.profiles.linkedin_url || selectedRecord.profiles.instagram_url || selectedRecord.profiles.whatsapp_url) && (
                      <div className="pt-4 border-t border-border/50">
                        <p className="text-sm text-muted-foreground mb-3 text-center">Connect with me</p>
                        <div className="flex justify-center gap-4">
                          {selectedRecord.profiles.github_url && (
                            <a 
                              href={selectedRecord.profiles.github_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-center group"
                              title="GitHub"
                            >
                              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                              </svg>
                            </a>
                          )}
                          
                          {selectedRecord.profiles.linkedin_url && (
                            <a 
                              href={selectedRecord.profiles.linkedin_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center group"
                              title="LinkedIn"
                            >
                              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                            </a>
                          )}
                          
                          {selectedRecord.profiles.instagram_url && (
                            <a 
                              href={selectedRecord.profiles.instagram_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center justify-center group"
                              title="Instagram"
                            >
                              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                            </a>
                          )}

                          {selectedRecord.profiles.whatsapp_url && (
                            <a 
                              href={selectedRecord.profiles.whatsapp_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center group"
                              title="WhatsApp"
                            >
                              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Column 2: Maps & Location */}
              <div className="space-y-4">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <MapPin className="w-5 h-5" />
                      Location Map
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Attendance marked from this location
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedRecord.scan_location_lat !== 0 && selectedRecord.scan_location_lng !== 0 ? (
                      <>
                        <div className="relative w-full h-[300px] rounded-lg overflow-hidden border">
                          <Suspense fallback={
                            <div className="w-full h-[300px] bg-muted rounded-lg flex items-center justify-center">
                              <div className="text-center">
                                <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Loading map...</p>
                              </div>
                            </div>
                          }>
                            <LocationMap
                              latitude={selectedRecord.scan_location_lat}
                              longitude={selectedRecord.scan_location_lng}
                              accuracy={selectedRecord.location_accuracy || 50}
                              title={`${selectedRecord.profiles?.full_name || 'User'}'s Attendance Location`}
                              height="300px"
                            />
                          </Suspense>
                          
                          {/* Open in Google Maps button */}
                          <div className="absolute bottom-4 left-4 right-4">
                            <Button
                              onClick={() => window.open(
                                `https://www.google.com/maps?q=${selectedRecord.scan_location_lat},${selectedRecord.scan_location_lng}`,
                                '_blank'
                              )}
                              variant="secondary"
                              className="w-full gap-2 bg-white/90 hover:bg-white/95 backdrop-blur-sm"
                            >
                              <MapPin className="w-4 h-4" />
                              Open in Google Maps
                            </Button>
                          </div>
                        </div>

                        {/* Location Info */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                          <MapPin className="w-5 h-5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Location</p>
                            <p className="font-medium">
                              {getLocationName(selectedRecord.scan_location_lat, selectedRecord.scan_location_lng)}
                            </p>
                            {selectedRecord.location_accuracy && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Accuracy: ±{selectedRecord.location_accuracy.toFixed(0)}m
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col items-center justify-center h-[300px] text-center p-8 bg-muted rounded-lg">
                          <MapPin className="w-16 h-16 text-muted-foreground mb-4" />
                          <p className="text-lg font-medium mb-2">Location Not Available</p>
                          <p className="text-sm text-muted-foreground">
                            This attendance was marked without location data
                          </p>
                        </div>

                        {/* Location Info - Not Available */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                          <MapPin className="w-5 h-5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Location</p>
                            <p className="font-medium">Location not available</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              📍 Location tracking is optional. Attendance can be marked without GPS data.
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceRecordsViewerSimple;
