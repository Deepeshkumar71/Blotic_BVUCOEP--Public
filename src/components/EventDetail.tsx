import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Eye,
  Image,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface EventDetailProps {
  event: {
    id: string;
    title: string;
    description: string;
    event_type?: string;
    event_date: string;
    location?: string;
    max_participants?: number;
    current_participants?: number;
    is_virtual?: boolean;
    image_url?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

// Demo gallery images for the past event
const demoGalleryImages = [
  "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1551818255-e6e10975cd17?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
];

const EventDetail = ({ event, isOpen, onClose }: EventDetailProps) => {
  const [activeTab, setActiveTab] = useState<"overview" | "gallery">("overview");
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const isPastEvent = new Date(event.event_date) < new Date();

  const handleImageClick = (index: number) => {
    setSelectedImage(index);
  };

  const handleImageNavigation = (direction: "prev" | "next") => {
    if (selectedImage === null) return;
    
    if (direction === "prev") {
      setSelectedImage(selectedImage > 0 ? selectedImage - 1 : demoGalleryImages.length - 1);
    } else {
      setSelectedImage(selectedImage < demoGalleryImages.length - 1 ? selectedImage + 1 : 0);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto [&>button]:text-red-500 [&>button]:hover:text-red-600 [&>button]:hover:bg-red-500/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{event.title}</DialogTitle>
          </DialogHeader>

          {/* Event Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {event.event_type && (
                <Badge variant="secondary">{event.event_type}</Badge>
              )}
              {isPastEvent && (
                <Badge variant="outline">Past Event</Badge>
              )}
              {event.is_virtual && (
                <Badge variant="outline">Virtual</Badge>
              )}
            </div>

            {/* Event Image */}
            {event.image_url && (
              <div className="w-full h-64 rounded-lg overflow-hidden">
                <img 
                  src={event.image_url} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-medium">Date & Time</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.event_date).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-medium">Location</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.location || "Location TBD"}
                  </p>
                </CardContent>
              </Card>

              {event.max_participants && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-medium">Participants</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isPastEvent 
                        ? `${event.current_participants || event.max_participants} attended`
                        : `${event.max_participants} max capacity`
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b">
              <Button
                variant={activeTab === "overview" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("overview")}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Overview
              </Button>
              {isPastEvent && (
                <Button
                  variant={activeTab === "gallery" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("gallery")}
                  className="gap-2"
                >
                  <Image className="w-4 h-4" />
                  Gallery
                </Button>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">About This Event</h3>
                  <p className="text-muted-foreground">{event.description}</p>
                </div>

                {isPastEvent && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Event Highlights</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Keynote presentations from industry leaders</li>
                      <li>Interactive workshops and hands-on sessions</li>
                      <li>Networking opportunities with blockchain professionals</li>
                      <li>Live demonstrations of cutting-edge Web3 technologies</li>
                      <li>Q&A sessions with expert panel</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "gallery" && isPastEvent && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Event Gallery</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {demoGalleryImages.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleImageClick(index)}
                    >
                      <img
                        src={image}
                        alt={`Event photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      {selectedImage !== null && (
        <Dialog open={true} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-5xl p-0 bg-black/90 [&>button]:text-red-500 [&>button]:hover:text-red-600 [&>button]:hover:bg-red-500/10">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                onClick={() => handleImageNavigation("prev")}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                onClick={() => handleImageNavigation("next")}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>

              <img
                src={demoGalleryImages[selectedImage]}
                alt={`Event photo ${selectedImage + 1}`}
                className="w-full h-auto max-h-[90vh] object-contain"
              />
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                {selectedImage + 1} / {demoGalleryImages.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default EventDetail;
