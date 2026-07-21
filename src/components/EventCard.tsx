import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;

interface EventCardProps {
  event: Event;
  onRegister?: (eventId: string) => void;
}

const EventCard = ({ event, onRegister }: EventCardProps) => {
  // Check if event is in the past
  const eventDate = new Date(event.event_date);
  const now = new Date();
  const isPastEvent = eventDate.getTime() < now.getTime();
  
  return (
    <Card className="h-full flex flex-col">
      {/* Event Image or Placeholder with Date Badge */}
      <div className="w-full overflow-hidden rounded-t-lg bg-muted relative">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-auto max-h-96 object-contain hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
            <Calendar className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
        {/* Date Badge - Always visible */}
        <div className="absolute top-3 left-3 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-lg p-2 sm:p-3 text-center shadow-lg min-w-[60px] sm:min-w-[70px]">
          <div className="text-xl sm:text-2xl font-bold leading-none">
            {eventDate.getDate()}
          </div>
          <div className="text-[10px] sm:text-xs font-medium uppercase mt-1">
            {eventDate.toLocaleDateString('en-US', { month: 'short' })}
          </div>
          {/* Show year for past events */}
          {isPastEvent && (
            <div className="text-xs sm:text-sm font-semibold mt-1 border-t border-white/30 pt-1">
              {eventDate.getFullYear()}
            </div>
          )}
        </div>
      </div>
      
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl">{event.title}</CardTitle>
          {event.event_type && (
            <Badge variant="secondary">{event.event_type}</Badge>
          )}
        </div>
        <CardDescription>{event.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{new Date(event.event_date).toLocaleDateString()}</span>
          </div>
          
          {event.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
          )}

          {event.max_participants && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>
                {event.current_participants || 0} / {event.max_participants} participants
              </span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-4">
          {event.is_registration_open && onRegister && (
            <Button
              onClick={() => onRegister(event.id)}
              className="w-full"
              variant="default"
            >
              Register Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
