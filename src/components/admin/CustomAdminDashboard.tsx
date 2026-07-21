import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, UserPlus, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  max_participants?: number;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  created_at: string;
}

interface Registration {
  event_id: string;
  id: string;
  notes: string;
  payment_status: string;
  registration_date: string;
  status: string;
  user_id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  registered_at?: string;
  profiles?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
}

const CustomAdminDashboard = () => {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Check if user can view registrations (admin or core_member)
  const canViewRegistrations = user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'core_member';

  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      console.log('[CustomAdminDashboard] Fetching events...');
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error('[CustomAdminDashboard] Error fetching events:', error);
        throw error;
      }
      console.log('[CustomAdminDashboard] Fetched events:', data?.length || 0);
      return data as Event[];
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch profiles
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-users"], // Synchronized with UserManagement component
    queryFn: async () => {
      console.log('[CustomAdminDashboard] Fetching profiles...');
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error('[CustomAdminDashboard] Error fetching profiles:', error);
        throw error;
      }
      console.log('[CustomAdminDashboard] Fetched profiles:', data?.length || 0);
      return data as Profile[];
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });


  // Fetch registration details for selected event
  const { data: registrationDetails = [], isLoading: registrationDetailsLoading } = useQuery({
    queryKey: ["event-registrations", selectedEvent?.id],
    queryFn: async () => {
      if (!selectedEvent?.id) return [];
      
      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            phone
          )
        `)
        .eq("event_id", selectedEvent.id)
        .order("registration_date", { ascending: false });
      
      if (error) throw error;
      return data.map(reg => ({
        ...reg,
        full_name: reg.profiles?.full_name,
        email: reg.profiles?.email,
        phone: reg.profiles?.phone,
        registered_at: reg.registration_date
      })) as Registration[];
    },
    enabled: !!selectedEvent?.id && canViewRegistrations,
  });

  // Calculate stats
  const activeUsers = profiles.filter(p => p.created_at > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).length;
  const recentUsers = profiles.slice(0, 5);
  const upcomingEvents = events.filter(e => new Date(e.event_date) > new Date()).slice(0, 5);

  // Debug logging
  console.log('[CustomAdminDashboard] Stats calculated:', {
    totalProfiles: profiles.length,
    activeUsers,
    recentUsersCount: recentUsers.length,
    upcomingEventsCount: upcomingEvents.length
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'core': return 'default';
      case 'co_head': return 'secondary';
      case 'member': return 'outline';
      case 'student': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'core': return 'Core Team';
      case 'co_head': return 'Co-Head';
      case 'member': return 'Member';
      case 'student': return 'Student';
      default: return 'Unknown';
    }
  };

  const handleDownloadExcel = async () => {
    if (!registrationDetails.length) return;

    try {
      // Dynamically import xlsx to avoid bundle size issues
      const XLSX = await import('xlsx');
      
      // Prepare data for Excel
      const excelData = registrationDetails.map(reg => ({
        'Full Name': reg.full_name || 'Unknown',
        'Email': reg.email || '',
        'Phone': reg.phone || '',
        'Status': reg.status || 'registered',
        'Payment Status': reg.payment_status || 'pending',
        'Registered At': new Date(reg.registration_date).toLocaleString(),
        'Registration Date': new Date(reg.registration_date).toLocaleDateString(),
        'Registration Time': new Date(reg.registration_date).toLocaleTimeString()
      }));

      // Create workbook and worksheet with clean data only
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths for better readability
      const columnWidths = [
        { wch: 20 }, // Full Name
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 12 }, // Status
        { wch: 15 }, // Payment Status
        { wch: 20 }, // Registered At
        { wch: 15 }, // Registration Date
        { wch: 15 }  // Registration Time
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

      // Generate Excel file and download
      const fileName = `${selectedEvent?.title || 'event'}-registrations.xlsx`;
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('Excel export error:', error);
      // Show error message if Excel export fails
      alert('Failed to export Excel file. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Dashboard Header */}
      <div>
        <h2 className="text-3xl sm:text-4xl font-bold">Admin Dashboard Overview</h2>
        <p className="text-base sm:text-lg text-muted-foreground mt-2">Real-time insights and statistics for managing your BLOTIC community</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventsLoading ? "..." : events?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+8%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profilesLoading ? "..." : activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+5%</span> from last month
              </p>
            </CardContent>
          </Card>

        </div>


      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest registered members</CardDescription>
          </CardHeader>
          <CardContent>
            {profilesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recentUsers.length > 0 ? (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage 
                        src={user.avatar_url || ""} 
                        className="object-cover w-full h-full"
                      />
                      <AvatarFallback>
                        {user.full_name?.split(" ").map(n => n[0]).join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.full_name || "Unknown User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Scheduled events and workshops</CardDescription>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{event.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(event.event_date), "MMM dd, yyyy")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.event_date), "HH:mm")}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location || "TBD"}
                      </div>
                    </div>
                    {canViewRegistrations && (
                      <div className="flex justify-end mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                        >
                          View registrations
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No upcoming events</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <DialogHeader>
          <DialogTitle>
            Registrations – {selectedEvent?.title ?? "Event"}
          </DialogTitle>
          <DialogDescription>
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-md max-h-80 overflow-y-auto">
          {registrationDetailsLoading ? (
            <div className="p-6 text-center text-muted-foreground">Loading registrations…</div>
          ) : registrationDetails.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No registrations yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="px-4 py-2">Full Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Phone</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Payment</th>
                  <th className="px-4 py-2">Registered At</th>
                </tr>
              </thead>
              <tbody>
                {registrationDetails.map((registration, index) => (
                  <tr key={`${registration.event_id}-${registration.email ?? index}-${registration.registration_date}`} className="border-t">
                    <td className="px-4 py-2 whitespace-nowrap">{registration.full_name ?? "Unknown"}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{registration.email ?? "—"}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{registration.phone ?? "—"}</td>
                    <td className="px-4 py-2 whitespace-nowrap capitalize">{registration.status ?? "registered"}</td>
                    <td className="px-4 py-2 whitespace-nowrap capitalize">{registration.payment_status ?? "pending"}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{new Date(registration.registration_date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            {selectedEvent?.max_participants == null
              ? "Unlimited capacity"
              : `${registrationDetails.length}/${selectedEvent?.max_participants ?? 0} registrations`}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setSelectedEvent(null)} 
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Close
            </Button>
            <Button 
              onClick={handleDownloadExcel} 
              disabled={!registrationDetails || registrationDetails.length === 0}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white order-1 sm:order-2"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </motion.div>
  );
};

export default CustomAdminDashboard;