import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useUploadProgressContext } from "@/contexts/UploadProgressContext";
import { Upload, Trash2, Edit, Star, StarOff, Image as ImageIcon, X, Save, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { compressImage } from "@/utils/imageCompression";

interface EventPhoto {
  id: string;
  event_id: string;
  photo_url: string;
  title?: string;
  description?: string;
  uploaded_by?: string;
  upload_date: string;
  file_name?: string;
  file_size?: number;
  is_featured: boolean;
  display_order: number;
  profiles?: {
    full_name?: string;
  };
}

interface EventGalleryManagementProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const EventGalleryManagement = ({ eventId, eventTitle, isOpen, onClose }: EventGalleryManagementProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isSuperAdmin, isCore } = useRoleCheck();
  const { addUpload, updateUpload } = useUploadProgressContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editingPhoto, setEditingPhoto] = useState<EventPhoto | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Check if user can manage photos (admin or core)
  const canManagePhotos = isSuperAdmin() || isCore();

  // Fetch event photos
  const { data: photos = [], isLoading, refetch } = useQuery<EventPhoto[]>({
    queryKey: ["event-photos-admin", eventId],
    queryFn: async () => {
      console.log("[EventGalleryAdmin] Fetching photos for event:", eventId);
      const { data, error } = await supabase
        .from("event_photos")
        .select("*")
        .eq("event_id", eventId)
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true })
        .order("upload_date", { ascending: false });
      
      if (error) {
        console.error("[EventGalleryAdmin] Query error:", error);
        throw error;
      }
      console.log("[EventGalleryAdmin] Fetched", data?.length, "photos");
      return data || [];
    },
    enabled: isOpen && !!eventId,
  });

  // Upload photo mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      if (!canManagePhotos) {
        throw new Error("You don't have permission to upload photos");
      }

      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Add small delay between files to ensure unique timestamps
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`Unsupported file type: ${file.type}`);
        }

        // Validate file size (10MB limit for original file)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
        }

        // Add upload to progress dialog
        const uploadId = addUpload(file);

        try {
          updateUpload(uploadId, { status: 'uploading', progress: 10 });

          // Compress image before upload (max 1MB, max 1920px)
          console.log("[EventGallery] Compressing image:", file.name);
          const compressedFile = await compressImage(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            quality: 0.85
          });

          updateUpload(uploadId, { status: 'uploading', progress: 30 });

          const fileExt = file.name.split('.').pop();
          // Create a clean event title for filename
          const cleanEventTitle = eventTitle
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);
          
          // Generate unique timestamp for each file to prevent overwrites
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const fileName = `${cleanEventTitle}/${cleanEventTitle}-${timestamp}-${randomSuffix}.${fileExt}`;

          console.log("[EventGallery] Uploading compressed image:", fileName);
          updateUpload(uploadId, { status: 'uploading', progress: 40 });

          // Upload compressed file to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('event-photos')
            .upload(fileName, compressedFile, { upsert: true });

          if (uploadError) {
            console.error("[EventGallery] Upload failed:", uploadError);
            updateUpload(uploadId, { status: 'error', error: `Upload failed: ${uploadError.message}` });
            throw uploadError;
          }

          updateUpload(uploadId, { status: 'uploading', progress: 80 });

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('event-photos')
            .getPublicUrl(fileName);

          // Insert photo record into database
          const { error: dbError } = await supabase
            .from('event_photos')
            .insert({
              event_id: eventId,
              photo_url: publicUrl,
              file_name: file.name,
              file_size: file.size,
              uploaded_by: user?.id,
              display_order: 0,
            });

          if (dbError) {
            console.error("[EventGallery] Database insert error:", dbError);
            updateUpload(uploadId, { status: 'error', error: `Database error: ${dbError.message}` });
            throw dbError;
          }

          updateUpload(uploadId, { status: 'completed', progress: 100 });
          return { fileName, publicUrl };
        } catch (error) {
          updateUpload(uploadId, { status: 'error', error: error.message });
          throw error;
        }
      });

      return Promise.all(uploadPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-photos-admin", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-photos-public", eventId] });
      refetch(); // Force immediate refresh
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      console.error("[EventGallery] Upload error:", error);
      // Let the global upload progress system handle error notifications
    },
  });

  // Delete photo mutation
  const deleteMutation = useMutation({
    mutationFn: async (photo: EventPhoto) => {
      if (!canManagePhotos) {
        throw new Error("You don't have permission to delete photos");
      }

      // Delete from storage
      // Extract the full path from the URL (everything after the bucket name)
      const urlParts = photo.photo_url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'event-photos');
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        console.log("[EventGallery] Attempting to delete file:", filePath);
        const { error: storageError } = await supabase.storage
          .from('event-photos')
          .remove([filePath]);
        
        if (storageError) {
          console.error("[EventGallery] Storage delete error:", storageError);
        } else {
          console.log("[EventGallery] Successfully deleted file:", filePath);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('event_photos')
        .delete()
        .eq('id', photo.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-photos-admin", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-photos-public", eventId] });
      refetch(); // Force immediate refresh
      toast({
        title: "Photo deleted",
        description: "The photo has been removed from the gallery.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update photo mutation
  const updateMutation = useMutation({
    mutationFn: async ({ photoId, updates }: { photoId: string; updates: Partial<EventPhoto> }) => {
      const { error } = await supabase
        .from('event_photos')
        .update(updates)
        .eq('id', photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-photos-admin", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-photos-public", eventId] });
      refetch(); // Force immediate refresh
      setIsEditDialogOpen(false);
      setEditingPhoto(null);
      toast({
        title: "Photo updated",
        description: "Photo details have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadMutation.mutate(files);
    }
  };

  const handleEditPhoto = (photo: EventPhoto) => {
    setEditingPhoto(photo);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPhoto) return;

    const formData = new FormData(e.currentTarget);
    const updates = {
      title: formData.get('title') as string || null,
      description: formData.get('description') as string || null,
      is_featured: formData.get('is_featured') === 'on',
      display_order: parseInt(formData.get('display_order') as string) || 0,
    };

    updateMutation.mutate({ photoId: editingPhoto.id, updates });
  };

  const toggleFeatured = (photo: EventPhoto) => {
    updateMutation.mutate({
      photoId: photo.id,
      updates: { is_featured: !photo.is_featured }
    });
  };

  if (!canManagePhotos) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl mt-[15vh]">
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
            <DialogDescription>
              You don't have permission to manage event galleries. Only admin and core team members can upload photos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose} variant="outline">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] h-[100vh] flex flex-col bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl z-50 [&>button]:text-red-500 [&>button]:hover:text-red-600 [&>button]:hover:bg-red-500/10 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2 text-2xl sm:text-3xl">
                    <ImageIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                    {eventTitle}
                  </DialogTitle>
                  <DialogDescription className="mt-2">
                    Upload and manage photos for this event
                  </DialogDescription>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary">
                    {isLoading ? '...' : photos?.length || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {photos?.length === 1 ? 'Photo' : 'Photos'} in Gallery
                  </div>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  <strong>Maximum file size:</strong> 10MB per photo. <strong>Supported formats:</strong> JPG, PNG, GIF, and WebP. Select multiple files to upload at once.
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading photos...</p>
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">No photos in this event yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload your first photo to get started
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-green-500/30 bg-green-50/10 shadow-md hover:shadow-xl transition-shadow">
                      <img
                        src={photo.photo_url}
                        alt={photo.title || 'Event photo'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.svg";
                        }}
                      />
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-green-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium shadow-md">
                        LIVE
                      </div>
                      {photo.is_featured && (
                        <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-yellow-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Featured
                        </div>
                      )}
                    </div>
                    
                    {/* Mobile Action Buttons - Always Visible */}
                    <div className="absolute bottom-1 right-1 sm:hidden flex gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(photo)}
                        disabled={deleteMutation.isPending}
                        className="h-7 w-7 p-0 shadow-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Desktop Hover Overlay */}
                    <div className="hidden sm:flex absolute inset-0 bg-black/60 backdrop-blur-sm items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(photo)}
                        disabled={deleteMutation.isPending}
                        className="gap-1 shadow-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                    
                    <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-center truncate font-medium" title={photo.title || 'Event photo'}>
                      {photo.title || 'Untitled'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fixed Bottom Action Bar */}
          <div className="border-t border-border bg-background px-6 py-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground hidden sm:block">
                {photos && photos.length > 0 ? `Managing ${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}` : 'No photos to manage'}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 gap-2 order-1"
                >
                  <Upload className="w-4 h-4" />
                  {uploadMutation.isPending ? "Uploading..." : "Upload Photos"}
                </Button>
                <Button 
                  onClick={onClose}
                  variant="outline"
                  className="w-full sm:w-auto gap-2 order-2"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Photo Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl mt-[15vh]">
          <DialogHeader>
            <DialogTitle>Edit Photo Details</DialogTitle>
          </DialogHeader>
          {editingPhoto && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingPhoto.title || ''}
                  placeholder="Enter photo title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingPhoto.description || ''}
                  placeholder="Enter photo description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  name="display_order"
                  type="number"
                  defaultValue={editingPhoto.display_order}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  name="is_featured"
                  defaultChecked={editingPhoto.is_featured}
                  className="rounded"
                />
                <Label htmlFor="is_featured">Featured photo</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventGalleryManagement;
