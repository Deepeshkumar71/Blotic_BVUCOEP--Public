import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Image as ImageIcon, Star, X, Calendar, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EventPhoto {
  id: string;
  event_id: string;
  photo_url: string;
  caption?: string;
  upload_date: string;
  is_featured: boolean;
  display_order: number;
}

interface EventGalleryProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const EventGallery = ({ eventId, eventTitle, isOpen, onClose }: EventGalleryProps) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Fetch event photos
  const { data: photos = [], isLoading, error } = useQuery<EventPhoto[]>({
    queryKey: ["event-photos-public", eventId],
    queryFn: async () => {
      console.log("[EventGallery] Fetching photos for event:", eventId);
      const { data, error } = await supabase
        .from("event_photos")
        .select("*")
        .eq("event_id", eventId)
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true })
        .order("upload_date", { ascending: false });
      
      if (error) {
        console.error("[EventGallery] Query error:", error);
        throw error;
      }
      console.log("[EventGallery] Fetched", data?.length, "photos for event", eventId);
      console.log("[EventGallery] Photo URLs:", data?.map(p => p.photo_url));
      return data || [];
    },
    enabled: isOpen && !!eventId,
  });

  // Navigation functions
  const handlePrevious = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      
      if (e.key === 'ArrowLeft') {
        if (selectedPhotoIndex > 0) {
          setSelectedPhotoIndex(selectedPhotoIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (selectedPhotoIndex < photos.length - 1) {
          setSelectedPhotoIndex(selectedPhotoIndex + 1);
        }
      } else if (e.key === 'Escape') {
        setSelectedPhotoIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, photos.length]);

  return (
    <>
      <Dialog open={isOpen && selectedPhotoIndex === null} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl mt-[5vh] z-50 [&>button]:hidden p-0">
          <DialogHeader className="sticky top-0 z-50 bg-black pb-4 px-6 pt-6 border-b border-white/10 shadow-lg">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-white">
                <ImageIcon className="w-5 h-5 text-cyan-400" />
                {eventTitle} - Photo Gallery
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
                <p>Loading photos...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-red-500">Error Loading Photos</h3>
                <p className="text-muted-foreground">There was an error loading the photos for this event.</p>
                <p className="text-sm text-red-400 mt-2">{error.message}</p>
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Photos Yet</h3>
                <p className="text-muted-foreground">Photos from this event will appear here once they're uploaded.</p>
                <p className="text-xs text-muted-foreground mt-2">Event ID: {eventId}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedPhotoIndex(index)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="aspect-square overflow-hidden rounded-lg border hover:shadow-lg transition-all duration-200">
                      <img
                        src={photo.photo_url}
                        alt={photo.caption || 'Event photo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          console.error('[EventGallery] Failed to load image:', photo.photo_url);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                <div class="text-center text-gray-500 dark:text-gray-400">
                                  <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                  </svg>
                                  <p class="text-xs">Image not found</p>
                                </div>
                              </div>
                            `;
                          }
                        }}
                        onLoad={() => {
                          console.log('[EventGallery] Successfully loaded image:', photo.photo_url);
                        }}
                      />
                    </div>
                    
                    {/* Featured badge */}
                    {photo.is_featured && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Featured
                      </div>
                    )}

                    {/* Photo info overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg flex items-end">
                      <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {photo.caption && (
                          <p className="text-sm font-medium truncate">{photo.caption}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Detail Dialog */}
      <Dialog open={selectedPhotoIndex !== null} onOpenChange={(open) => {
        if (!open) {
          setSelectedPhotoIndex(null);
        }
      }}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 backdrop-blur-md border-0 [&>button]:text-red-500 [&>button]:hover:text-red-600 [&>button]:hover:bg-red-500/10">
          <AnimatePresence mode="wait">
            {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
              <motion.div
                key={selectedPhotoIndex}
                className="relative w-full h-full flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Previous button */}
                {selectedPhotoIndex > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12"
                      onClick={handlePrevious}
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </Button>
                  </motion.div>
                )}

                {/* Next button */}
                {selectedPhotoIndex < photos.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12"
                      onClick={handleNext}
                    >
                      <ChevronRight className="w-8 h-8" />
                    </Button>
                  </motion.div>
                )}

                {/* Image and details */}
                <div className="w-full h-full flex flex-col items-center justify-center p-8">
                  <motion.img
                    src={photos[selectedPhotoIndex].photo_url}
                    alt={photos[selectedPhotoIndex].caption || 'Event photo'}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
                  onError={(e) => {
                    console.error('[EventGallery] Failed to load detailed image:', photos[selectedPhotoIndex].photo_url);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                
                {/* Image details */}
                <div className="mt-6 text-center max-w-2xl">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {photos[selectedPhotoIndex].is_featured && (
                      <Badge className="bg-yellow-500 text-white gap-1">
                        <Star className="w-3 h-3" />
                        Featured
                      </Badge>
                    )}
                    {photos[selectedPhotoIndex].caption && (
                      <h3 className="text-white text-lg font-semibold">
                        {photos[selectedPhotoIndex].caption}
                      </h3>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(photos[selectedPhotoIndex].upload_date).toLocaleDateString()}
                    </div>
                    <span>•</span>
                    <span>{selectedPhotoIndex + 1} / {photos.length}</span>
                  </div>
                </div>
              </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventGallery;
