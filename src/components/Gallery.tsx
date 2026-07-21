import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Loader2, X, ChevronLeft, ChevronRight } from "@/components/icons";
import { Button } from "@/components/ui/button";

// Define the photo type
interface Photo {
  id: number;
  name: string;
  title: string;
  path: string;
  size: number;
}

const Gallery = () => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Fetch photos directly from Supabase storage
  const { data: photos, isLoading } = useQuery({
    queryKey: ["gallery-photos-public"],
    queryFn: async () => {
      try {
        console.log('[Gallery] Fetching photos from Supabase storage...');
        
        // Get photos from Supabase storage
        const { data: storageFiles, error: storageError } = await supabase.storage
          .from('gallery')
          .list('', {
            limit: 100,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (storageError) {
          console.error('[Gallery] Storage error:', storageError);
          return [];
        }

        if (!storageFiles || storageFiles.length === 0) {
          console.log('[Gallery] No photos found in storage');
          return [];
        }

        // Convert storage files to Photo format
        const photosWithUrls = storageFiles.map((file, index) => {
            const publicUrl = supabase.storage.from('gallery').getPublicUrl(file.name).data.publicUrl;
            return {
              id: index + 1,
              name: file.name,
              title: `Photo ${index + 1}`, // Simple photo numbering
              path: publicUrl,
              size: file.metadata?.size || 0
            };
          });

        console.log('[Gallery] Found photos:', photosWithUrls.length);
        return photosWithUrls;
      } catch (error) {
        console.error('[Gallery] Error fetching photos:', error);
        return [];
      }
    },
    refetchInterval: 5000, // Refetch every 5 seconds for faster sync with admin changes
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    gcTime: 1000, // Keep cache for only 1 second
  });

  // Use photos directly without duplication
  const galleryPhotos = photos || [];

  // Navigation functions
  const handlePrevious = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < galleryPhotos.length - 1) {
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
        if (selectedPhotoIndex < galleryPhotos.length - 1) {
          setSelectedPhotoIndex(selectedPhotoIndex + 1);
        }
      } else if (e.key === 'Escape') {
        setSelectedPhotoIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, galleryPhotos.length]);

  if (isLoading) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent tracking-wider">
              Gallery
            </h2>
            <p className="text-lg text-muted-foreground font-medium mt-4">Capturing moments, creating memories</p>
          </div>
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
            <p className="text-lg text-muted-foreground">Loading gallery photos...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent tracking-wider">
              Gallery
            </h2>
            <p className="text-lg text-muted-foreground font-medium mt-4">Capturing moments, creating memories</p>
          </div>
          <div className="text-center py-12">
            <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Gallery Coming Soon</h3>
            <p className="text-muted-foreground">
              Our photo gallery is being prepared. Check back soon for amazing photos from BLOTIC events!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-card">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent tracking-wider">
            Gallery
          </h2>
          <p className="text-lg text-muted-foreground font-medium mt-4">Capturing moments, creating memories</p>
        </motion.div>

        {/* Gallery Grid Container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {galleryPhotos.map((photo, index) => (
            <motion.div
              key={`${photo.id}-${index}`}
              className="gallery-item group relative aspect-square overflow-hidden rounded-lg border border-border cursor-pointer"
              onClick={() => setSelectedPhotoIndex(index)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src={photo.path}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  // Fallback to gradient if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML += `
                    <div class="w-full h-full bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center text-white">
                      <span class="text-white text-xs text-center px-2">${photo.title}</span>
                    </div>
                  `;
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox - Custom Implementation */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && galleryPhotos[selectedPhotoIndex] && (
          <motion.div
            key="lightbox"
            className="fixed top-0 left-0 right-0 bottom-0 z-40 bg-black pt-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute top-28 right-8 z-50 text-red-500 hover:text-red-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-8 h-8" strokeWidth={3} />
            </button>

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
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
              </motion.div>
            )}

            {/* Next button */}
            {selectedPhotoIndex < galleryPhotos.length - 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12"
                  onClick={handleNext}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </motion.div>
            )}

            {/* Image */}
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              <motion.img
                key={selectedPhotoIndex}
                src={galleryPhotos[selectedPhotoIndex].path}
                alt={galleryPhotos[selectedPhotoIndex].title}
                className="max-w-full max-h-[calc(100vh-200px)] object-contain"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Image counter */}
              <div className="mt-4 text-center">
                <p className="text-gray-400 text-sm">
                  {selectedPhotoIndex + 1} / {galleryPhotos.length}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add CSS for the gallery styling */}
      <style>{`
        .gallery-item {
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .gallery-item:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </section>
  );
};

export default Gallery;
