import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Search,
  Laptop,
  Gamepad2,
  Presentation,
  Video,
  DollarSign,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Sparkles,
  Image as ImageIcon,
  Upload,
  Receipt
} from "@/components/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import EventGallery from "@/components/EventGallery";
import { isEventRegistrationAllowed } from "@/utils/adminSettingsManager";
import EventQRScanner from "@/components/events/EventQRScanner";

type Event = Tables<"events">;
type EventRegistration = {
  event_id: string;
  status: string | null;
  registered_at: string;
  payment_screenshot_url?: string | null;
  payment_status?: string | null;
  games_remaining?: number | null;
};

// View Registrations Dialog Component
const ViewRegistrationsDialog = ({ 
  event, 
  isOpen, 
  onClose, 
  onNavigateToAdmin 
}: { 
  event: Event; 
  isOpen: boolean; 
  onClose: () => void; 
  onNavigateToAdmin: () => void;
}) => {
  const { data: registrations, isLoading } = useQuery({
    queryKey: ["event-registrations-view", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("id, full_name, email, status, registered_at, registration_date")
        .eq("event_id", event.id)
        .order("registered_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            Manage Registrations
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-lg font-semibold mb-4">
            Total Registrations: {registrations?.length || 0}
          </p>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : registrations && registrations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-semibold">#</th>
                    <th className="text-left p-3 font-semibold">Name</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Registered At</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg, index) => (
                    <tr key={reg.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="p-3 text-muted-foreground">{index + 1}</td>
                      <td className="p-3 font-medium">{reg.full_name || reg.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          reg.status === 'registered' 
                            ? 'bg-green-500/20 text-green-400' 
                            : reg.status === 'cancelled'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {reg.status || 'pending'}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(reg.registered_at || reg.registration_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No registrations yet.
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border">
            <Button onClick={onNavigateToAdmin} className="w-full" size="lg">
              Go to Dashboard to Manage Registrations
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EventsRedesigned = () => {
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "past">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [selectedEventForGallery, setSelectedEventForGallery] = useState<{ id: string; title: string } | null>(null);
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const [viewRegistrationsDialogOpen, setViewRegistrationsDialogOpen] = useState(false);
  const [selectedEventForRegistrations, setSelectedEventForRegistrations] = useState<Event | null>(null);
  const [uploadingPaymentFor, setUploadingPaymentFor] = useState<string | null>(null);
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState<File | null>(null);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [scanningForEvent, setScanningForEvent] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Only students can register for events (all other roles are restricted)
  const canRegister = userProfile?.role === "student";

  const handleViewGallery = (event: Event) => {
    setSelectedEventForGallery({ id: event.id, title: event.title });
    setGalleryDialogOpen(true);
  };

  const handleViewRegistrations = (event: Event) => {
    setSelectedEventForRegistrations(event);
    setViewRegistrationsDialogOpen(true);
  };
  // Fetch events from Supabase
  const {
    data: events = [],
    isLoading,
    error: eventsError,
  } = useQuery<Event[]>({
    queryKey: ["events"],
    retry: 1,
    staleTime: 0, // Always fetch fresh data to show accurate registration counts
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
    queryFn: async (): Promise<Event[]> => {
      console.log("[Events] Fetching events with registration counts...");
      
      // First, fetch all events
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });
      
      if (eventsError) {
        console.error("[Events] Query error:", eventsError);
        throw eventsError;
      }
      
      // Then fetch registration counts for each event
      const eventsWithCounts = await Promise.all(
        (eventsData || []).map(async (event) => {
          // For paid events, count only paid registrations
          // For free events, count all registrations
          const query = supabase
            .from("event_registrations")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id);
          
          // Add payment status filter for paid events
          if (event.is_paid_event) {
            query.eq("payment_status", "paid");
          }
          
          const { count, error: countError } = await query;
          
          if (countError) {
            console.error(`[Events] Error counting registrations for event ${event.id}:`, countError);
          }
          
          return {
            ...event,
            current_participants: count || 0
          };
        })
      );
      
      console.log("[Events] Fetched", eventsWithCounts?.length, "events with registration counts");
      
      // Debug: Log image URLs to see what we're getting
      eventsWithCounts.forEach(event => {
        console.log(`Event "${event.title}" image_url:`, event.image_url);
      });
      
      return eventsWithCounts;
    },
  });

  const { data: registrations = [], isLoading: isLoadingRegistrations } = useQuery<EventRegistration[]>({
    queryKey: ["event-registrations", user?.id],
    enabled: !!user,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
    queryFn: async (): Promise<EventRegistration[]> => {
      if (!user) return [];

      console.log("[EventsRedesigned] Fetching registrations for user:", user.id);

      const { data, error } = await supabase
        .from("event_registrations")
        .select("event_id, status, registered_at, payment_screenshot_url, payment_status, games_remaining")
        .eq("user_id", user.id)
        .returns<EventRegistration[]>();

      if (error) {
        console.error("[EventsRedesigned] Error fetching registrations:", error);
        throw error;
      }

      console.log("[EventsRedesigned] Fetched registrations:", data);
      return data ?? [];
    },
  });

  const registerMutation = useMutation<void, Error, string>({
    mutationFn: async (eventId: string) => {
      if (!user) {
        throw new Error("You must be signed in to register for an event.");
      }

      // Check if user is a student (only students can register)
      if (!canRegister) {
        throw new Error("Only students can register for events.");
      }

      // Double-check if user is already registered (race condition protection)
      const { data: existingRegistration } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .single();

      if (existingRegistration) {
        throw new Error("You are already registered for this event.");
      }

      const targetEvent = events.find((evt) => evt.id === eventId);

      if (!targetEvent) {
        throw new Error("Unable to find that event.");
      }

      if (!targetEvent.is_registration_open) {
        throw new Error("Registration for this event is currently closed.");
      }

      const maxParticipants = targetEvent.max_participants ?? null;
      const currentParticipants = targetEvent.current_participants ?? 0;

      if (maxParticipants !== null && currentParticipants >= maxParticipants) {
        throw new Error("This event is already full.");
      }

      const payload = {
        event_id: eventId,
        user_id: user.id,
        full_name: userProfile?.full_name ?? user.email ?? "",
        email: user.email ?? null,
        phone: userProfile?.phone ?? null,
        additional_info: {
          source: "events_page",
        },
      };

      const { error } = await supabase.from("event_registrations").insert(payload);

      if (error) {
        // Handle duplicate key error specifically
        if (error.code === '23505' || error.message.includes('duplicate key')) {
          throw new Error("You are already registered for this event.");
        }
        throw new Error(error.message);
      }
    },
    onMutate: (eventId) => {
      setRegisteringEventId(eventId);
      
      // Optimistic update - immediately add to registrations for UI feedback
      queryClient.setQueryData(["event-registrations", user?.id], (oldData: EventRegistration[] | undefined) => {
        // Only add if not already registered (to prevent duplicates in UI)
        const isAlreadyRegistered = oldData?.some(reg => reg.event_id === eventId);
        if (isAlreadyRegistered) return oldData;
        
        const optimisticRegistration: EventRegistration = {
          event_id: eventId,
          status: "registered",
          registered_at: new Date().toISOString()
        };
        return oldData ? [...oldData, optimisticRegistration] : [optimisticRegistration];
      });
    },
    onSuccess: (_, eventId) => {
      // Immediately update the local state to show registered status
      queryClient.setQueryData(["event-registrations", user?.id], (oldData: EventRegistration[] | undefined) => {
        const newRegistration: EventRegistration = {
          event_id: eventId,
          status: "registered",
          registered_at: new Date().toISOString()
        };
        return oldData ? [...oldData, newRegistration] : [newRegistration];
      });
      
      // Then invalidate queries for fresh data
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event-registrations"] });
      
      toast({
        title: "Registration successful",
        description: "You're now registered for the event!",
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });
      // Remove register param from URL
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.delete("register");
      window.history.replaceState({}, '', `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`);
    },
    onError: (error, eventId) => {
      // Revert optimistic update on error
      queryClient.setQueryData(["event-registrations", user?.id], (oldData: EventRegistration[] | undefined) => {
        return oldData?.filter(reg => reg.event_id !== eventId) || [];
      });
      
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    },
    onSettled: () => {
      setRegisteringEventId(null);
    },
  });

  const userRegistrations = useMemo(() => {
    if (!registrations || registrations.length === 0) return new Set<string>();
    return new Set(registrations.map((registration) => registration.event_id));
  }, [registrations]);

  // Filter and categorize events
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    // Upcoming events: sorted by date (earliest first)
    const upcoming = events
      .filter(event => new Date(event.event_date) >= now)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    // Past events: sorted by date (newest first)
    const past = events
      .filter(event => new Date(event.event_date) < now)
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events]);

  // Apply search and filter
  const filteredEvents = useMemo(() => {
    let filtered = activeTab === "upcoming" ? upcomingEvents : 
                   activeTab === "past" ? pastEvents : 
                   [...upcomingEvents, ...pastEvents]; // Show upcoming first, then past
    
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [upcomingEvents, pastEvents, activeTab, searchTerm]);

  const { mutate: triggerRegistration, isPending: isRegistrationPending } = registerMutation;

  const handleRegisterClick = (eventId: string) => {
    // Prevent double-clicks during registration process
    if (registeringEventId === eventId && isRegistrationPending) {
      return;
    }

    // Check if event registration is enabled in admin settings
    const eventRegistrationAllowed = isEventRegistrationAllowed();

    if (!eventRegistrationAllowed) {
      toast({
        title: "Event Registration Closed",
        description: "Event registration is currently disabled by administrators.",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
      return;
    }

    if (!user) {
      navigate(`/register?redirect=${encodeURIComponent(`/events?register=${eventId}`)}`);
      return;
    }

    if (!canRegister) {
      toast({
        title: "Registration not allowed",
        description: "Only students can register for events.",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
      return;
    }

    if (userRegistrations.has(eventId)) {
      toast({
        title: "Already registered",
        description: "You have already registered for this event.",
        className: "bg-blue-600 border-blue-700 text-white shadow-xl backdrop-blur-md",
      });
      return;
    }

    triggerRegistration(eventId);
  };

  const handlePaymentScreenshotUpload = (eventId: string) => {
    // Check if screenshot already exists
    const registration = registrations.find(r => r.event_id === eventId);
    if (registration?.payment_screenshot_url) {
      toast({
        title: "Screenshot already uploaded",
        description: "You have already uploaded a payment screenshot. Please wait for admin approval.",
        className: "bg-yellow-600 border-yellow-700 text-white shadow-xl backdrop-blur-md",
      });
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploadingPaymentFor(eventId);
      setPaymentScreenshotFile(file);

      try {
        // Upload to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}_${eventId}_${Date.now()}.${fileExt}`;
        const filePath = `payment-screenshots/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('event-photos')
          .getPublicUrl(filePath);

        // Update registration with screenshot URL
        const { error: updateError } = await supabase
          .from('event_registrations')
          .update({ payment_screenshot_url: publicUrl })
          .eq('event_id', eventId)
          .eq('user_id', user?.id);

        if (updateError) throw updateError;

        // Refresh registrations
        queryClient.invalidateQueries({ queryKey: ["event-registrations"] });

        toast({
          title: "Payment screenshot uploaded",
          description: "Your payment screenshot has been uploaded successfully!",
          className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to upload payment screenshot",
          variant: "destructive",
          className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
        });
      } finally {
        setUploadingPaymentFor(null);
        setPaymentScreenshotFile(null);
      }
    };
    input.click();
  };

  useEffect(() => {
    if (!user || events.length === 0) return;

    const urlParams = new URLSearchParams(window.location.search);
    const pendingEventId = urlParams.get("register");

    if (!pendingEventId) return;

    if (userRegistrations.has(pendingEventId)) {
      // Remove from URL
      urlParams.delete("register");
      window.history.replaceState({}, '', `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`);
      return;
    }

    // Only allow students to auto-register
    if (!canRegister) {
      urlParams.delete("register");
      window.history.replaceState({}, '', `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`);
      toast({
        title: "Registration not allowed",
        description: "Only students can register for events.",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
      return;
    }

    const event = events.find((e) => e.id === pendingEventId);

    if (!event) {
      urlParams.delete("register");
      window.history.replaceState({}, '', `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`);
      return;
    }

    triggerRegistration(pendingEventId);
  }, [user, events, userRegistrations, canRegister, triggerRegistration, toast]);

  useEffect(() => {
    if (!eventsError) return;
    const message = eventsError instanceof Error ? eventsError.message : "An error occurred";
    toast({
      title: "Failed to fetch events",
      description: message,
      variant: "destructive",
      className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
    });
  }, [eventsError, toast]);

  const canViewRegistrations = false;

  // Ref for events grid scroll animation
  const eventsGridRef = useRef(null);
  const eventsGridInView = useInView(eventsGridRef, { once: true, margin: "-100px" });

  // Animation variants for event cards
  const eventsContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const eventCardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  // Event type icon mapping
  const getEventIcon = (type: string | null) => {
    switch(type) {
      case "workshop": return <Laptop className="w-5 h-5" />;
      case "seminar": return <Presentation className="w-5 h-5" />;
      case "competition": return <Gamepad2 className="w-5 h-5" />;
      case "meetup": return <Users className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  // Get placeholder image - uses custom default image for all event types
  const getPlaceholderImage = (eventType: string | null) => {
    // Use the custom default events cover image for all events
    // This can be changed later when someone updates the cover photo
    return "/default-events-cover-image.png";
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }),
      time: date.toLocaleString('default', { hour: '2-digit', minute: '2-digit' }),
      fullDate: date.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    };
  };

  return (
    <>
      <div className="min-h-screen relative z-10">
      {/* Hero Section with Gradient */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Discover <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Amazing Events</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
              Join us for exciting workshops, competitions, and networking events designed to advance your blockchain and Web3 knowledge.
            </p>

            {/* Tab Navigation */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap gap-3 justify-center mb-8"
            >
              <Button 
                onClick={() => setActiveTab("all")} 
                variant={activeTab === "all" ? "default" : "outline"}
                className={`gap-2 ${activeTab === "all" ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0" : ""}`}
              >
                All Events ({events?.length || 0})
              </Button>
              <Button 
                onClick={() => setActiveTab("upcoming")} 
                variant={activeTab === "upcoming" ? "default" : "outline"}
                className={`gap-2 ${activeTab === "upcoming" ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0" : ""}`}
              >
                <Calendar className="w-4 h-4" />
                Upcoming ({upcomingEvents.length})
              </Button>
              <Button 
                onClick={() => setActiveTab("past")} 
                variant={activeTab === "past" ? "default" : "outline"}
                className={`gap-2 ${activeTab === "past" ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0" : ""}`}
              >
                <Clock className="w-4 h-4" />
                Past Events ({pastEvents.length})
              </Button>
            </motion.div>

            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="max-w-2xl mx-auto mb-8 sm:mb-0"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300 z-10 pointer-events-none" />
                <Input 
                  placeholder="Search events by title, description, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-6 text-base bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-8 sm:py-12" ref={eventsGridRef}>
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-lg text-gray-200">Loading amazing events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <Calendar className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">No Events Found</h3>
              <p className="text-gray-300 mb-6">
                {searchTerm
                  ? "Try adjusting your search query." 
                  : "Check back soon for upcoming events!"}
              </p>
              {searchTerm && (
                <Button 
                  onClick={() => setSearchTerm("")}
                  variant="outline"
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
              variants={eventsContainerVariants}
              initial="hidden"
              animate={eventsGridInView ? "visible" : "hidden"}
            >
              {filteredEvents.map((event) => {
                const dateInfo = formatDate(event.event_date);
                const isUpcoming = new Date(event.event_date) >= new Date();
                const spotsLeft = event.max_participants
                  ? event.max_participants - (event.current_participants ?? 0)
                  : null;
                const isRegistered = user ? userRegistrations.has(event.id) : false;
                
                const isFull =
                  event.max_participants !== null &&
                  event.max_participants !== undefined &&
                  event.current_participants !== null &&
                  event.current_participants !== undefined &&
                  event.current_participants >= event.max_participants;
                // Only admin, core, co_head, and member can see registration counts
                // Students and undefined roles should never see counts
                const canSeeRegistrationCounts = userProfile?.role === "admin" || 
                                                   userProfile?.role === "core" || 
                                                   userProfile?.role === "co_head" || 
                                                   userProfile?.role === "member";
                
                // Ensure students never see any registration-related numbers
                const hideAllCounts = !canSeeRegistrationCounts;

                return (
                  <motion.div key={event.id} variants={eventCardVariants}>
                    <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-white/10 flex flex-col h-full">
                    {/* Event Image or Gradient */}
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={event.image_url || getPlaceholderImage(event.event_type)} 
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          console.error(`Failed to load image for event ${event.title}:`, event.image_url || 'default-events-cover-image.png');
                          // Hide the broken image and show gradient instead
                          e.currentTarget.style.display = 'none';
                          const gradientDiv = e.currentTarget.parentElement?.querySelector('.fallback-gradient') as HTMLElement;
                          if (gradientDiv) {
                            gradientDiv.style.display = 'flex';
                          }
                        }}
                        onLoad={(e) => {
                          // Hide loading placeholder when image loads successfully
                          const loadingDiv = e.currentTarget.parentElement?.querySelector('.loading-placeholder') as HTMLElement;
                          if (loadingDiv) {
                            loadingDiv.style.display = 'none';
                          }
                        }}
                      />
                      
                      {/* Loading placeholder */}
                      <div className="loading-placeholder absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 animate-pulse"></div>
                      
                      {/* Fallback gradient - shows only when image fails to load */}
                      <div 
                        className="fallback-gradient w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 group-hover:scale-110 transition-transform duration-500 items-center justify-center"
                        style={{ display: 'none' }}
                      >
                        <div className="text-center text-white/60">
                          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium">{event.title}</p>
                        </div>
                      </div>
                      
                      {/* Date Badge */}
                      <div className="absolute top-4 left-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-3 shadow-lg">
                        <div className="text-2xl font-bold leading-none">{dateInfo.day}</div>
                        <div className="text-xs uppercase font-semibold">{dateInfo.month}</div>
                        {/* Show year for past events */}
                        {!isUpcoming && (
                          <div className="text-[10px] font-semibold mt-1 border-t border-white/30 pt-1">
                            {new Date(event.event_date).getFullYear()}
                          </div>
                        )}
                      </div>

                      {/* Event Type Badge */}
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white backdrop-blur-sm gap-1.5 border-0">
                          {getEventIcon(event.event_type)}
                          {event.event_type}
                        </Badge>
                      </div>

                      {/* Registration Status */}
                      {isUpcoming && (
                        <div className="absolute bottom-4 right-4">
                          {event.is_registration_open ? (
                            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white backdrop-blur-sm gap-1 border-0">
                              <CheckCircle2 className="w-3 h-3" />
                              Open
                            </Badge>
                          ) : (
                            <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white backdrop-blur-sm gap-1 border-0">
                              <XCircle className="w-3 h-3" />
                              Closed
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <CardContent className="p-6 flex flex-col flex-1">
                      {/* Content that can grow */}
                      <div className="flex-1">
                        {/* Title */}
                        <h3 className="text-xl font-bold mb-2 text-white group-hover:text-primary transition-colors line-clamp-2">
                          {event.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                          {event.description}
                        </p>

                        {/* Event Details */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-white">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{dateInfo.time}</span>
                          </div>
                          
                          {event.location && (
                            <div className="flex items-center gap-2 text-sm text-white">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          )}

                          {canSeeRegistrationCounts && event.max_participants && (
                            <div className="flex items-center gap-2 text-sm text-white">
                              <Users className="w-4 h-4 text-primary" />
                              <span>
                                {event.current_participants || 0} / {event.max_participants} participants
                                {spotsLeft !== null && spotsLeft > 0 && (
                                  <span className="text-accent ml-1">({spotsLeft} spots left)</span>
                                )}
                              </span>
                            </div>
                          )}

                          {/* Registration Fee Display */}
                          {(() => {
                            const fee = event.payment_registration_fee || event.registration_fee;
                            return fee !== null && fee !== undefined && parseFloat(fee.toString()) > 0 ? (
                              <div className="flex items-center gap-2 text-sm text-white">
                                <DollarSign className="w-4 h-4 text-primary" />
                                <span>₹{fee}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 font-medium">Free</span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Tags */}
                        {event.tags && event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {event.tags.slice(0, 3).map((tag: string, index: number) => (
                              <Badge key={index} className="text-xs bg-primary/20 text-primary border border-primary/30">
                                {tag}
                              </Badge>
                            ))}
                            {event.tags.length > 3 && (
                              <Badge className="text-xs bg-primary/20 text-primary border border-primary/30">
                                +{event.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons - Always at bottom */}
                      <div className="flex gap-2 mt-auto">
                        {isUpcoming ? (
                          event.is_registration_open ? (
                            (userProfile?.role === "admin" || userProfile?.role === "core") ? (
                              <motion.div
                                className="flex-1"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  className="w-full"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewRegistrations(event)}
                                >
                                  <Users className="w-4 h-4 mr-2" />
                                  View Registrations
                                </Button>
                              </motion.div>
                            ) : (
                              <>
                                <motion.div
                                  className="flex-1"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    className="w-full"
                                    size="sm"
                                    onClick={() => handleRegisterClick(event.id)}
                                  disabled={
                                    isRegistered ||
                                    isFull ||
                                    (registeringEventId === event.id && isRegistrationPending)
                                  }
                                >
                                  {registeringEventId === event.id && isRegistrationPending ? (
                                    <span className="flex items-center gap-2">
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      Processing...
                                    </span>
                                  ) : isRegistered ? (
                                    <span className="flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4" />
                                      Registered
                                    </span>
                                  ) : isFull ? (
                                    "Event Full"
                                  ) : (
                                    "Register Now"
                                  )}
                                  </Button>
                                </motion.div>
                                {/* Payment Screenshot Upload / Play Games Button - Only for paid events and registered users */}
                                {isRegistered && event.is_paid_event && !isLoadingRegistrations && (
                                  <>
                                    {(() => {
                                      const registration = registrations.find(r => r.event_id === event.id);
                                      const isPaid = registration?.payment_status === 'paid';
                                      const gamesRemaining = registration?.games_remaining ?? 0;
                                      
                                      console.log(`[Event ${event.title}] Registration:`, registration);
                                      console.log(`[Event ${event.title}] isPaid:`, isPaid, 'gamesRemaining:', gamesRemaining);
                                      
                                      // If payment is approved and games remaining, show ONLY Play button
                                      if (isPaid && gamesRemaining > 0) {
                                        return (
                                          <motion.div
                                            className="flex-1"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <Button
                                              size="sm"
                                              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white gap-2"
                                              onClick={() => {
                                                setScanningForEvent(event.id);
                                                setQrScannerOpen(true);
                                              }}
                                            >
                                              <Gamepad2 className="w-4 h-4" />
                                              Play ({gamesRemaining})
                                            </Button>
                                          </motion.div>
                                        );
                                      }
                                      
                                      // If payment is approved but no games remaining, don't show any button
                                      if (isPaid && gamesRemaining === 0) {
                                        return null;
                                      }
                                      
                                      // Otherwise, show Upload Payment Screenshot button (only if not paid)
                                      if (!isPaid) {
                                        return (
                                          <motion.div
                                            className="flex-1"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <Button
                                              size="sm"
                                              className={`w-full gap-2 ${
                                                registration?.payment_screenshot_url 
                                                  ? "bg-green-50 border-2 border-green-500 text-green-700 hover:bg-green-100" 
                                                  : "bg-purple-600 hover:bg-purple-700 text-white"
                                              }`}
                                              variant={registration?.payment_screenshot_url ? "outline" : "default"}
                                              onClick={() => handlePaymentScreenshotUpload(event.id)}
                                              disabled={!!registration?.payment_screenshot_url || uploadingPaymentFor === event.id}
                                            >
                                              {uploadingPaymentFor === event.id ? (
                                                <>
                                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                  Uploading...
                                                </>
                                              ) : registration?.payment_screenshot_url ? (
                                                <>
                                                  <Receipt className="w-4 h-4" />
                                                  Payment Uploaded
                                                </>
                                              ) : (
                                                <>
                                                  <Upload className="w-4 h-4" />
                                                  Upload Payment
                                                </>
                                              )}
                                            </Button>
                                          </motion.div>
                                        );
                                      }
                                      
                                      return null;
                                    })()}
                                  </>
                                )}
                              </>
                            )
                          ) : (
                            <Button className="flex-1" size="sm" variant="outline" disabled>
                              Registration Closed
                            </Button>
                          )
                        ) : (
                          <motion.div
                            className="flex-1"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button 
                              className="w-full" 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewGallery(event)}
                            >
                              <ImageIcon className="w-4 h-4 mr-2" />
                              View Gallery
                            </Button>
                          </motion.div>
                        )}
                        
                        {event.event_link && (
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button size="sm" variant="ghost">
                              <a href={event.event_link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </motion.div>
                        )}
                      </div>

                    </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30 p-12 text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">
              Stay Updated with Our Events
            </h2>
            <p className="text-lg text-gray-200 mb-6 max-w-2xl mx-auto">
              Never miss an event! Follow us on social media or join our community to get notified about upcoming workshops, competitions, and seminars.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/register">Join Community</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>

    {/* Event Gallery Dialog */}
    {selectedEventForGallery && (
      <EventGallery
        eventId={selectedEventForGallery.id}
        eventTitle={selectedEventForGallery.title}
        isOpen={galleryDialogOpen}
        onClose={() => setGalleryDialogOpen(false)}
      />
    )}

    {/* View Registrations Dialog - Read-only for admins/core on public page */}
    {viewRegistrationsDialogOpen && selectedEventForRegistrations && (
      <ViewRegistrationsDialog
        event={selectedEventForRegistrations}
        isOpen={viewRegistrationsDialogOpen}
        onClose={() => setViewRegistrationsDialogOpen(false)}
        onNavigateToAdmin={() => {
          setViewRegistrationsDialogOpen(false);
          navigate('/admin');
        }}
      />
    )}

    {/* Event QR Scanner Dialog */}
    {qrScannerOpen && scanningForEvent && (
      <EventQRScanner
        isOpen={qrScannerOpen}
        onClose={() => {
          setQrScannerOpen(false);
          setScanningForEvent(null);
          // Redirect back to events page
          navigate('/events');
        }}
        eventId={scanningForEvent}
        onScanSuccess={(gamesRemaining) => {
          queryClient.invalidateQueries({ queryKey: ["event-registrations"] });
          console.log(`[EventsRedesigned] Scan successful, ${gamesRemaining} games remaining`);
        }}
      />
    )}

    </>
  );
};

export default EventsRedesigned;
