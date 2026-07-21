import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/utils/imageCompression";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Users, 
  Crown,
  User,
  X,
  Loader2,
  GraduationCap,
  Upload,
  Camera
} from "lucide-react";
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

interface CoreTeamMember {
  id: string;
  user_id: string | null;
  full_name: string;
  position: string;
  branch: string | null;
  skills: string[] | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  whatsapp_url: string | null;
  is_leadership: boolean;
  is_active: boolean | null;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

const CoreTeamManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Predefined positions from CoreTeam page
  const positions = [
    "President",
    "Vice President", 
    "Marketing Head",
    "PR Head",
    "Dev-Rel Head",
    "Social Media Head",
    "Event Management Head",
    "Designing Head",
    "Content Head",
    "Research Head",
    "HR Head",
    "Faculty Coordinator"
  ];
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFacultyDialogOpen, setIsFacultyDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CoreTeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [originalDisplayOrder, setOriginalDisplayOrder] = useState<number>(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    position: "",
    branch: "",
    skills: "",
    instagram_url: "",
    linkedin_url: "",
    whatsapp_url: "",
    is_leadership: false,
    is_active: true,
    display_order: 0,
    avatar_url: "",
  });

  // Fetch core team members with profile sync
  const { data: members, isLoading } = useQuery({
    queryKey: ["core-team"],
    queryFn: async () => {
      try {
        // Try backend endpoint first
        const response = await fetch('/api/core-team');
        if (response.ok) {
          const result = await response.json();
          return result.teamMembers || [];
        }
      } catch (backendError) {
        console.warn('[CoreTeamManagement] Backend unavailable, falling back to direct Supabase:', backendError);
      }
      
      // Fallback to direct Supabase query
      const { data, error } = await supabase
        .from("core_team")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      
      return (data || []) as CoreTeamMember[];
    },
  });

  // Note: Avatar sync functionality removed since email field doesn't exist in core_team table

  // Add member mutation
  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("core_team").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["core-team"] });
      toast({
        title: "Success!",
        description: "Team member added successfully.",
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add team member",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    },
  });

  // Update member mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("core_team")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["core-team"] });
      toast({
        title: "Success!",
        description: "Team member updated successfully.",
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update team member",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    },
  });

  // Delete member mutation with automatic reordering
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First, get the display order of the member being deleted
      const { data: memberToDelete, error: fetchError } = await supabase
        .from("core_team")
        .select("display_order")
        .eq("id", id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const deletedDisplayOrder = memberToDelete.display_order;
      
      // Delete the member
      const { error: deleteError } = await supabase
        .from("core_team")
        .delete()
        .eq("id", id);
      
      if (deleteError) throw deleteError;
      
      // Update all members with higher display orders to shift down by 1
      if (deletedDisplayOrder !== null && deletedDisplayOrder !== undefined) {
        const { error: updateError } = await supabase
          .from("core_team")
          .update({ 
            display_order: supabase.rpc('decrement_display_order', { current_order: deletedDisplayOrder })
          })
          .gt("display_order", deletedDisplayOrder);
        
        // If RPC doesn't work, use a simpler approach
        if (updateError) {
          // Get all members with higher display orders
          const { data: membersToUpdate, error: getMembersError } = await supabase
            .from("core_team")
            .select("id, display_order")
            .gt("display_order", deletedDisplayOrder);
          
          if (getMembersError) throw getMembersError;
          
          // Update each member individually
          for (const member of membersToUpdate || []) {
            const { error: individualUpdateError } = await supabase
              .from("core_team")
              .update({ display_order: member.display_order - 1 })
              .eq("id", member.id);
            
            if (individualUpdateError) throw individualUpdateError;
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["core-team"] });
      toast({
        title: "Success!",
        description: "Team member deleted and display orders updated automatically.",
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });
      setDeleteConfirmOpen(false);
      setMemberToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete team member",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      full_name: "",
      position: "",
      branch: "",
      skills: "",
      instagram_url: "",
      linkedin_url: "",
      whatsapp_url: "",
      is_leadership: false,
      is_active: true,
      display_order: 0,
      avatar_url: "",
    });
    setPhotoPreview(null);
  };


  const handleAdd = async () => {
    // Automatically determine is_leadership based on position
    const isLeadership = formData.position === "President" || formData.position === "Vice President";
    
    // Check if display order already exists
    const targetDisplayOrder = formData.display_order || 0;
    const conflictingMember = members?.find(m => m.display_order === targetDisplayOrder);
    
    if (conflictingMember) {
      // Shift all members with display_order >= targetDisplayOrder by 1
      try {
        const membersToShift = members?.filter(m => (m.display_order || 0) >= targetDisplayOrder) || [];
        
        // Update in reverse order to avoid conflicts
        for (const member of membersToShift.reverse()) {
          await supabase
            .from("core_team")
            .update({ display_order: (member.display_order || 0) + 1 })
            .eq("id", member.id);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to adjust display orders",
          variant: "destructive",
          className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
        });
        return;
      }
    }
    
    const memberData = {
      full_name: formData.full_name,
      position: formData.position,
      branch: formData.branch,
      skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
      instagram_url: formData.instagram_url || null,
      linkedin_url: formData.linkedin_url || null,
      whatsapp_url: formData.whatsapp_url || null,
      is_leadership: isLeadership,
      is_active: true, // All registered core members are active
      display_order: targetDisplayOrder,
    };
    addMutation.mutate(memberData);
  };

  const handleEdit = async () => {
    if (!selectedMember || !members) return;
    
    const newDisplayOrder = formData.display_order;
    const oldDisplayOrder = originalDisplayOrder;
    
    // Only handle display order changes if it actually changed
    if (newDisplayOrder !== oldDisplayOrder) {
      const memberAtTargetPosition = members.find(m => 
        m.display_order === newDisplayOrder && m.id !== selectedMember.id
      );
      
      if (memberAtTargetPosition) {
        // Swap positions: give the conflicting member the old position
        try {
          const { error: swapError } = await supabase
            .from("core_team")
            .update({ display_order: oldDisplayOrder })
            .eq("id", memberAtTargetPosition.id);
          
          if (swapError) throw swapError;
          
          toast({
            title: "Positions Swapped",
            description: `Swapped display order with ${memberAtTargetPosition.full_name}`,
            className: "bg-blue-600 border-blue-700 text-white shadow-xl backdrop-blur-md",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to swap display orders",
            variant: "destructive",
            className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
          });
          return;
        }
      }
    }
    
    // Automatically determine is_leadership based on position
    const isLeadership = formData.position === "President" || formData.position === "Vice President";
    
    // IMPORTANT: Only update fields that should change, preserve display_order
    const memberData = {
      full_name: formData.full_name,
      position: formData.position,
      branch: formData.branch,
      skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
      instagram_url: formData.instagram_url || null,
      linkedin_url: formData.linkedin_url || null,
      whatsapp_url: formData.whatsapp_url || null,
      is_leadership: isLeadership,
      is_active: true, // All registered core members are active
      display_order: newDisplayOrder, // Use the new display order (which might be same as old)
    };
    updateMutation.mutate({ id: selectedMember.id, data: memberData });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedMember) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload only JPEG, PNG, WebP, or GIF images.",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
      return;
    }

    try {
      setUploadingPhoto(true);

      const compressedFile = await compressImage(file);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `core-team/${selectedMember.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      if (formData.avatar_url) {
        const oldPath = formData.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`core-team/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData({ ...formData, avatar_url: publicUrl });
      setPhotoPreview(publicUrl);

      const { error: updateError } = await supabase
        .from('core_team')
        .update({ avatar_url: publicUrl })
        .eq('id', selectedMember.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["core-team"] });

      toast({
        title: "Success!",
        description: "Profile photo updated successfully.",
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });
    } catch (error: any) {
      console.error('Photo upload error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddFaculty = () => {
    const memberData = {
      full_name: formData.full_name,
      position: "Faculty Coordinator",
      branch: formData.branch,
      skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
      instagram_url: formData.instagram_url || null,
      linkedin_url: formData.linkedin_url || null,
      whatsapp_url: formData.whatsapp_url || null,
      is_leadership: false, // Faculty are not leadership
      is_active: formData.is_active,
      display_order: formData.display_order,
    };
    addMutation.mutate(memberData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 sm:w-8 sm:h-8" />
            Core Management
          </h2>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Manage your core team members and their profile synchronization
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Core Member</span>
            <span className="sm:hidden">Add Member</span>
          </Button>
        </div>
      </div>

      {/* Team Members Display */}
      <div className="space-y-8 -mx-4 sm:mx-0 px-4 sm:px-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading team members...</span>
          </div>
        ) : members && members.length > 0 ? (
          <>
            {/* Leadership Team Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                Leadership Team
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.filter(member => member.is_leadership).map((member) => (
                  <Card key={member.id} className="member-card leadership relative group transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-8 relative z-10">
                      <div className="member-image">
                        <div className="placeholder-avatar" style={{ background: 'linear-gradient(45deg, #ffd700, #ffed4e)', color: '#000' }}>
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <Crown className="w-12 h-12" />
                          )}
                        </div>
                      </div>
                      <div className="member-info">
                        <h3 className="member-role">{member.position}</h3>
                        <h4 className="member-name">{member.full_name}</h4>
                        <p className="member-department">{member.branch}</p>
                        <div className="member-skills">
                          {member.skills?.slice(0, 3).map((skill, index) => (
                            <span key={index} className="skill">{skill}</span>
                          )) || []}
                          {member.skills && member.skills.length > 3 && (
                            <span className="skill" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>+{member.skills.length - 3}</span>
                          )}
                        </div>

                        <div className="mt-4 flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setOriginalDisplayOrder(member.display_order || 0);
                              setFormData({
                                full_name: member.full_name || "",
                                position: member.position,
                                branch: member.branch || "",
                                skills: member.skills?.join(", ") || "",
                                instagram_url: member.instagram_url || "",
                                linkedin_url: member.linkedin_url || "",
                                whatsapp_url: member.whatsapp_url || "",
                                is_leadership: member.is_leadership,
                                is_active: member.is_active ?? true,
                                display_order: member.display_order || 0,
                                avatar_url: member.avatar_url || "",
                              });
                              setPhotoPreview(member.avatar_url || null);
                              setIsEditDialogOpen(true);
                            }}
                            className="social-link" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)' }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setMemberToDelete(member.id);
                              setDeleteConfirmOpen(true);
                            }}
                            className="social-link" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {members.filter(member => member.is_leadership).length === 0 && (
                <p className="text-muted-foreground text-center py-8">No leadership team members found.</p>
              )}
            </div>

            {/* Core Members Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Core Members
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.filter(member => !member.is_leadership && !member.position.toLowerCase().includes('faculty') && !member.position.toLowerCase().includes('coordinator')).map((member) => (
                  <Card key={member.id} className="member-card leadership relative group transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-8 relative z-10">
                      <div className="member-image">
                        <div className="placeholder-avatar">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <User className="w-12 h-12" />
                          )}
                        </div>
                      </div>
                      <div className="member-info">
                        <h3 className="member-role">{member.position}</h3>
                        <h4 className="member-name">{member.full_name}</h4>
                        <p className="member-department">{member.branch}</p>
                        <div className="member-skills">
                          {member.skills?.slice(0, 3).map((skill, index) => (
                            <span key={index} className="skill">{skill}</span>
                          )) || []}
                          {member.skills && member.skills.length > 3 && (
                            <span className="skill" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>+{member.skills.length - 3}</span>
                          )}
                        </div>
                        <div className="member-social" style={{ marginTop: '1.5rem', gap: '0.5rem' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setOriginalDisplayOrder(member.display_order || 0);
                              setFormData({
                                full_name: member.full_name || "",
                                position: member.position,
                                branch: member.branch || "",
                                skills: member.skills?.join(", ") || "",
                                instagram_url: member.instagram_url || "",
                                linkedin_url: member.linkedin_url || "",
                                whatsapp_url: member.whatsapp_url || "",
                                is_leadership: member.is_leadership,
                                is_active: member.is_active ?? true,
                                display_order: member.display_order || 0,
                                avatar_url: member.avatar_url || "",
                              });
                              setPhotoPreview(member.avatar_url || null);
                              setIsEditDialogOpen(true);
                            }}
                            className="social-link" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)' }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setMemberToDelete(member.id);
                              setDeleteConfirmOpen(true);
                            }}
                            className="social-link" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {members.filter(member => !member.is_leadership && !member.position.toLowerCase().includes('faculty') && !member.position.toLowerCase().includes('coordinator')).length === 0 && (
                <p className="text-muted-foreground text-center py-8">No core members found.</p>
              )}
            </div>

            {/* Faculty Coordinators Section */}
            <div>
              <div className="flex items-center justify-between mb-4 gap-2">
                <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2 flex-1 min-w-0">
                  <GraduationCap className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="truncate">Faculty Coordinators</span>
                </h3>
                <Button 
                  onClick={() => { resetForm(); setIsFacultyDialogOpen(true); }} 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Faculty Coordinator</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {members.filter(member => member.position.toLowerCase().includes('faculty') || member.position.toLowerCase().includes('coordinator')).map((member) => (
                  <Card key={member.id} className="member-card leadership faculty relative group transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-8 relative z-10">
                      <div className="member-image">
                        <div className="placeholder-avatar" style={{ background: 'linear-gradient(135deg, #daa520, #b8860b)', color: '#fff' }}>
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <GraduationCap className="w-12 h-12" />
                          )}
                        </div>
                      </div>
                      <div className="member-info">
                        <h3 className="member-role" style={{ color: '#daa520' }}>{member.position}</h3>
                        <h4 className="member-name" style={{ color: '#daa520' }}>{member.full_name}</h4>
                        <p className="member-department" style={{ color: 'rgba(218, 165, 32, 0.7)' }}>{member.branch}</p>
                        <div className="member-skills">
                          {member.skills?.slice(0, 3).map((skill, index) => (
                            <span key={index} className="skill" style={{ background: 'rgba(218, 165, 32, 0.15)', color: '#daa520', border: '1px solid rgba(218, 165, 32, 0.3)' }}>{skill}</span>
                          )) || []}
                          {member.skills && member.skills.length > 3 && (
                            <span className="skill" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>+{member.skills.length - 3}</span>
                          )}
                        </div>

                        <div className="member-social" style={{ marginTop: '1.5rem', gap: '0.5rem' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setOriginalDisplayOrder(member.display_order || 0);
                              setFormData({
                                full_name: member.full_name || "",
                                position: member.position,
                                branch: member.branch || "",
                                skills: member.skills?.join(", ") || "",
                                instagram_url: member.instagram_url || "",
                                linkedin_url: member.linkedin_url || "",
                                whatsapp_url: member.whatsapp_url || "",
                                is_leadership: member.is_leadership,
                                is_active: member.is_active ?? true,
                                display_order: member.display_order || 0,
                                avatar_url: member.avatar_url || "",
                              });
                              setPhotoPreview(member.avatar_url || null);
                              setIsEditDialogOpen(true);
                            }}
                            className="social-link" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)' }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setMemberToDelete(member.id);
                              setDeleteConfirmOpen(true);
                            }}
                            className="social-link" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {members.filter(member => member.position.toLowerCase().includes('faculty') || member.position.toLowerCase().includes('coordinator')).length === 0 && (
                <p className="text-muted-foreground text-center py-8">No faculty coordinators found.</p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No team members found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first team member to get started
            </p>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl mt-[5vh]">
          <DialogHeader>
            <DialogTitle>Add Core Member</DialogTitle>
            <DialogDescription>
              Add a new member to the BLOTIC core team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-full-name">Full Name</Label>
                <Input
                  id="add-full-name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-position">Position</Label>
                <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="space-y-2 sm:col-span-9">
                <Label htmlFor="add-branch">Department</Label>
                <Input
                  id="add-branch"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="Enter department"
                />
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label htmlFor="add-display-order">Display Order</Label>
                <Input
                  id="add-display-order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  placeholder="Enter display order"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-skills">Skills (comma-separated)</Label>
              <Input
                id="add-skills"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="Enter skills separated by commas"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-instagram">Instagram URL</Label>
                <Input
                  id="add-instagram"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="Instagram profile URL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-linkedin">LinkedIn URL</Label>
                <Input
                  id="add-linkedin"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="LinkedIn profile URL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-whatsapp">WhatsApp Number</Label>
                <Input
                  id="add-whatsapp"
                  value={formData.whatsapp_url}
                  onChange={(e) => setFormData({ ...formData, whatsapp_url: e.target.value })}
                  placeholder="WhatsApp number (e.g., +919876543210)"
                />
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Edit Core Member</DialogTitle>
            <DialogDescription>
              Update the core member information
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 overflow-y-auto max-h-[calc(90vh-220px)]">
            {/* Left Side - Profile Section */}
            <div className="md:w-1/3 flex flex-col items-center space-y-3 md:space-y-4 p-4 md:p-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/30 shrink-0">
              <div className="relative group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg overflow-hidden">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt={formData.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : formData.position === 'President' ? (
                    <Crown className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  ) : formData.position.toLowerCase().includes('faculty') ? (
                    <GraduationCap className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  ) : formData.is_leadership ? (
                    <Crown className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  ) : (
                    <User className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 p-2 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg transition-all disabled:opacity-50"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              <div className="text-center space-y-1 md:space-y-2">
                <h3 className="font-bold text-lg md:text-xl text-white">{formData.full_name || 'Member Name'}</h3>
                <p className="text-purple-400 font-semibold text-xs md:text-sm uppercase tracking-wide">{formData.position || 'Position'}</p>
                {formData.branch && (
                  <p className="text-gray-300 text-sm">{formData.branch}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {formData.is_leadership && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <Crown className="w-3 h-3" />
                    Leadership
                  </span>
                )}
                {formData.is_active && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* Right Side - Form Fields */}
            <div className="md:w-2/3 space-y-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-full-name">Full Name</Label>
                <Input
                  id="edit-full-name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-position">Position</Label>
                <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="space-y-2 sm:col-span-9">
                <Label htmlFor="edit-branch">Department</Label>
                <Input
                  id="edit-branch"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="Enter department"
                />
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label htmlFor="edit-display-order">Display Order</Label>
                <Input
                  id="edit-display-order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  placeholder="Enter display order"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-skills">Skills (comma-separated)</Label>
              <Input
                id="edit-skills"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="Enter skills separated by commas"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-instagram">Instagram URL</Label>
                <Input
                  id="edit-instagram"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="Instagram profile URL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-linkedin">LinkedIn URL</Label>
                <Input
                  id="edit-linkedin"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="LinkedIn profile URL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-whatsapp">WhatsApp Number</Label>
                <Input
                  id="edit-whatsapp"
                  value={formData.whatsapp_url}
                  onChange={(e) => setFormData({ ...formData, whatsapp_url: e.target.value })}
                  placeholder="WhatsApp number (e.g., +919876543210)"
                />
              </div>
            </div>

            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Faculty Coordinator Dialog */}
      <Dialog open={isFacultyDialogOpen} onOpenChange={setIsFacultyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-green-600" />
              Add Faculty Coordinator
            </DialogTitle>
            <DialogDescription>
              Add a new faculty coordinator to the core team
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="faculty-full-name">Full Name</Label>
              <Input
                id="faculty-full-name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty-branch">Branch</Label>
              <Input
                id="faculty-branch"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                placeholder="Enter branch"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty-display-order">Display Order</Label>
              <Input
                id="faculty-display-order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                placeholder="Enter display order"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty-skills">Skills (comma-separated)</Label>
              <Input
                id="faculty-skills"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="Enter skills separated by commas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty-linkedin">LinkedIn URL</Label>
              <Input
                id="faculty-linkedin"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="LinkedIn profile URL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty-instagram">Instagram URL</Label>
              <Input
                id="faculty-instagram"
                value={formData.instagram_url}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                placeholder="Instagram profile URL"
              />
            </div>
            <div className="flex items-center space-x-2 md:col-span-2">
              <input
                type="checkbox"
                id="faculty-is-active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="faculty-is-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFacultyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => { handleAddFaculty(); setIsFacultyDialogOpen(false); }} disabled={addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Add Faculty Coordinator"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this team member. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToDelete && deleteMutation.mutate(memberToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default CoreTeamManagement;
