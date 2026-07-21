import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/utils/animations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useUploadProgressContext } from "@/contexts/UploadProgressContext";
import { Plus, Trash2, Calendar, MapPin, Eye, Edit, Upload, X, Users, FileSpreadsheet, Check, Pencil, History, Image as ImageIcon, User, Instagram, Linkedin, MessageCircle, GraduationCap, Building2, BookOpen, Mail, Send, RefreshCw, Search, DollarSign, Receipt, QrCode, Loader2, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import EventGalleryManagement from "./EventGalleryManagement";
import { highlightText } from "@/utils/highlightText";
import { QRCodeSVG } from 'qrcode.react';

// Function to create event folder in storage
const createEventFolder = async (eventTitle: string) => {
  try {
    const cleanEventTitle = eventTitle
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    console.log("[EventFolder] Creating folder for event:", cleanEventTitle);
    
    // Check available buckets first
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log("[EventFolder] Available buckets:", buckets);
    
    if (bucketsError) {
      console.error("[EventFolder] Error listing buckets:", bucketsError);
      return false;
    }

    // Try to create folder by uploading a placeholder file
    const folderPath = `${cleanEventTitle}/.placeholder`;
    const { error: folderError } = await supabase.storage
      .from('event-photos')
      .upload(folderPath, new Blob(['Event folder created automatically'], { type: 'text/plain' }), { upsert: true });
    
    if (folderError) {
      console.error("[EventFolder] Folder creation error:", folderError);
      return false;
    }
    
    console.log("[EventFolder] Successfully created folder:", cleanEventTitle);
    return true;
  } catch (error) {
    console.error("[EventFolder] Failed to create folder:", error);
    return false;
  }
};

const EventManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isSuperAdmin, isCore } = useRoleCheck();
  const { addUpload, updateUpload } = useUploadProgressContext();
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "past">("all");
  const [isAdding, setIsAdding] = useState(false);
  const [isPaidEvent, setIsPaidEvent] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [sendEmailNotification, setSendEmailNotification] = useState(false);
  
  // Test Email Dialog state
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testEmailSent, setTestEmailSent] = useState(false);
  const [selectedEventForEmail, setSelectedEventForEmail] = useState<any>(null);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  
  // Past events state
  const [isAddingPastEvents, setIsAddingPastEvents] = useState(false);
  
  // Gallery state
  const [selectedEventForGallery, setSelectedEventForGallery] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<{
    id: string;
    title: string;
    description?: string;
    event_type?: string;
    event_date: string;
    location?: string;
    is_paid_event?: boolean;
    max_participants?: number;
    is_registration_open?: boolean;
    image_url?: string;
    registration_fee?: number;
    number_of_games?: number;
    payment_registration_fee?: number;
  } | null>(null);
  const [editIsPaidEvent, setEditIsPaidEvent] = useState(false);
  const [editIsRegistrationOpen, setEditIsRegistrationOpen] = useState(true);
  const [editSelectedEventType, setEditSelectedEventType] = useState<string>("");
  const [editSendEmailNotification, setEditSendEmailNotification] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Registration viewing state
  const [selectedEventForRegistrations, setSelectedEventForRegistrations] = useState<{
    id: string;
    title: string;
    max_participants?: number;
  } | null>(null);
  const [registrationsDialogOpen, setRegistrationsDialogOpen] = useState(false);
  
  // Edit payment status state
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPaymentStatus, setEditPaymentStatus] = useState<string>("");

  // Profile viewing state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Search state for registrations
  const [registrationSearchQuery, setRegistrationSearchQuery] = useState("");

  // Payment screenshot viewing state
  const [viewingPaymentScreenshot, setViewingPaymentScreenshot] = useState<string | null>(null);
  const [paymentScreenshotDialogOpen, setPaymentScreenshotDialogOpen] = useState(false);

  // QR code generation state
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [selectedEventForQR, setSelectedEventForQR] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [generatingQR, setGeneratingQR] = useState(false);
  const [downloadingQR, setDownloadingQR] = useState(false);

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      console.log("[EventManagement] Fetching events with registration counts...");
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          current_participants:event_registrations(count)
        `)
        .order("event_date", { ascending: true });
      if (error) throw error;
      
      // Transform the data to include current_participants as a number
      const eventsWithCounts = data?.map(event => ({
        ...event,
        current_participants: Array.isArray(event.current_participants) 
          ? event.current_participants[0]?.count || 0 
          : event.current_participants || 0
      })) || [];
      
      // Automatically create folders for past events
      if (eventsWithCounts) {
        const now = new Date();
        const pastEvents = eventsWithCounts.filter(event => new Date(event.event_date) < now);
        
        // Create folders for past events asynchronously
        pastEvents.forEach(async (event) => {
          try {
            await createEventFolder(event.title);
          } catch (error) {
            console.error(`[EventManagement] Failed to create folder for ${event.title}:`, error);
          }
        });
      }
      
      console.log("[EventManagement] Fetched", eventsWithCounts?.length, "events with registration counts");
      return eventsWithCounts;
    },
  });

  // Filter events by category
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    
    const now = new Date();
    
    switch (activeTab) {
      case "upcoming":
        // Sort upcoming events by date (earliest first)
        return events
          .filter(event => new Date(event.event_date) >= now)
          .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
      case "past":
        // Sort past events by date (most recent first)
        return events
          .filter(event => new Date(event.event_date) < now)
          .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
      default: {
        // For "all" events: show upcoming first (sorted earliest first), then past events (sorted most recent first)
        const upcoming = events
          .filter(event => new Date(event.event_date) >= now)
          .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
        const past = events
          .filter(event => new Date(event.event_date) < now)
          .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
        return [...upcoming, ...past];
      }
    }
  }, [events, activeTab]);

  // Check if user can view registrations (admin or core)
  const canViewRegistrations = isSuperAdmin() || isCore();

  // Fetch complete profile data for selected user
  const { data: selectedUserProfile } = useQuery({
    queryKey: ["user-profile", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", selectedUserId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUserId && canViewRegistrations,
  });

  // Delete registration mutation
  const deleteRegistrationMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("id", registrationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-registrations", selectedEventForRegistrations?.id] });
      toast({
        title: "Success",
        description: "Registration deleted successfully",
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete registration",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    },
  });

  // Update payment status mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ registrationId, paymentStatus }: { registrationId: string; paymentStatus: string }) => {
      const { error } = await supabase
        .from("event_registrations")
        .update({ payment_status: paymentStatus })
        .eq("id", registrationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-registrations", selectedEventForRegistrations?.id] });
      setEditingPaymentId(null);
      setEditPaymentStatus("");
      toast({
        title: "Success",
        description: "Payment status updated successfully",
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment status",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    },
  });

  // Fetch registration details for selected event with real-time polling
  const { data: allRegistrationDetails = [], isLoading: registrationDetailsLoading, refetch: refetchRegistrations } = useQuery({
    queryKey: ["event-registrations", selectedEventForRegistrations?.id],
    queryFn: async () => {
      if (!selectedEventForRegistrations?.id) return [];
      
      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            phone,
            avatar_url,
            year,
            branch
          )
        `)
        .eq("event_id", selectedEventForRegistrations.id)
        .order("registration_date", { ascending: false });
      
      if (error) throw error;
      return data.map(reg => ({
        ...reg,
        full_name: reg.profiles?.full_name || reg.full_name,
        email: reg.profiles?.email || reg.email,
        phone: reg.profiles?.phone || reg.phone,
        avatar_url: reg.profiles?.avatar_url,
        year: reg.profiles?.year || reg.year,
        branch: reg.profiles?.branch || reg.branch,
        registered_at: reg.registration_date
      }));
    },
    enabled: !!selectedEventForRegistrations?.id && canViewRegistrations,
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true, // Continue polling even when tab is not focused
  });

  // Filter registrations based on search query (name, email, phone)
  const registrationDetails = useMemo(() => {
    if (!registrationSearchQuery.trim()) return allRegistrationDetails;
    
    const query = registrationSearchQuery.toLowerCase().trim();
    return allRegistrationDetails.filter(reg => {
      const fullName = (reg.full_name || '').toLowerCase();
      const email = (reg.email || '').toLowerCase();
      const phone = (reg.phone || '').toLowerCase();
      
      return fullName.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [allRegistrationDetails, registrationSearchQuery]);

  const addMutation = useMutation({
    mutationFn: async (newEvent: {
      title: string;
      description?: string;
      event_type?: string;
      event_date: string;
      location?: string;
      is_virtual?: boolean;
      max_participants?: number;
      is_registration_open?: boolean;
      send_email_notification?: boolean;
      created_by?: string;
    }) => {
      console.log('[EventManagement] Creating event:', newEvent);
      const { data, error } = await supabase.from("events").insert([newEvent]).select();
      if (error) {
        console.error('[EventManagement] Database error:', error);
        throw error;
      }
      console.log('[EventManagement] Event created:', data);
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      
      const createdEvent = data?.[0];
      
      // If email notification is enabled and user is admin, auto-approve and send
      if (createdEvent && sendEmailNotification && isSuperAdmin()) {
        try {
          // First, approve the email in the database
          const { error: approveError } = await supabase
            .from("events")
            .update({
              email_approved_by_admin: true,
              email_approved_at: new Date().toISOString(),
              email_approved_by: user?.id,
            })
            .eq("id", createdEvent.id);
          
          if (approveError) throw approveError;
          
          // Wait a bit for the database to update
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Then send the email via edge function
          const { data: emailData, error: emailError } = await supabase.functions.invoke('send-event-notification', {
            body: { eventId: createdEvent.id },
          });
          
          if (emailError) throw emailError;
          
          queryClient.invalidateQueries({ queryKey: ["events"] });
          
          toast({ 
            title: "Success", 
            description: `Event created and email sent to ${emailData?.stats?.success || 0} students!`,
            className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
          });
        } catch (error: any) {
          console.error('Error sending email notification:', error);
          toast({ 
            title: "Event Created", 
            description: `Event created but failed to send emails: ${error.message || 'Unknown error'}. You can send them manually.`,
            className: "bg-yellow-600 border-yellow-700 text-white shadow-xl backdrop-blur-md",
          });
        }
      } else if (createdEvent && sendEmailNotification) {
        // For non-admin users, just show that admin approval is needed
        toast({ 
          title: "Success", 
          description: "Event created! Email notification pending admin approval.",
          className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
        });
      } else {
        toast({ 
          title: "Success", 
          description: "Event added successfully",
          className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
        });
      }
      
      setIsAdding(false);
      // Reset form state
      setIsPaidEvent(false);
      setIsRegistrationOpen(true);
      setSelectedEventType("");
      setSendEmailNotification(false);
    },
    onError: (error) => {
      console.error('[EventManagement] Mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to create event: ${error.message}`,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('[EventManagement] Deleting event:', id);
      
      // First, get the event to find its title for folder name
      const { data: event, error: fetchError } = await supabase
        .from("events")
        .select("title")
        .eq("id", id)
        .single();
      
      if (fetchError) {
        console.error('[EventManagement] Error fetching event:', fetchError);
        throw fetchError;
      }
      
      // Delete all files in the event's folder from storage
      if (event?.title) {
        const cleanEventTitle = event.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 50);
        
        console.log('[EventManagement] Deleting files from folder:', cleanEventTitle);
        
        // List all files in the event folder
        const { data: files, error: listError } = await supabase.storage
          .from('event-photos')
          .list(cleanEventTitle);
        
        if (listError) {
          console.error('[EventManagement] Error listing files:', listError);
        } else if (files && files.length > 0) {
          // Delete all files in the folder
          const filePaths = files.map(file => `${cleanEventTitle}/${file.name}`);
          const { error: deleteFilesError } = await supabase.storage
            .from('event-photos')
            .remove(filePaths);
          
          if (deleteFilesError) {
            console.error('[EventManagement] Error deleting files:', deleteFilesError);
          } else {
            console.log('[EventManagement] Successfully deleted', files.length, 'files');
          }
        }
      }
      
      // Delete the event from database
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) {
        console.error('[EventManagement] Delete error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ 
        title: "Success", 
        description: "Event deleted successfully",
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });
    },
    onError: (error) => {
      console.error('[EventManagement] Delete mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to delete event: ${error.message}`,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    },
  });

  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, eventData }: { 
      id: string; 
      eventData: {
        title: string;
        description?: string | null;
        event_type?: string | null;
        event_date: string;
        location?: string | null;
        is_virtual?: boolean;
        max_participants?: number | null;
        registration_fee?: number | null;
        tags?: string[] | null;
        is_registration_open?: boolean;
      }
    }) => {
      console.log('[EventManagement] Updating event:', id, eventData);
      const { data, error } = await supabase
        .from("events")
        .update(eventData)
        .eq("id", id)
        .select();
      if (error) {
        console.error('[EventManagement] Update error:', error);
        throw error;
      }
      console.log('[EventManagement] Event updated:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ 
        title: "Success", 
        description: "Event updated successfully",
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });
      setIsEditing(false);
      setEditingEvent(null);
      // Reset edit form state
      setEditIsPaidEvent(false);
      setEditIsRegistrationOpen(true);
      setEditSelectedEventType("");
    },
    onError: (error) => {
      console.error('[EventManagement] Update mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to update event: ${error.message}`,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    },
  });

  // Approve email notification mutation (Admin only)
  const approveEmailMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { data, error } = await supabase
        .from("events")
        .update({
          email_approved_by_admin: true,
          email_approved_at: new Date().toISOString(),
          email_approved_by: user?.id,
        })
        .eq("id", eventId)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Success",
        description: "Email notification approved. Sending emails to students...",
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to approve email: ${error.message}`,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    },
  });

  // Send email notification mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { data, error } = await supabase.functions.invoke('send-event-notification', {
        body: { eventId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Success",
        description: `Email sent to ${data?.stats?.success || 0} students successfully!`,
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send emails: ${error.message}`,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    },
  });

  // Send test email mutation
  const sendTestEmailMutation = useMutation({
    mutationFn: async ({ eventId, testEmail }: { eventId: string; testEmail: string }) => {
      try {
        const { data, error } = await supabase.functions.invoke('send-test-event-email', {
          body: { eventId, testEmail },
        });
        
        if (error) {
          console.error('Edge Function error:', error);
          throw new Error(error.message || 'Failed to send test email');
        }
        
        return data;
      } catch (err: any) {
        console.error('Test email error:', err);
        throw new Error(err.message || 'Failed to send test email. Please ensure the Edge Function is deployed.');
      }
    },
    onSuccess: () => {
      setTestEmailSent(true);
      toast({
        title: "Success",
        description: "Test email sent successfully! Check your inbox.",
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send test email: ${error.message}`,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    },
  });

  // Handle test email dialog open
  const handleOpenTestEmailDialog = (event: any) => {
    setSelectedEventForEmail(event);
    setTestEmailDialogOpen(true);
    setTestEmailSent(false);
    setTestEmailAddress("");
  };

  // Handle send test email
  const handleSendTestEmail = () => {
    if (!testEmailAddress || !selectedEventForEmail) return;
    sendTestEmailMutation.mutate({
      eventId: selectedEventForEmail.id,
      testEmail: testEmailAddress,
    });
  };

  // Handle approve and send email
  const handleApproveAndSendEmail = async (eventId: string) => {
    try {
      // First approve
      await approveEmailMutation.mutateAsync(eventId);
      // Then send
      await sendEmailMutation.mutateAsync(eventId);
      // Close test dialog if open
      setTestEmailDialogOpen(false);
    } catch (error) {
      console.error('Error in approve and send flow:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Combine date and time into datetime string with timezone
    const eventDate = formData.get("event_date") as string;
    const eventTime = formData.get("event_time") as string;
    // Use ISO format with local timezone to prevent UTC conversion
    const combinedDateTime = eventDate && eventTime ? `${eventDate}T${eventTime}:00` : "";
    
    // Process tags - convert comma-separated string to array
    const tagsInput = formData.get("tags") as string;
    const tagsArray = tagsInput ? tagsInput.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0) : null;

    // Validate required fields
    const title = formData.get("title") as string;
    if (!title || !eventDate || !eventTime) {
      toast({
        title: "Error",
        description: "Title, event date, and event time are required",
        variant: "destructive",
      });
      return;
    }
    
    // Validate date format
    const eventDateTime = new Date(combinedDateTime);
    if (isNaN(eventDateTime.getTime())) {
      toast({
        title: "Error",
        description: "Please provide a valid event date and time",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
      return;
    }

    // Handle photo upload if file is selected
    let imageUrl = null;
    const photoFile = (e.currentTarget as any).eventPhotoFile;
    
    if (photoFile) {
      try {
        const fileExt = photoFile.name.split('.').pop();
        const cleanEventTitle = title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 50);
        const fileName = `${cleanEventTitle}/event-thumbnail-${Date.now()}.${fileExt}`;

        console.log('[EventManagement] Uploading photo to event-photos bucket...');
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-photos')
          .upload(fileName, photoFile, { upsert: true });

        if (uploadError) {
          console.error('[EventManagement] Upload failed:', uploadError);
          toast({
            title: "Warning",
            description: "Event will be created but photo upload failed",
            variant: "destructive",
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('event-photos')
            .getPublicUrl(fileName);
          imageUrl = publicUrl;
          console.log('[EventManagement] Photo uploaded successfully:', imageUrl);
        }
      } catch (error) {
        console.error('[EventManagement] Photo upload error:', error);
      }
    }

    const eventData = {
      title,
      description: formData.get("description") as string || null,
      event_type: selectedEventType || null,
      event_date: combinedDateTime,
      location: formData.get("location") as string || null,
      is_paid_event: isPaidEvent,
      max_participants: formData.get("max_participants") ? parseInt(formData.get("max_participants") as string) : null,
      tags: tagsArray,
      is_registration_open: isRegistrationOpen,
      send_email_notification: sendEmailNotification,
      created_by: user?.id || null,
      image_url: imageUrl,
      number_of_games: isPaidEvent && formData.get("number_of_games") ? parseInt(formData.get("number_of_games") as string) : null,
      payment_registration_fee: isPaidEvent && formData.get("payment_registration_fee") ? parseFloat(formData.get("payment_registration_fee") as string) : null,
    };
    
    console.log('[EventManagement] Creating event with data:', eventData);
    addMutation.mutate(eventData);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEvent) return;

    const formData = new FormData(e.currentTarget);
    
    // Combine date and time into datetime string with timezone
    const eventDate = formData.get("edit_event_date") as string;
    const eventTime = formData.get("edit_event_time") as string;
    // Use ISO format with local timezone to prevent UTC conversion
    const combinedDateTime = eventDate && eventTime ? `${eventDate}T${eventTime}:00` : "";
    
    // Process tags - convert comma-separated string to array
    const tagsInput = formData.get("edit_tags") as string;
    const tagsArray = tagsInput ? tagsInput.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0) : null;
    
    const eventData = {
      title: formData.get("edit_title") as string,
      description: formData.get("edit_description") as string || null,
      event_type: editSelectedEventType || null,
      event_date: combinedDateTime,
      location: formData.get("edit_location") as string || null,
      is_paid_event: editIsPaidEvent,
      max_participants: formData.get("edit_max_participants") ? parseInt(formData.get("edit_max_participants") as string) : null,
      tags: tagsArray,
      is_registration_open: editIsRegistrationOpen,
      number_of_games: editIsPaidEvent && formData.get("edit_number_of_games") ? parseInt(formData.get("edit_number_of_games") as string) : null,
      payment_registration_fee: editIsPaidEvent && formData.get("edit_payment_registration_fee") ? parseFloat(formData.get("edit_payment_registration_fee") as string) : null,
    };
    
    console.log('[EventManagement] Edit form data:', eventData);
    
    // Validate required fields
    if (!eventData.title || !eventDate || !eventTime) {
      toast({
        title: "Error",
        description: "Title, event date, and event time are required",
        variant: "destructive",
      });
      return;
    }
    
    updateMutation.mutate({ id: editingEvent.id, eventData });
  };

  const handleViewEvent = (event: typeof editingEvent) => {
    setEditingEvent(event);
    setEditIsPaidEvent(event.is_paid_event || false);
    setEditIsRegistrationOpen(event.is_registration_open !== false);
    setEditSelectedEventType(event.event_type || "");
    setIsEditing(true);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingEvent) return;
    
    try {
      setUploading(true);
      console.log('[EventManagement] Starting photo upload...');
      
      if (!event.target.files || event.target.files.length === 0) {
        console.log('[EventManagement] No file selected');
        return;
      }

      const file = event.target.files[0];
      console.log('[EventManagement] File selected:', file.name, file.size, file.type);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Add upload to progress dialog
      const uploadId = addUpload(file);

      const fileExt = file.name.split('.').pop();
      const cleanEventTitle = editingEvent.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
      const fileName = `${cleanEventTitle}/event-thumbnail-${Date.now()}.${fileExt}`;

      console.log('[EventManagement] Uploading to event-photos bucket...');
      updateUpload(uploadId, { status: 'uploading', progress: 0 });
      
      // Upload image to Supabase Storage (event-photos bucket)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('[EventManagement] Upload failed:', uploadError);
        updateUpload(uploadId, { status: 'error', error: `Upload failed: ${uploadError.message}` });
        throw uploadError;
      }

      updateUpload(uploadId, { status: 'uploading', progress: 80 });
      console.log('[EventManagement] Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('event-photos')
        .getPublicUrl(fileName);

      console.log('[EventManagement] Public URL generated:', publicUrl);

      // Update event with new image URL
      const { error: updateError } = await supabase
        .from('events')
        .update({ image_url: publicUrl })
        .eq('id', editingEvent.id);

      if (updateError) {
        console.error('[EventManagement] Event update error:', updateError);
        updateUpload(uploadId, { status: 'error', error: `Database update failed: ${updateError.message}` });
        throw updateError;
      }

      console.log('[EventManagement] Event updated with image URL');
      updateUpload(uploadId, { status: 'completed', progress: 100 });

      // Update local state
      setEditingEvent({ ...editingEvent, image_url: publicUrl });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["events"] });
      
      // Success message is shown by the upload progress dialog
    } catch (error) {
      console.error('[EventManagement] Error uploading photo:', error);
      toast({
        title: "Error",
        description: `Failed to upload photo: ${error.message}`,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleViewRegistrations = (event: { id: string; title: string; max_participants?: number }) => {
    setSelectedEventForRegistrations({
      id: event.id,
      title: event.title,
      max_participants: event.max_participants,
    });
    setRegistrationsDialogOpen(true);
  };

  const handleGenerateQR = async (event: { id: string; title: string }) => {
    setSelectedEventForQR({ id: event.id, title: event.title });
    setGeneratingQR(true);
    setQrCodeDialogOpen(true);
    
    try {
      // Check if QR code already exists
      const { data: existingQR, error: fetchError } = await supabase
        .from('event_qr_codes')
        .select('qr_code_data, created_at')
        .eq('event_id', event.id)
        .maybeSingle();

      if (fetchError) {
        console.error('[EventManagement] Error fetching QR:', fetchError);
        throw new Error('Failed to check existing QR code');
      }

      if (existingQR) {
        // Use existing QR code
        setQrCodeData(existingQR.qr_code_data);
        toast({
          title: "QR Code Retrieved",
          description: "Using existing QR code for this event",
          className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
        });
      } else {
        // Generate new QR code token (similar to attendance system)
        const randomBytes = crypto.getRandomValues(new Uint8Array(16));
        const randomHex = Array.from(randomBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        const qrCodeData = `EVENT_${event.id}_${randomHex}`;

        // Insert new QR code directly into database
        const { data: newQR, error: insertError } = await supabase
          .from('event_qr_codes')
          .insert({
            event_id: event.id,
            qr_code_data: qrCodeData,
            created_by: user?.id,
            is_active: true,
          })
          .select('qr_code_data, created_at')
          .single();

        if (insertError) {
          console.error('[EventManagement] Error creating QR:', insertError);
          throw new Error('Failed to generate QR code');
        }

        setQrCodeData(newQR.qr_code_data);
        toast({
          title: "QR Code Generated",
          description: "New QR code created successfully",
          className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
        });
      }
    } catch (error: unknown) {
      console.error('[EventManagement] QR generation error:', error);
      toast({
        title: "Failed to generate QR code",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleEditPayment = (registrationId: string, currentPaymentStatus: string) => {
    setEditingPaymentId(registrationId);
    setEditPaymentStatus(currentPaymentStatus || "pending");
  };

  const handleSavePayment = (registrationId: string) => {
    updatePaymentStatusMutation.mutate({
      registrationId,
      paymentStatus: editPaymentStatus
    });
  };

  const handleCancelEdit = () => {
    setEditingPaymentId(null);
    setEditPaymentStatus("");
  };

  const handleViewProfile = (registration: {
    user_id: string;
    full_name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
  }) => {
    setSelectedUserId(registration.user_id);
    setProfileDialogOpen(true);
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
        'Year': reg.year || 'N/A',
        'Branch': reg.branch || 'N/A',
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
        { wch: 8 },  // Year
        { wch: 30 }, // Branch
        { wch: 15 }, // Payment Status
        { wch: 20 }, // Registered At
        { wch: 15 }, // Registration Date
        { wch: 15 }  // Registration Time
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

      // Generate Excel file and download
      const fileName = `${selectedEventForRegistrations?.title || 'event'}-registrations.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Excel Export Successful",
        description: `Registration data exported to ${fileName}`,
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });

    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export Excel file. Please try again or use CSV export.",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    }
  };

  return (
    <>
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-0 sm:p-6 pb-2"
    >
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event Management</CardTitle>
              <CardDescription>Create and manage events</CardDescription>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary">
                {isLoading ? '...' : filteredEvents?.length || 0}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {filteredEvents?.length === 1 ? 'Event' : 'Events'} {activeTab !== "all" ? "Filtered" : ""}
              </div>
            </div>
          </div>
          
          {/* Event Category Tabs */}
          <div className="flex flex-wrap gap-2 p-0.5 bg-muted/30 rounded-lg backdrop-blur-sm border border-border/50 w-fit mt-4">
            <Button
              variant={activeTab === "all" ? "default" : "ghost"}
              onClick={() => setActiveTab("all")}
              className={`gap-2 flex-1 sm:flex-none transition-all duration-200 ${
                activeTab === "all" 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-muted/50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              All Events ({events?.length || 0})
            </Button>
            <Button
              variant={activeTab === "upcoming" ? "default" : "ghost"}
              onClick={() => setActiveTab("upcoming")}
              className={`gap-2 flex-1 sm:flex-none transition-all duration-200 ${
                activeTab === "upcoming" 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-muted/50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Upcoming ({events?.filter(e => new Date(e.event_date) >= new Date()).length || 0})
            </Button>
            <Button
              variant={activeTab === "past" ? "default" : "ghost"}
              onClick={() => setActiveTab("past")}
              className={`gap-2 flex-1 sm:flex-none transition-all duration-200 ${
                activeTab === "past" 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-muted/50"
              }`}
            >
              <History className="w-4 h-4" />
              Past ({events?.filter(e => new Date(e.event_date) < new Date()).length || 0})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isAdding && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Main Content Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Event Photo */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="relative group">
                    <div className="aspect-[4/3] border-2 border-dashed border-primary/30 rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/50 transition-all">
                      <div id="create-upload-placeholder" className="w-full h-full flex flex-col items-center justify-center p-6">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-center mb-1">Click to upload</p>
                        <p className="text-xs text-muted-foreground text-center">PNG, JPG, WEBP up to 10MB</p>
                      </div>
                      <img id="create-photo-preview" alt="Preview" className="w-full h-full object-cover hidden" />
                    </div>
                    <input
                      type="file"
                      id="create-photo-upload"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          (e.target.form as any).eventPhotoFile = file;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const preview = document.getElementById('create-photo-preview') as HTMLImageElement;
                            const placeholder = document.getElementById('create-upload-placeholder');
                            if (preview && event.target?.result) {
                              preview.src = event.target.result as string;
                              preview.classList.remove('hidden');
                              placeholder?.classList.add('hidden');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => document.getElementById('create-photo-upload')?.click()}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    >
                      Upload
                    </Button>
                  </div>

                  {/* Event Settings Card */}
                  <Card className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Event Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                          </div>
                          <Label htmlFor="is_paid_event" className="cursor-pointer font-medium">Paid Event</Label>
                        </div>
                        <Switch 
                          id="is_paid_event" 
                          checked={isPaidEvent}
                          onCheckedChange={setIsPaidEvent}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Users className="w-4 h-4 text-green-600" />
                          </div>
                          <Label htmlFor="is_registration_open" className="cursor-pointer font-medium">Registration Open</Label>
                        </div>
                        <Switch 
                          id="is_registration_open" 
                          checked={isRegistrationOpen}
                          onCheckedChange={setIsRegistrationOpen}
                        />
                      </div>

                      {(isCore() || isSuperAdmin()) && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                              <Mail className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <Label htmlFor="send_email_notification" className="cursor-pointer font-medium">Email Notification</Label>
                              <p className="text-xs text-muted-foreground">
                                {sendEmailNotification ? (isSuperAdmin() ? "✓ Will send immediately" : "✓ Admin approval required") : "Notify all students"}
                              </p>
                            </div>
                          </div>
                          <Switch 
                            id="send_email_notification" 
                            checked={sendEmailNotification}
                            onCheckedChange={setSendEmailNotification}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Event Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information Card */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-sm font-medium">Event Title *</Label>
                          <Input id="title" name="title" required placeholder="Enter event title" className="h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="event_type" className="text-sm font-medium">Event Type</Label>
                          <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="workshop">🛠️ Workshop</SelectItem>
                              <SelectItem value="seminar">📚 Seminar</SelectItem>
                              <SelectItem value="meetup">🤝 Meetup</SelectItem>
                              <SelectItem value="bharatiyam">🏛️ Bharatiyam</SelectItem>
                              <SelectItem value="other">📌 Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                        <Textarea 
                          id="description" 
                          name="description" 
                          rows={4} 
                          placeholder="Describe your event in detail..."
                          className="resize-none"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Date & Time Card */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Date & Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="event_date" className="text-sm font-medium">Event Date *</Label>
                          <Input 
                            id="event_date" 
                            name="event_date" 
                            type="date" 
                            required 
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="event_time" className="text-sm font-medium">Event Time *</Label>
                          <Input 
                            id="event_time" 
                            name="event_time" 
                            type="time" 
                            required 
                            className="h-11"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Location & Fee Card */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Location & Registration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                          <Input 
                            id="location" 
                            name="location" 
                            placeholder="Enter venue address"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max_participants" className="text-sm font-medium">Max Participants</Label>
                          <Input 
                            id="max_participants" 
                            name="max_participants" 
                            type="number" 
                            min="1"
                            placeholder="e.g., 100"
                            className="h-11"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Details Card - Only shown when Paid Event is enabled */}
                  {isPaidEvent && (
                    <Card className="border-2 border-blue-500/30 bg-blue-50/5">
                      <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-blue-600" />
                          Payment Details
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Configure payment information for this paid event
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="number_of_games" className="text-sm font-medium">Number of Games</Label>
                            <Input 
                              id="number_of_games" 
                              name="number_of_games" 
                              type="number" 
                              min="1"
                              placeholder="e.g., 5"
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="payment_registration_fee" className="text-sm font-medium">Registration Fee (₹) *</Label>
                            <Input 
                              id="payment_registration_fee" 
                              name="payment_registration_fee" 
                              type="number" 
                              min="0"
                              step="0.01"
                              placeholder="Enter amount"
                              className="h-11"
                              required
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setIsPaidEvent(false);
                    setIsRegistrationOpen(true);
                    setSelectedEventType("");
                    setSendEmailNotification(false);
                  }}
                  className="sm:flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addMutation.isPending} 
                  className="sm:flex-1"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {addMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4 mt-6 pb-24">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        ) : filteredEvents && filteredEvents.length > 0 ? (
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid gap-4 lg:grid-cols-2"
          >
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                variants={staggerItem}
                custom={index}
              >
              <Card className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Event Thumbnail - Left Side */}
                  <div className="w-full sm:w-48 h-56 sm:h-auto overflow-hidden bg-muted flex-shrink-0">
                    <img 
                      src={event.image_url || "/default-events-cover-image.png"} 
                      alt={event.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  {/* Event Details - Right Side */}
                  <div className="flex-1 flex flex-col">
                    <CardHeader className="pb-3 pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg truncate" title={event.title}>
                            {event.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1 text-xs sm:text-sm">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">
                              {new Date(event.event_date).toLocaleString()}
                            </span>
                          </CardDescription>
                        </div>
                        {event.event_type && (
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium flex-shrink-0">
                            {event.event_type}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col justify-between space-y-3 pt-0">
                      <div className="space-y-2 sm:space-y-3">
                        {event.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 text-xs">
                          {event.location && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">
                                {event.is_paid_event ? "Paid Event" : event.location}
                              </span>
                            </div>
                          )}
                          {event.max_participants && (
                            <span className="text-muted-foreground">
                              Max: {event.max_participants} participants
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewEvent(event)}
                          className="gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        {canViewRegistrations && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewRegistrations(event)}
                              className="gap-2"
                            >
                              <Users className="w-4 h-4" />
                              Registrations
                            </Button>
                            {/* Generate QR Code Button - Only for paid events */}
                            {event.is_paid_event && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGenerateQR(event)}
                                className="gap-2 border-purple-500 text-purple-600 hover:bg-purple-50"
                              >
                                <QrCode className="w-4 h-4" />
                                QR Code
                              </Button>
                            )}
                          </>
                        )}
                        {canViewRegistrations && new Date(event.event_date) < new Date() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewGallery(event)}
                            className="gap-2"
                          >
                            <ImageIcon className="w-4 h-4" />
                            Gallery
                          </Button>
                        )}
                        {isSuperAdmin() && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={deleteMutation.isPending}
                                className="w-9 h-9 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-md max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl mt-[15vh]">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete <strong>{event.title}</strong>? 
                                  This action cannot be undone and will permanently remove the event and all associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(event.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Event
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {activeTab === "upcoming" ? "No upcoming events found." :
               activeTab === "past" ? "No past events found." :
               "No events created yet. Click \"Add New Event\" to get started."}
            </p>
          </div>
        )}

      </div>

      {/* Bottom Action Bar - Fixed on both mobile and desktop */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg px-4 sm:px-6 py-3 sm:py-4 z-50">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 max-w-7xl mx-auto">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            {filteredEvents && filteredEvents.length > 0 ? `Managing ${filteredEvents.length} ${filteredEvents.length === 1 ? 'event' : 'events'}` : 'No events to manage'}
          </p>
          <Button 
            onClick={() => setIsAdding(true)} 
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 gap-2"
            disabled={isAdding}
          >
            <Plus className="w-4 h-4" />
            Add New Event
          </Button>
        </div>
      </div>
    </motion.div>

      {/* Edit Event Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] h-[100vh] w-[100vw] overflow-hidden bg-background/95 backdrop-blur-md border-0 shadow-2xl p-4 sm:p-6 [&>button]:hidden m-0 rounded-none">
          <DialogHeader className="relative pb-3">
            <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl pr-10">
              <Edit className="w-5 h-5 sm:w-6 sm:h-6" />
              Edit Event: {editingEvent?.title}
            </DialogTitle>
            <button
              onClick={() => setIsEditing(false)}
              className="absolute right-0 top-0 h-8 w-8 rounded-full hover:bg-red-500/10 transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-red-500 hover:text-red-600" />
            </button>
          </DialogHeader>

          {editingEvent && (
            <form onSubmit={handleEditSubmit} className="space-y-6 h-[calc(100vh-5rem)] overflow-y-auto pb-20">
              {/* Main Content Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Event Photo */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="relative group">
                    <div className="aspect-[4/3] border-2 border-dashed border-primary/30 rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/50 transition-all">
                      <img 
                        src={editingEvent.image_url || "/default-events-cover-image.png"} 
                        alt={editingEvent.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      disabled={uploading}
                      className="absolute top-2 right-2 gap-2"
                    >
                      {uploading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {uploading ? "Uploading..." : editingEvent.image_url ? "Change" : "Upload"}
                    </Button>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Event Settings Card */}
                  <Card className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Event Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                          </div>
                          <Label htmlFor="edit_is_paid_event" className="cursor-pointer font-medium">Paid Event</Label>
                        </div>
                        <Switch 
                          id="edit_is_paid_event" 
                          checked={editIsPaidEvent}
                          onCheckedChange={setEditIsPaidEvent}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Users className="w-4 h-4 text-green-600" />
                          </div>
                          <Label htmlFor="edit_is_registration_open" className="cursor-pointer font-medium">Registration Open</Label>
                        </div>
                        <Switch 
                          id="edit_is_registration_open" 
                          checked={editIsRegistrationOpen}
                          onCheckedChange={setEditIsRegistrationOpen}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Event Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information Card */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="edit_title" className="text-sm font-medium">Event Title *</Label>
                          <Input 
                            id="edit_title" 
                            name="edit_title" 
                            required 
                            defaultValue={editingEvent.title}
                            placeholder="Enter event title" 
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit_event_type" className="text-sm font-medium">Event Type</Label>
                          <Select value={editSelectedEventType} onValueChange={setEditSelectedEventType}>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="workshop">🛠️ Workshop</SelectItem>
                              <SelectItem value="seminar">📚 Seminar</SelectItem>
                              <SelectItem value="meetup">🤝 Meetup</SelectItem>
                              <SelectItem value="bharatiyam">🏛️ Bharatiyam</SelectItem>
                              <SelectItem value="other">📌 Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit_description" className="text-sm font-medium">Description</Label>
                        <Textarea 
                          id="edit_description" 
                          name="edit_description" 
                          rows={4} 
                          defaultValue={editingEvent.description || ""}
                          placeholder="Describe your event in detail..."
                          className="resize-none"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Date & Time Card */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Date & Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="edit_event_date" className="text-sm font-medium">Event Date *</Label>
                          <Input 
                            id="edit_event_date" 
                            name="edit_event_date" 
                            type="date" 
                            required 
                            className="h-11"
                            defaultValue={editingEvent.event_date ? (() => {
                              const dateStr = editingEvent.event_date;
                              if (dateStr.includes('T')) {
                                return dateStr.split('T')[0];
                              } else if (dateStr.includes(' ')) {
                                return dateStr.split(' ')[0];
                              }
                              return dateStr;
                            })() : ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit_event_time" className="text-sm font-medium">Event Time *</Label>
                          <Input 
                            id="edit_event_time" 
                            name="edit_event_time" 
                            type="time" 
                            required 
                            className="h-11"
                            defaultValue={editingEvent.event_date ? (() => {
                              const dateStr = editingEvent.event_date;
                              if (dateStr.includes('T')) {
                                const timePart = dateStr.split('T')[1];
                                return timePart.substring(0, 5);
                              } else if (dateStr.includes(' ')) {
                                const parts = dateStr.split(' ');
                                if (parts.length > 1) {
                                  return parts[1].substring(0, 5);
                                }
                              }
                              return "12:00";
                            })() : ""}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Location & Fee Card */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Location & Registration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="edit_location" className="text-sm font-medium">Location</Label>
                          <Input 
                            id="edit_location" 
                            name="edit_location" 
                            defaultValue={editingEvent.location || ""}
                            placeholder="Enter venue address"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit_max_participants" className="text-sm font-medium">Max Participants</Label>
                          <Input 
                            id="edit_max_participants" 
                            name="edit_max_participants" 
                            type="number" 
                            min="1"
                            defaultValue={editingEvent.max_participants || ""}
                            placeholder="e.g., 100"
                            className="h-11"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Details Card - Only shown when Paid Event is enabled */}
                  {editIsPaidEvent && (
                    <Card className="border-2 border-blue-500/30 bg-blue-50/5">
                      <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-blue-600" />
                          Payment Details
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Configure payment information for this paid event
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="edit_number_of_games" className="text-sm font-medium">Number of Games</Label>
                            <Input 
                              id="edit_number_of_games" 
                              name="edit_number_of_games" 
                              type="number" 
                              min="1"
                              defaultValue={editingEvent.number_of_games || ""}
                              placeholder="e.g., 5"
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit_payment_registration_fee" className="text-sm font-medium">Registration Fee (₹) *</Label>
                            <Input 
                              id="edit_payment_registration_fee" 
                              name="edit_payment_registration_fee" 
                              type="number" 
                              min="0"
                              step="0.01"
                              defaultValue={editingEvent.payment_registration_fee || ""}
                              placeholder="Enter amount"
                              className="h-11"
                              required
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? "Updating..." : "Update Event"}
                </Button>
              </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Registration Details Dialog */}
      <Dialog open={registrationsDialogOpen} onOpenChange={(open) => {
        setRegistrationsDialogOpen(open);
        if (!open) setRegistrationSearchQuery(''); // Clear search when dialog closes
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-[85vw] max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 [&>button]:hidden">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 text-center sm:text-left">
                <DialogTitle className="text-center sm:text-left">
                  Event Registrations – {selectedEventForRegistrations?.title ?? "Event"}
                </DialogTitle>
                <DialogDescription className="text-center sm:text-left">
                  Total registrations: {registrationDetails?.length ?? 0}
                </DialogDescription>
              </div>
              <div className="flex items-center justify-center sm:justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => refetchRegistrations()}
                  disabled={registrationDetailsLoading}
                  className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 h-8 w-auto px-2 sm:px-3"
                  title="Refresh registrations"
                >
                  <RefreshCw className={`h-4 w-4 ${registrationDetailsLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline ml-2">Refresh</span>
                </Button>
                <DialogClose
                  className="h-8 w-8 rounded-full flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                  aria-label="Close registrations"
                >
                  <X className="h-4 w-4" />
                </DialogClose>
              </div>
            </div>
          </DialogHeader>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={registrationSearchQuery}
              onChange={(e) => setRegistrationSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-2 border-cyan-500/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            {registrationSearchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRegistrationSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Results Info */}
          {registrationSearchQuery && (
            <div className="text-sm text-muted-foreground">
              Showing {registrationDetails.length} of {allRegistrationDetails.length} registrations
            </div>
          )}

          <div className="border rounded-md max-h-80 overflow-auto">
            {registrationDetailsLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading registrations…</div>
            ) : registrationDetails.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No registrations yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-muted">
                    <tr className="text-left">
                      <th className="px-2 sm:px-4 py-2 w-12 sm:w-16">Profile</th>
                      <th className="px-2 sm:px-4 py-2">Full Name</th>
                      <th className="px-2 sm:px-4 py-2 hidden sm:table-cell">Email</th>
                      <th className="px-2 sm:px-4 py-2 hidden md:table-cell">Phone</th>
                      <th className="px-2 sm:px-4 py-2 hidden sm:table-cell">Payment</th>
                      <th className="px-2 sm:px-4 py-2 hidden lg:table-cell">Registered At</th>
                      <th className="px-2 sm:px-4 py-2 text-center w-20 sm:w-auto">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrationDetails.map((registration, index) => (
                      <tr key={`${registration.event_id}-${registration.email ?? index}-${registration.registration_date}`} className="border-t">
                        <td className="px-2 sm:px-4 py-2">
                          <div className="flex items-center justify-center">
                            {registration.avatar_url ? (
                              <img 
                                src={registration.avatar_url} 
                                alt={registration.full_name || "User"} 
                                className="w-8 h-8 rounded-full object-cover border border-border/50"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border/50">
                                <User className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2">
                          <div className="font-medium truncate">{highlightText(registration.full_name ?? "Unknown", registrationSearchQuery)}</div>
                          <div className="text-xs text-muted-foreground sm:hidden truncate">{highlightText(registration.email ?? "—", registrationSearchQuery)}</div>
                          <div className="text-xs text-muted-foreground sm:hidden truncate mt-0.5">
                            {registration.phone && <span>📞 {highlightText(registration.phone, registrationSearchQuery)}</span>}
                            {registration.phone && registration.payment_status && <span className="mx-1">•</span>}
                            {registration.payment_status && <span className="capitalize">💳 {registration.payment_status}</span>}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">
                          <div className="truncate" title={registration.email ?? "—"}>{highlightText(registration.email ?? "—", registrationSearchQuery)}</div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 hidden md:table-cell">
                          <div className="truncate">{highlightText(registration.phone ?? "—", registrationSearchQuery)}</div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">
                          {editingPaymentId === registration.id ? (
                            <div className="flex items-center gap-2">
                              <Select value={editPaymentStatus} onValueChange={setEditPaymentStatus}>
                                <SelectTrigger className="w-24 h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="paid">Paid</SelectItem>
                                  <SelectItem value="failed">Failed</SelectItem>
                                  <SelectItem value="refunded">Refunded</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSavePayment(registration.id)}
                                disabled={updatePaymentStatusMutation.isPending}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 h-6 w-6 p-0"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="capitalize text-xs sm:text-sm">{registration.payment_status ?? "pending"}</span>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-2 hidden lg:table-cell text-xs">{new Date(registration.registration_date).toLocaleString()}</td>
                        <td className="px-2 sm:px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-1 sm:gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewProfile(registration)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 h-9 w-9 sm:h-8 sm:w-8 p-0"
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4 sm:h-4 sm:w-4" />
                            </Button>
                            {registration.payment_screenshot_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setViewingPaymentScreenshot(registration.payment_screenshot_url);
                                  setPaymentScreenshotDialogOpen(true);
                                }}
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-9 w-9 sm:h-8 sm:w-8 p-0"
                                title="View Payment Screenshot"
                              >
                                <Receipt className="h-4 w-4 sm:h-4 sm:w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPayment(registration.id, registration.payment_status)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-9 w-9 sm:h-8 sm:w-8 p-0 hidden sm:inline-flex"
                              title="Edit Payment"
                            >
                              <Pencil className="h-4 w-4 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteRegistrationMutation.mutate(registration.id)}
                              disabled={deleteRegistrationMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 w-9 sm:h-8 sm:w-8 p-0"
                              title="Delete Registration"
                            >
                              <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              {selectedEventForRegistrations?.max_participants == null
                ? "Unlimited capacity"
                : `${registrationDetails.length}/${selectedEventForRegistrations?.max_participants ?? 0} registrations`}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
              <Button 
                variant="outline" 
                onClick={() => setRegistrationsDialogOpen(false)}
                className="w-full sm:w-auto text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 order-2 sm:order-1"
              >
                <X className="mr-2 h-4 w-4" />
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

      {/* Event Gallery Management Dialog */}
      {selectedEventForGallery && (
        <EventGalleryManagement
          eventId={selectedEventForGallery.id}
          eventTitle={selectedEventForGallery.title}
          isOpen={isGalleryDialogOpen}
          onClose={() => setIsGalleryDialogOpen(false)}
        />
      )}

      {/* User Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl mt-[5vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Profile
            </DialogTitle>
          </DialogHeader>

          {selectedUserProfile && (
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex justify-center">
                {selectedUserProfile.avatar_url ? (
                  <img 
                    src={selectedUserProfile.avatar_url} 
                    alt={selectedUserProfile.full_name || "User"} 
                    className="w-24 h-24 rounded-full object-cover border-4 border-border/50 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-border/50 shadow-lg">
                    <User className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* User Information */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-semibold">{selectedUserProfile.full_name || "Unknown User"}</h3>
                  <p className="text-muted-foreground">{selectedUserProfile.email}</p>
                  {selectedUserProfile.role && (
                    <div className="flex justify-center mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedUserProfile.role === 'admin' ? 'bg-red-100 text-red-700' :
                        selectedUserProfile.role === 'core' ? 'bg-blue-100 text-blue-700' :
                        selectedUserProfile.role === 'co_head' ? 'bg-purple-100 text-purple-700' :
                        selectedUserProfile.role === 'member' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedUserProfile.role === 'admin' ? 'Admin' :
                         selectedUserProfile.role === 'core' ? 'Core Team' :
                         selectedUserProfile.role === 'co_head' ? 'Co-Head' :
                         selectedUserProfile.role === 'member' ? 'Member' :
                         selectedUserProfile.role === 'student' ? 'Student' :
                         selectedUserProfile.role}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Academic Information - Only show if fields exist in profile */}
                  {((selectedUserProfile as any).branch || (selectedUserProfile as any).year) && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Academic Details</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {(selectedUserProfile as any).branch && <span>Branch: {(selectedUserProfile as any).branch}</span>}
                          {(selectedUserProfile as any).year && <span>Year: {(selectedUserProfile as any).year}</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-sm font-bold">@</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{selectedUserProfile.email}</p>
                    </div>
                  </div>

                  {selectedUserProfile.phone && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 text-sm font-bold">📞</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{selectedUserProfile.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  {selectedUserProfile.bio && (
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Bio</p>
                        <p className="text-sm text-muted-foreground">{selectedUserProfile.bio}</p>
                      </div>
                    </div>
                  )}

                  {/* Social Media Links */}
                  {((selectedUserProfile as any).instagram_url || selectedUserProfile.linkedin_url || (selectedUserProfile as any).whatsapp_url) && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium mb-3">Social Media</p>
                      <div className="flex gap-3">
                        {(selectedUserProfile as any).instagram_url && (
                          <a 
                            href={(selectedUserProfile as any).instagram_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center hover:bg-pink-200 transition-colors"
                          >
                            <Instagram className="w-5 h-5 text-pink-600" />
                          </a>
                        )}
                        {selectedUserProfile.linkedin_url && (
                          <a 
                            href={selectedUserProfile.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors"
                          >
                            <Linkedin className="w-5 h-5 text-blue-600" />
                          </a>
                        )}
                        {(selectedUserProfile as any).whatsapp_url && (
                          <a 
                            href={(selectedUserProfile as any).whatsapp_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors"
                          >
                            <MessageCircle className="w-5 h-5 text-green-600" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setProfileDialogOpen(false);
                setSelectedUserId(null);
              }}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-600" />
              Test Email Notification
            </DialogTitle>
            <DialogDescription>
              {!testEmailSent 
                ? "Send a test email to verify how the notification will look before publishing to all students."
                : "Test email sent successfully! Review it and then publish to all students."}
            </DialogDescription>
          </DialogHeader>

          {!testEmailSent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Test Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your email address to receive a test notification
                </p>
              </div>

              {selectedEventForEmail && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-sm font-medium">Event: {selectedEventForEmail.title}</p>
                  <p className="text-xs text-muted-foreground">
                    This test will show exactly how students will see the email
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Test Email Sent!
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      Check your inbox at <strong>{testEmailAddress}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Next Steps:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Review the test email in your inbox</li>
                  <li>Check formatting, links, and content</li>
                  <li>Click "Publish" to send to all students</li>
                  <li>Or click "Re-test" to send another test</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {!testEmailSent ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTestEmailDialogOpen(false)}
                  className="sm:flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={!testEmailAddress || sendTestEmailMutation.isPending}
                  className="sm:flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {sendTestEmailMutation.isPending ? "Sending..." : "Send Test"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTestEmailSent(false);
                    setTestEmailAddress("");
                  }}
                  className="sm:flex-1"
                >
                  Re-test
                </Button>
                <Button
                  type="button"
                  onClick={() => selectedEventForEmail && handleApproveAndSendEmail(selectedEventForEmail.id)}
                  disabled={approveEmailMutation.isPending || sendEmailMutation.isPending}
                  className="sm:flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
                >
                  <Send className="w-4 h-4" />
                  {approveEmailMutation.isPending || sendEmailMutation.isPending ? "Publishing..." : "Publish to All Students"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Screenshot Viewing Dialog */}
      <Dialog open={paymentScreenshotDialogOpen} onOpenChange={setPaymentScreenshotDialogOpen}>
        <DialogContent className="max-w-4xl bg-background/95 backdrop-blur-xl border-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Receipt className="w-6 h-6 text-purple-600" />
              Payment Screenshot
            </DialogTitle>
            <DialogDescription>
              View the payment screenshot uploaded by the user
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {viewingPaymentScreenshot ? (
              <div className="relative w-full bg-black/90 rounded-lg overflow-hidden border-2 border-purple-200/20 shadow-2xl">
                <img 
                  src={viewingPaymentScreenshot} 
                  alt="Payment Screenshot" 
                  className="w-full h-auto max-h-[75vh] object-contain"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No payment screenshot available
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPaymentScreenshotDialogOpen(false);
                setViewingPaymentScreenshot(null);
              }}
            >
              Close
            </Button>
            {viewingPaymentScreenshot && (
              <Button
                type="button"
                onClick={() => window.open(viewingPaymentScreenshot, '_blank')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Open in New Tab
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrCodeDialogOpen} onOpenChange={setQrCodeDialogOpen}>
        <DialogContent className="max-w-lg bg-black/90 backdrop-blur-2xl border-2 border-purple-500/30 shadow-2xl mt-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-white">
              <QrCode className="w-6 h-6 text-purple-400" />
              Event QR Code
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {selectedEventForQR?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {generatingQR ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center p-12"
              >
                <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
              </motion.div>
            ) : qrCodeData ? (
              <>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  id="qr-code-container" 
                  className="flex items-center justify-center p-8 bg-white rounded-xl border-4 border-purple-400/50 shadow-xl relative"
                >
                  <QRCodeSVG
                    value={qrCodeData}
                    size={280}
                    level="H"
                    includeMargin={true}
                    fgColor="#000000"
                    imageSettings={{
                      src: "/images/blotic.png",
                      x: undefined,
                      y: undefined,
                      height: 50,
                      width: 50,
                      excavate: true,
                    }}
                  />
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-between"
                >
                  <p className="text-sm text-gray-300 font-medium flex-1">
                    📱 Users will scan this QR code to play games
                  </p>
                  <Button
                    onClick={async () => {
                      try {
                        setDownloadingQR(true);
                        
                        // Create a high-resolution QR code (2048px) for download
                        const highResSize = 2048;
                        const logoSize = Math.floor(highResSize * 0.18); // 18% of QR size for logo
                        
                        // Create a temporary container for high-res QR
                        const tempContainer = document.createElement('div');
                        tempContainer.style.position = 'absolute';
                        tempContainer.style.left = '-9999px';
                        document.body.appendChild(tempContainer);
                        
                        // Dynamically import QRCodeSVG component
                        const { QRCodeSVG } = await import('qrcode.react');
                        const { createRoot } = await import('react-dom/client');
                        
                        // Create high-res QR code
                        const root = createRoot(tempContainer);
                        await new Promise<void>((resolve) => {
                          root.render(
                            <QRCodeSVG
                              value={qrCodeData}
                              size={highResSize}
                              level="H"
                              includeMargin={true}
                              fgColor="#000000"
                              imageSettings={{
                                src: "/images/blotic.png",
                                x: undefined,
                                y: undefined,
                                height: logoSize,
                                width: logoSize,
                                excavate: true,
                              }}
                            />
                          );
                          // Wait for render
                          setTimeout(resolve, 100);
                        });
                        
                        const svg = tempContainer.querySelector('svg');
                        if (!svg) {
                          throw new Error('Failed to generate high-res QR code');
                        }
                        
                        // Get all image elements and convert to data URLs
                        const images = svg.querySelectorAll('image');
                        for (const image of Array.from(images)) {
                          const href = image.getAttribute('href') || image.getAttribute('xlink:href');
                          if (href && !href.startsWith('data:')) {
                            try {
                              const response = await fetch(href);
                              const blob = await response.blob();
                              const dataUrl = await new Promise<string>((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result as string);
                                reader.readAsDataURL(blob);
                              });
                              image.setAttribute('href', dataUrl);
                            } catch (err) {
                              console.error('Failed to load image:', err);
                            }
                          }
                        }
                        
                        // Convert SVG to high-res PNG
                        const svgData = new XMLSerializer().serializeToString(svg);
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const img = new Image();
                        
                        img.onload = () => {
                          canvas.width = highResSize;
                          canvas.height = highResSize;
                          
                          // Use white background
                          if (ctx) {
                            ctx.fillStyle = '#FFFFFF';
                            ctx.fillRect(0, 0, highResSize, highResSize);
                            ctx.drawImage(img, 0, 0, highResSize, highResSize);
                          }
                          
                          // Export as high-quality PNG
                          canvas.toBlob((blob) => {
                            if (blob) {
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${selectedEventForQR?.title || 'event'}-qr-code-2048px.png`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }
                            
                            // Cleanup
                            root.unmount();
                            document.body.removeChild(tempContainer);
                          }, 'image/png', 1.0); // Maximum quality
                        };
                        
                        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                        
                        toast({
                          title: "QR Code Downloaded",
                          description: "High-resolution QR code (2048×2048px) saved successfully",
                          className: "bg-green-600 border-green-700 text-white",
                        });
                      } catch (error) {
                        console.error('QR download error:', error);
                        toast({
                          title: "Download Failed",
                          description: error instanceof Error ? error.message : "Failed to download QR code",
                          variant: "destructive",
                        });
                      } finally {
                        setDownloadingQR(false);
                      }
                    }}
                    variant="ghost"
                    size="icon"
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-400/10"
                    disabled={downloadingQR}
                  >
                    {downloadingQR ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                  </Button>
                </motion.div>
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-gray-400 p-8"
              >
                Failed to generate QR code
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventManagement;
