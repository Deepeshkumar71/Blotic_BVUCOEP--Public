import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/utils/animations";

// Create motion-wrapped Card component
const MotionCard = motion(Card);
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Upload, Camera } from "@/components/icons";
import Breadcrumbs from "@/components/Breadcrumbs";

// Define the type for profile updates
interface ProfileUpdate {
  full_name?: string | null;
  phone?: string | null;
  branch?: string | null;
  year?: number | null;
  bio?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  instagram_url?: string | null;
}

const Profile = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) {
        console.log("[Profile] No user, skipping query");
        return null;
      }

      console.log("[Profile] Fetching profile for user:", user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("[Profile] Query error:", error);
        throw error;
      }
      console.log("[Profile] Profile data fetched successfully");
      return data;
    },
    enabled: !!user,
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Handle profile photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      console.log('[Profile] Starting photo upload...');
      
      if (!event.target.files || event.target.files.length === 0) {
        console.log('[Profile] No file selected');
        return;
      }

      const file = event.target.files[0];
      console.log('[Profile] File selected:', file.name, file.size, file.type);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Delete old avatar if it exists and is not a base64 string
      if (profile.avatar_url && !profile.avatar_url.startsWith('data:')) {
        try {
          // Extract file path from URL - handle different URL formats
          let filePath = '';
          
          if (profile.avatar_url.includes('/storage/v1/object/public/avatars/')) {
            // Standard Supabase storage URL format
            const urlParts = profile.avatar_url.split('/storage/v1/object/public/avatars/');
            filePath = urlParts[1];
          } else if (profile.avatar_url.includes('/avatars/')) {
            // Alternative URL format
            const urlParts = profile.avatar_url.split('/avatars/');
            filePath = urlParts[1];
          } else {
            // Fallback: extract filename from end of URL (with user folder)
            const urlParts = profile.avatar_url.split('/');
            filePath = `${user?.id}/${urlParts[urlParts.length - 1]}`;
          }
          
          // Remove any query parameters
          filePath = filePath.split('?')[0];
          
          console.log('[Profile] Deleting old avatar:', filePath);
          
          if (filePath && filePath.length > 0) {
            // Delete old file from storage
            const { error: deleteError } = await supabase.storage
              .from('avatars')
              .remove([filePath]);
            
            if (deleteError) {
              console.warn('[Profile] Failed to delete old avatar:', deleteError);
              // Continue with upload even if deletion fails
            } else {
              console.log('[Profile] Old avatar deleted successfully');
            }
          } else {
            console.warn('[Profile] Could not extract file path from URL:', profile.avatar_url);
          }
        } catch (deleteErr) {
          console.warn('[Profile] Error deleting old avatar:', deleteErr);
          // Continue with upload even if deletion fails
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`; // Upload to user's folder

      console.log('[Profile] Uploading to path:', filePath);

      // Upload to the avatars bucket
      let uploadSuccess = false;
      let publicUrl = '';
      
      try {
        console.log('[Profile] Uploading to avatars bucket...');
        
        // Upload image to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.error('[Profile] Upload failed:', uploadError);
          throw uploadError;
        }

        console.log('[Profile] Upload successful:', uploadData);

        // Get public URL
        const { data: { publicUrl: url } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        publicUrl = url;
        uploadSuccess = true;
        console.log('[Profile] Public URL generated:', publicUrl);
      } catch (storageError) {
        console.error('[Profile] Storage error:', storageError);
        // Continue to fallback
      }

      if (!uploadSuccess) {
        // CRITICAL: Never use base64 fallback - it causes JWT token bloat and auth failures
        console.error('[Profile] Storage upload failed - base64 fallback is disabled for security');
        throw new Error('Failed to upload avatar to storage. Please try again or contact support.');
      }

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) {
        console.error('[Profile] Profile update error:', updateError);
        throw updateError;
      }

      console.log('[Profile] Profile updated successfully');
      
      // Refresh profile data
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });

      toast({
        title: "Profile photo updated",
        description: "Your profile photo has been successfully updated.",
      });

    } catch (error: unknown) {
      console.error('[Profile] Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload profile photo.";
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setIsEditing(false);
    }
  };


  const updateMutation = useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      if (!user) throw new Error("Not authenticated");

      console.log('[Profile] Updating profile with data:', updates);

      // Direct update with better error handling
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select();

      if (error) {
        console.error('[Profile] Profile update error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No profile found or update failed');
      }

      console.log('[Profile] Profile updated successfully:', data);
      return data[0];
    },
    onSuccess: (data) => {
      console.log('[Profile] Update mutation successful:', data);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('[Profile] Update mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const yearValue = formData.get("year") as string;
    updateMutation.mutate({
      full_name: formData.get("full_name") as string,
      phone: formData.get("phone") as string,
      branch: formData.get("branch") as string,
      year: yearValue ? parseInt(yearValue) : null,
      bio: formData.get("bio") as string,
      github_url: formData.get("github_url") as string,
      linkedin_url: formData.get("linkedin_url") as string,
      instagram_url: formData.get("instagram_url") as string,
    });
  };

  // Handle loading states
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-8 bg-muted rounded w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Handle case where user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  // Handle case where profile data couldn't be loaded
  if (!profile && !profileLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-4">
            {profileError ? `Error: ${(profileError as Error).message}` : "Error loading profile data."}
          </p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 pt-8 pb-16 px-4">
      <div className="container mx-auto max-w-7xl">
        <Breadcrumbs items={[{ label: "Profile" }]} />
        
        <motion.div 
          className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <User className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">Your Profile</h1>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Left Side - Profile Card */}
          <div className="lg:col-span-1">
            <MotionCard 
              className="sticky top-32 bg-card/50 backdrop-blur-sm border-border/50"
              variants={staggerItem}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Profile Picture */}
                  <div className="relative">
                    <Avatar className="w-32 h-32 ring-4 ring-blue-500 ring-offset-4 ring-offset-background">
                      <AvatarImage 
                        src={profile.avatar_url || undefined} 
                        alt={profile.full_name || "Profile"}
                        className="object-cover w-full h-full"
                      />
                      <AvatarFallback className="text-3xl">
                        {profile.full_name?.charAt(0).toUpperCase() || <User className="w-12 h-12" />}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 z-10"
                      title="Upload photo"
                    >
                      {uploading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Name and Role */}
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">{profile.full_name || "Your Name"}</h2>
                    {profile.role && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {profile.role === "admin" ? "Admin" : 
                         profile.role === "core" ? "Core Team" : 
                         profile.role === "co_head" ? "Co-Head" :
                         profile.role === "student" ? "Student" :
                         profile.role === "member" ? "Member" :
                         "Member"}
                      </span>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="w-full space-y-3 text-left">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                      <span>{profile.email}</span>
                    </div>
                    
                    {profile.phone && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                        </svg>
                        <span>{profile.phone}</span>
                      </div>
                    )}

                    {profile.branch && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                        </svg>
                        <span>{profile.branch}</span>
                      </div>
                    )}

                    {profile.year && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-9H19v2h-1.5v17c0 .55-.45 1-1 1h-9c-.55 0-1-.45-1-1V4H5V2h3.5c0-.55.45-1 1-1h5c.55 0 1 .45 1 1H19z"/>
                        </svg>
                        <span>Year {profile.year}</span>
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="flex justify-center gap-3 pt-4">
                    {profile.github_url && (
                      <a 
                        href={profile.github_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-center"
                        title="GitHub"
                      >
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </a>
                    )}
                    
                    {profile.linkedin_url && (
                      <a 
                        href={profile.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center"
                        title="LinkedIn"
                      >
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    )}
                    
                    {profile.instagram_url && (
                      <a 
                        href={profile.instagram_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center justify-center"
                        title="Instagram"
                      >
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </MotionCard>
          </div>

          {/* Right Side - Edit Form */}
          <div className="lg:col-span-2">
            <MotionCard variants={staggerItem}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your account details and personal information</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {!isEditing ? (
                      <Button type="button" onClick={() => setIsEditing(true)} size="sm" className="w-full sm:w-auto">
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={updateMutation.isPending} 
                          size="sm"
                          form="profile-form"
                          className="w-full sm:w-auto"
                        >
                          {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed from this page</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        defaultValue={profile.full_name}
                        disabled={!isEditing}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        defaultValue={profile.phone || ""}
                        disabled={!isEditing}
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Input
                        id="branch"
                        name="branch"
                        defaultValue={profile.branch || ""}
                        disabled={!isEditing}
                        placeholder="e.g., Computer Engineering"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        name="year"
                        type="number"
                        min="1"
                        max="4"
                        defaultValue={profile.year || ""}
                        disabled={!isEditing}
                        placeholder="e.g., 2"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        defaultValue={profile.bio || ""}
                        disabled={!isEditing}
                        rows={4}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Social Links</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="github_url">GitHub URL</Label>
                        <Input
                          id="github_url"
                          name="github_url"
                          defaultValue={profile.github_url || ""}
                          disabled={!isEditing}
                          placeholder="https://github.com/username"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                        <Input
                          id="linkedin_url"
                          name="linkedin_url"
                          defaultValue={profile.linkedin_url || ""}
                          disabled={!isEditing}
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instagram_url">Instagram URL</Label>
                        <Input
                          id="instagram_url"
                          name="instagram_url"
                          defaultValue={profile.instagram_url || ""}
                          disabled={!isEditing}
                          placeholder="https://instagram.com/username"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
            </MotionCard>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;