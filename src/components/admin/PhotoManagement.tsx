import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useUploadProgressContext } from "@/contexts/UploadProgressContext";
import { Trash2, Upload, Image as ImageIcon, Eye, EyeOff, AlertTriangle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { compressImage } from "@/utils/imageCompression";

const PhotoManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addUpload, updateUpload, uploads } = useUploadProgressContext();
  const alertCallbackRef = useRef<{
    onConfirm?: (inputValue?: string) => void;
    onCancel?: () => void;
    id?: string;
  }>({});
  const [uploading, setUploading] = useState(false);
  
  // Custom alert dialog states
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    type: 'warning' | 'confirmation' | 'input';
    title: string;
    message: string;
    inputPlaceholder?: string;
    inputValue?: string;
    onConfirm?: (inputValue?: string) => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel'
  });

  // Custom alert helper functions
  const showAlert = useCallback((title: string, message: string, onConfirm?: () => void) => {
    alertCallbackRef.current = { onConfirm, onCancel: undefined };
    setAlertDialog({
      isOpen: true,
      type: 'warning',
      title,
      message,
      confirmText: 'OK',
      cancelText: 'Cancel'
    });
  }, []);

  const showConfirmation = useCallback((title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    const callbackId = Date.now().toString();
    console.log('[PhotoManagement] Setting up confirmation with ID:', callbackId);
    alertCallbackRef.current = { onConfirm, onCancel, id: callbackId };
    setAlertDialog({
      isOpen: true,
      type: 'confirmation',
      title,
      message,
      confirmText: 'Yes',
      cancelText: 'No'
    });
  }, []);

  const showInputDialog = useCallback((title: string, message: string, placeholder: string, onConfirm: (value: string) => void, onCancel?: () => void) => {
    alertCallbackRef.current = { onConfirm, onCancel };
    setAlertDialog({
      isOpen: true,
      type: 'input',
      title,
      message,
      inputPlaceholder: placeholder,
      inputValue: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    });
  }, []);

  const closeAlert = () => {
    setAlertDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleAlertConfirm = () => {
    console.log('[PhotoManagement] ===== ALERT CONFIRM CLICKED =====');
    console.log('[PhotoManagement] alertCallbackRef.current:', alertCallbackRef.current);
    console.log('[PhotoManagement] Callback ID:', alertCallbackRef.current.id);
    console.log('[PhotoManagement] onConfirm exists:', !!alertCallbackRef.current.onConfirm);
    console.log('[PhotoManagement] alertDialog.type:', alertDialog.type);
    console.log('[PhotoManagement] alertDialog.inputValue:', alertDialog.inputValue);
    
    const callback = alertCallbackRef.current.onConfirm;
    if (callback) {
      console.log('[PhotoManagement] About to execute callback function');
      console.log('[PhotoManagement] Callback function:', callback.toString().substring(0, 100));
      try {
        callback(alertDialog.inputValue);
        console.log('[PhotoManagement] ✅ Callback executed successfully');
      } catch (error) {
        console.error('[PhotoManagement] ❌ Error executing callback:', error);
      }
    } else {
      console.log('[PhotoManagement] ❌ No callback function found!');
    }
    closeAlert();
  };

  const handleAlertCancel = () => {
    console.log('[PhotoManagement] Alert cancel clicked, onCancel exists:', !!alertCallbackRef.current.onCancel);
    if (alertCallbackRef.current.onCancel) {
      alertCallbackRef.current.onCancel();
    }
    closeAlert();
  };

  // Fetch photos from both Supabase storage and the live website gallery
  const { data: photos, isLoading } = useQuery({
    queryKey: ["gallery-photos"],
    queryFn: async () => {
      try {
        // First, get photos from Supabase storage
        const { data: storageFiles, error: storageError } = await supabase.storage
          .from('gallery')
          .list('', {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (storageError) {
          console.error("Error fetching storage photos:", storageError);
        }

        // All photos in storage are considered live (since we removed archive functionality)
        const allPhotos = [];
        
        // Add storage photos
        if (storageFiles) {
          storageFiles.forEach((file) => {
            const publicUrl = supabase.storage.from('gallery').getPublicUrl(file.name).data.publicUrl;
            
            // Extract original filename for display
            const originalTitle = file.name.replace(/^\d+-[a-z0-9]+-/, '').replace(/\.[^/.]+$/, "").replace(/_/g, ' ');
            
            allPhotos.push({
              id: file.id || file.name,
              name: file.name,
              url: publicUrl,
              title: originalTitle || file.name.replace(/\.[^/.]+$/, ""),
              source: 'storage',
              isLive: true // All photos are live since we removed archive functionality
            });
          });
        }

        return allPhotos;
      } catch (error) {
        console.error("Error fetching gallery photos:", error);
        return [];
      }
    },
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    gcTime: 1000, // Keep cache for only 1 second
  });

  // Helper function to check if file format is supported by web browsers
  const isWebSupported = (file: File): boolean => {
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    return supportedTypes.includes(file.type);
  };

  // Upload file to Supabase storage with progress tracking
  const uploadFile = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const originalName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9_-]/g, '_'); // Sanitize for storage
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${sanitizedName}.${fileExt}`;

    console.log('[PhotoManagement] Uploading file:', fileName, 'Original:', file.name);

    // Start progress tracking
    if (onProgress) {
      onProgress(0);
    }

    // Show initial progress
    if (onProgress) {
      onProgress(10);
    }

    // Compress image before upload (max 1MB, max 1920px)
    console.log('[PhotoManagement] Compressing image:', file.name);
    const compressedFile = await compressImage(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      quality: 0.85
    });

    if (onProgress) {
      onProgress(40);
    }

    const { data, error } = await supabase.storage
      .from('gallery')
      .upload(fileName, compressedFile);

    if (error) {
      console.error('[PhotoManagement] Upload failed:', error);
      throw error;
    }

    // Ensure progress reaches 100% on successful upload
    if (onProgress) {
      onProgress(90);
      await new Promise(resolve => setTimeout(resolve, 100));
      onProgress(100);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('gallery')
      .getPublicUrl(fileName);

    return publicUrl;
  };



  // Function to check for duplicates
  const checkForDuplicates = async (files: File[]) => {
    const duplicates = [];
    const validFiles = [];
    
    console.log('[PhotoManagement] Checking duplicates for files:', files.map(f => f.name));
    console.log('[PhotoManagement] Existing photos:', photos?.map(p => ({ name: p.name, title: p.title })));
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let isDuplicate = false;
      
      // Check against existing photos in storage
      if (photos) {
        for (const existingPhoto of photos) {
          // Extract original filename from stored filename
          // New pattern: timestamp-randomstring-originalname.ext
          const existingCleanName = existingPhoto.name.replace(/^\d+-[a-z0-9]+-/, '');
          // Also handle the sanitized name by converting back
          const existingOriginalName = existingCleanName.replace(/_/g, ' ').replace(/\.[^/.]+$/, "");
          
          console.log(`[PhotoManagement] Comparing "${file.name}" with existing "${existingPhoto.name}" -> clean: "${existingCleanName}" -> original: "${existingOriginalName}"`);
          
          // Check by exact file name match
          if (file.name === existingCleanName) {
            console.log(`[PhotoManagement] Found duplicate by filename: ${file.name}`);
            duplicates.push(`${file.name} (already exists)`);
            isDuplicate = true;
            break;
          }
          
          // Check by original filename (without extension)
          const fileBaseName = file.name.replace(/\.[^/.]+$/, "");
          const sanitizedFileBaseName = fileBaseName.replace(/[^a-zA-Z0-9_-]/g, '_');
          
          // Compare with the sanitized version stored in filename
          const storedBaseName = existingPhoto.name.replace(/^\d+-[a-z0-9]+-/, '').replace(/\.[^/.]+$/, "");
          
          if (sanitizedFileBaseName === storedBaseName || fileBaseName === existingOriginalName) {
            console.log(`[PhotoManagement] Found duplicate by base name: ${file.name} matches stored ${storedBaseName}`);
            duplicates.push(`${file.name} (duplicate content)`);
            isDuplicate = true;
            break;
          }
        }
      }
      
      // Also check for duplicates within the current upload batch
      for (let j = 0; j < i; j++) {
        const otherFile = files[j];
        if (file.name === otherFile.name || 
            (file.size === otherFile.size && 
             file.name.replace(/\.[^/.]+$/, "") === otherFile.name.replace(/\.[^/.]+$/, ""))) {
          duplicates.push(`${file.name} (duplicate in batch)`);
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        validFiles.push(file);
      }
    }
    
    console.log('[PhotoManagement] Duplicate detection results:', { duplicates, validFilesCount: validFiles.length });
    return { duplicates, validFiles };
  };

  // Process files with pre-assigned upload IDs
  const processFilesWithIds = async (fileUploadPairs: { file: File; uploadId: string }[]) => {
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      // Upload all files
      for (let i = 0; i < fileUploadPairs.length; i++) {
        const { file, uploadId } = fileUploadPairs[i];
        console.log(`[PhotoManagement] Uploading file ${i + 1}/${fileUploadPairs.length}:`, file.name);

        const url = await uploadFile(file, (progress) => {
          updateUpload(uploadId, { progress, status: 'uploading' });
        });

        uploadedUrls.push(url);
        
        // Immediately refresh gallery after each successful upload
        queryClient.invalidateQueries({ queryKey: ["gallery-photos"] });
        queryClient.invalidateQueries({ queryKey: ["gallery-photos-public"] });
        
        // Ensure final status update after upload completion
        await new Promise(resolve => setTimeout(resolve, 50));
        updateUpload(uploadId, { progress: 100, status: 'completed' });
        console.log(`[PhotoManagement] Successfully uploaded:`, file.name);
      }

      // Refresh gallery and show success
      queryClient.invalidateQueries({ queryKey: ["gallery-photos"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-photos-public"] });

      // Success notification now handled by upload progress dialog

    } catch (error) {
      console.error('[PhotoManagement] Error processing files:', error);
      toast({
        title: "Upload Failed",
        description: `Failed to upload photos: ${error.message}`,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    } finally {
      setUploading(false);
    }
  };

  // Process files for upload (simplified - no conversion)
  const processFiles = async (files: File[], createProgressItems: boolean = true) => {
    // Create upload progress items for all files (unless already created)
    const uploadIds = createProgressItems ? files.map(file => addUpload(file)) : [];

    try {
      const uploadedUrls: string[] = [];

      // Upload all files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let uploadId: string;
        
        if (createProgressItems) {
          uploadId = uploadIds[i];
        } else {
          // Find existing upload item by filename
          const existingUpload = uploads.find(upload => upload.name === file.name);
          if (!existingUpload) {
            console.error(`[PhotoManagement] Could not find existing upload item for: ${file.name}`);
            // Skip this file if we can't find its upload item
            continue;
          }
          uploadId = existingUpload.id;
        }
        
        console.log(`[PhotoManagement] Uploading file ${i + 1}/${files.length}:`, file.name);

        const url = await uploadFile(file, (progress) => {
          updateUpload(uploadId, { progress, status: 'uploading' });
        });

        uploadedUrls.push(url);
        
        // Immediately refresh gallery after each successful upload
        queryClient.invalidateQueries({ queryKey: ["gallery-photos"] });
        queryClient.invalidateQueries({ queryKey: ["gallery-photos-public"] });
        
        // Ensure final status update after upload completion
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay to ensure progress updates complete
        updateUpload(uploadId, { progress: 100, status: 'completed' });
        console.log(`[PhotoManagement] Successfully uploaded:`, file.name);
      }

      // Refresh gallery and show success
      queryClient.invalidateQueries({ queryKey: ["gallery-photos"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-photos-public"] });

      // Wait a moment for the query to refresh, then check for post-upload duplicates
      setTimeout(async () => {
        try {
          console.log('[PhotoManagement] Performing post-upload duplicate check...');
          
          // Refetch the latest photos to check for duplicates that might have been uploaded by others
          const latestPhotos = await queryClient.fetchQuery({
            queryKey: ["gallery-photos"],
            queryFn: async () => {
              const { data: storageFiles, error: storageError } = await supabase.storage
                .from('gallery')
                .list('', {
                  limit: 100,
                  sortBy: { column: 'name', order: 'asc' }
                });

              if (storageError) {
                console.error("Error fetching storage photos:", storageError);
                return [];
              }

              const allPhotos = [];
              if (storageFiles) {
                storageFiles.forEach((file) => {
                  const publicUrl = supabase.storage.from('gallery').getPublicUrl(file.name).data.publicUrl;
                  const originalTitle = file.name.replace(/^\d+-[a-z0-9]+-/, '').replace(/\.[^/.]+$/, "").replace(/_/g, ' ');
                  
                  allPhotos.push({
                    id: file.id || file.name,
                    name: file.name,
                    url: publicUrl,
                    title: originalTitle || file.name.replace(/\.[^/.]+$/, ""),
                    source: 'storage',
                    isLive: true
                  });
                });
              }
              return allPhotos;
            }
          });

          // Check if any of our uploaded files are now duplicates
          const uploadedFileNames = files.map(f => f.name);
          const potentialDuplicates = [];
          
          uploadedFileNames.forEach(fileName => {
            const fileBaseName = fileName.replace(/\.[^/.]+$/, "");
            const sanitizedFileBaseName = fileBaseName.replace(/[^a-zA-Z0-9_-]/g, '_');
            
            const matchingPhotos = latestPhotos?.filter(photo => {
              const storedBaseName = photo.name.replace(/^\d+-[a-z0-9]+-/, '').replace(/\.[^/.]+$/, "");
              return storedBaseName === sanitizedFileBaseName;
            }) || [];
            
            if (matchingPhotos.length > 1) {
              potentialDuplicates.push(fileName);
            }
          });

          if (potentialDuplicates.length > 0) {
            toast({
              title: "Duplicate Files Detected",
              description: `Warning: ${potentialDuplicates.join(', ')} may have been uploaded multiple times. Please check the gallery.`,
              className: "bg-yellow-600 border-yellow-700 text-white shadow-xl backdrop-blur-md",
            });
          }
        } catch (error) {
          console.error('[PhotoManagement] Post-upload duplicate check failed:', error);
        }
      }, 1000);

      // Success notification now handled by upload progress dialog

    } catch (error) {
      console.error('[PhotoManagement] Error processing files:', error);
      toast({
        title: "Upload Failed",
        description: `Failed to upload photos: ${error.message}`,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    } finally {
      setUploading(false);
    }
  };


  const deleteMutation = useMutation({
    mutationFn: async (fileName: string) => {
      console.log('[PhotoManagement] ===== DELETE MUTATION STARTED =====');
      console.log('[PhotoManagement] Attempting to delete file:', fileName);
      
      // First check if the file exists
      const { data: fileExists, error: listError } = await supabase.storage
        .from('gallery')
        .list('', { search: fileName });
      
      if (listError) {
        console.error('[PhotoManagement] Error checking file existence:', listError);
        throw new Error(`Cannot verify file existence: ${listError.message}`);
      }
      
      if (!fileExists || fileExists.length === 0) {
        console.error('[PhotoManagement] File not found:', fileName);
        throw new Error(`File "${fileName}" not found in storage`);
      }
      
      console.log('[PhotoManagement] File exists, proceeding with delete');
      
      const { data, error } = await supabase.storage
        .from('gallery')
        .remove([fileName]);
      
      if (error) {
        console.error('[PhotoManagement] Delete error:', error);
        throw new Error(`Delete failed: ${error.message}`);
      }
      
      console.log('[PhotoManagement] Delete successful:', data);
      return data;
    },
    onSuccess: (data, fileName) => {
      console.log('[PhotoManagement] Delete mutation success for:', fileName);
      // Invalidate both admin and public gallery queries
      queryClient.invalidateQueries({ queryKey: ["gallery-photos"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-photos-public"] });
      toast({
        title: "Success",
        description: "Photo deleted successfully",
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });
    },
    onError: (error: Error, fileName) => {
      console.error('[PhotoManagement] Delete mutation error for:', fileName, error);
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate all files before uploading
    const invalidFiles = [];
    const validFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check if file is web-supported
      if (!isWebSupported(file)) {
        invalidFiles.push(`${file.name} (not a supported web format)`);
        continue;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (too large, max 5MB)`);
        continue;
      }

      validFiles.push(file);
    }

    // Create upload progress items for ALL files (valid and invalid)
    const allFiles = [...validFiles, ...Array.from(files).filter(file => 
      !validFiles.includes(file)
    )];
    const uploadIds = allFiles.map(file => addUpload(file));

    // Mark invalid files as errors in upload progress
    if (invalidFiles.length > 0) {
      Array.from(files).forEach((file, index) => {
        const isInvalid = invalidFiles.some(invalid => invalid.includes(file.name));
        if (isInvalid) {
          const uploadId = uploadIds[allFiles.indexOf(file)];
          const errorReason = !isWebSupported(file) 
            ? 'Unsupported format - only JPG, PNG, GIF, WebP, SVG allowed'
            : 'File too large - max 5MB';
          updateUpload(uploadId, { 
            status: 'error', 
            error: errorReason,
            progress: 0
          });
        }
      });
    }

    // Upload valid files directly (no conversion needed)
    if (validFiles.length > 0) {
      try {
        // Check for duplicates
        const { duplicates, validFiles: uniqueFiles } = await checkForDuplicates(validFiles);
        
        // Mark duplicate files as cancelled in upload progress
        if (duplicates.length > 0) {
          validFiles.forEach((file, index) => {
            const isDuplicate = duplicates.some(dup => dup.includes(file.name));
            if (isDuplicate) {
              const uploadId = uploadIds[allFiles.indexOf(file)];
              updateUpload(uploadId, { 
                status: 'error', 
                error: 'Duplicate file - upload cancelled',
                progress: 0
              });
            }
          });
        }

        if (uniqueFiles.length > 0) {
          // Process unique files with their existing upload IDs
          const uniqueFileUploadIds = uniqueFiles.map(file => {
            const uploadId = uploadIds[allFiles.indexOf(file)];
            return { file, uploadId };
          });
          
          await processFilesWithIds(uniqueFileUploadIds);
        }
      } catch (error) {
        console.error('[PhotoManagement] Error processing files:', error);
        toast({
          title: "Processing Failed",
          description: "Failed to process some files. Please try again.",
          variant: "destructive",
          className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
        });
      }
    }

    // Reset the input
    e.target.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Function to delete all photos from storage with single confirmation
  const deleteAllPhotos = () => {
    if (!photos || photos.length === 0) return;
    
    // Single confirmation
    showConfirmation(
      "⚠️ Delete All Photos",
      `WARNING: You are about to delete ALL ${photos.length} photos from the gallery!\n\nThis action cannot be undone. Are you sure you want to continue?`,
      async () => {
        try {
          console.log(`[PhotoManagement] Deleting all ${photos.length} photos...`);
          
          // Get all photo names for deletion
          const allPhotoNames = photos.map(photo => photo.name);
          
          // Delete all photos from storage
          const { error } = await supabase.storage
            .from('gallery')
            .remove(allPhotoNames);
          
          if (error) {
            console.error('[PhotoManagement] Error deleting all photos:', error);
            showAlert(
              "Deletion Failed",
              `Failed to delete all photos: ${error.message}`
            );
          } else {
            // Refresh the gallery
            queryClient.invalidateQueries({ queryKey: ["gallery-photos"] });
            queryClient.invalidateQueries({ queryKey: ["gallery-photos-public"] });
            
            showAlert(
              "All Photos Deleted",
              `Successfully deleted all ${photos.length} photos from the gallery`
            );
          }
        } catch (error) {
          console.error('[PhotoManagement] Unexpected error during deletion:', error);
          showAlert(
            "Deletion Error",
            "An unexpected error occurred while deleting photos"
          );
        }
      }
    );
  };


  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <Card className="border-0 sm:border">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl sm:text-3xl">
                    <ImageIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                    Gallery Management
                  </CardTitle>
                  <CardDescription className="mt-2">Upload and manage photos for the BLOTIC gallery</CardDescription>
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
                  <strong>Maximum file size:</strong> 5MB per photo. <strong>Supported formats:</strong> JPG, PNG, GIF, WebP, and SVG. Select multiple files to upload at once. Duplicate images will be automatically detected and skipped.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
              multiple
              className="hidden"
            />

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading photos...</p>
              </div>
            ) : photos && photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {photos.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    className="relative group"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-green-500/30 bg-green-50/10 shadow-md hover:shadow-xl transition-shadow">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.svg";
                        }}
                      />
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-green-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium shadow-md">
                        LIVE
                      </div>
                    </div>
                    
                    {/* Mobile Delete Button - Always Visible */}
                    <div className="absolute bottom-1 right-1 sm:hidden">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          console.log('[PhotoManagement] Delete button clicked for photo:', photo.name);
                          
                          showConfirmation(
                            "Delete Photo",
                            `Are you sure you want to delete "${photo.title}"?\n\nThis action cannot be undone.`,
                            () => {
                              console.log('[PhotoManagement] User confirmed delete for:', photo.name);
                              deleteMutation.mutate(photo.name);
                            }
                          );
                        }}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 shadow-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Desktop Delete Button - Hover Overlay */}
                    <div className="hidden sm:flex absolute inset-0 bg-black/60 backdrop-blur-sm items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          console.log('[PhotoManagement] Delete button clicked for photo:', photo.name);
                          
                          showConfirmation(
                            "Delete Photo",
                            `Are you sure you want to delete "${photo.title}"?\n\nThis action cannot be undone.`,
                            () => {
                              console.log('[PhotoManagement] User confirmed delete for:', photo.name);
                              deleteMutation.mutate(photo.name);
                            }
                          );
                        }}
                        disabled={deleteMutation.isPending}
                        className="gap-2 shadow-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                    
                    <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-center text-muted-foreground">
                      {new Date(parseInt(photo.name.split('-')[0])).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">No photos in gallery yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload your first photo to get started with the BLOTIC gallery
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fixed Bottom Action Bar */}
        <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg mt-8 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 pb-safe mb-16 sm:mb-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground hidden sm:block">
              {photos && photos.length > 0 ? `Managing ${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}` : 'No photos to manage'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                onClick={triggerFileInput} 
                disabled={uploading} 
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 gap-2 order-1"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload Photos"}
              </Button>
              <Button 
                onClick={deleteAllPhotos} 
                disabled={uploading || !photos || photos.length === 0}
                variant="destructive" 
                className="w-full sm:w-auto gap-2 order-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete All ({photos?.length || 0})
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
      {/* Custom Alert Dialog */}
      <Dialog open={alertDialog.isOpen} onOpenChange={closeAlert}>
        <DialogContent className="max-w-md mx-auto backdrop-blur-md bg-background/95 border border-border/50 shadow-2xl mt-[5vh] [&>button]:text-red-500 [&>button]:hover:text-red-600 [&>button]:hover:bg-red-500/10">
          <DialogHeader className="text-center">
            <DialogTitle className="flex items-center justify-center gap-2 text-2xl font-bold">
              {alertDialog.type === 'warning' && <AlertTriangle className="w-6 h-6 text-yellow-600" />}
              {alertDialog.type === 'input' && <AlertTriangle className="w-6 h-6 text-blue-600" />}
              {alertDialog.title}
            </DialogTitle>
            <DialogDescription className="text-base mt-4 whitespace-pre-line text-center">
              {alertDialog.message}
            </DialogDescription>
          </DialogHeader>
          
          {alertDialog.type === 'input' && (
            <div className="my-4">
              <Input
                placeholder={alertDialog.inputPlaceholder}
                value={alertDialog.inputValue}
                onChange={(e) => setAlertDialog(prev => ({ ...prev, inputValue: e.target.value }))}
                className="text-center"
                autoFocus
              />
            </div>
          )}
          
          <DialogFooter className="flex gap-3 justify-center">
            {alertDialog.type !== 'warning' && (
              <Button
                variant="outline"
                onClick={handleAlertCancel}
                className="min-w-[100px]"
              >
                {alertDialog.cancelText}
              </Button>
            )}
            <Button
              variant={alertDialog.type === 'confirmation' ? 'destructive' : 'default'}
              onClick={handleAlertConfirm}
              className="min-w-[100px]"
            >
              {alertDialog.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhotoManagement;