import { useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Users, Trophy, Briefcase, Calendar } from "@/components/icons";
import BackgroundVideo from "@/components/BackgroundVideo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { motion, useInView } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/utils/animations";

const Home = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);

  // Ref for Why Join BLOTIC section scroll animation
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });

  // Animation variants for feature cards
  const featureContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const featureCardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  // Only students can register for events (all other roles are restricted)
  const canRegister = userProfile?.role === "student";

  // Fetch events from Supabase
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      console.log("[Home] Fetching events...");
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) {
        console.error("[Home] Events query error:", error);
        throw error;
      }

      console.log("[Home] Fetched events:", data?.length || 0);
      return data || [];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch user registrations
  const { data: registrations = [] } = useQuery({
    queryKey: ["event-registrations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("event_registrations")
        .select("event_id, status, registration_date")
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) {
        throw new Error("You must be signed in to register for an event.");
      }

      // Check if user is a student (only students can register)
      if (!canRegister) {
        throw new Error("Only students can register for events.");
      }

      const targetEvent = events?.find((evt) => evt.id === eventId);

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
          source: "home_page",
        },
      };

      const { error } = await supabase.from("event_registrations").insert(payload);

      if (error) {
        throw new Error(error.message);
      }
    },
    onMutate: (eventId) => {
      setRegisteringEventId(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event-registrations"] });
      toast({
        title: "Registration successful",
        description: "You're now registered for the event!",
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });
    },
    onError: (error) => {
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

  const { mutate: triggerRegistration, isPending: isRegistrationPending } = registerMutation;

  const handleRegisterClick = (eventId: string) => {
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
      });
      return;
    }

    triggerRegistration(eventId);
  };

  // Get upcoming events
  const upcomingEvents = useMemo(() => {
    return events?.filter((event) => new Date(event.event_date) >= new Date()).slice(0, 2) || [];
  }, [events]);

  // Format date for display
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString("default", { month: "short" }),
    };
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-section">
        <BackgroundVideo />
        <motion.div
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={fadeInUp.transition}
          className="hero-content-wrapper"
        >
          {/* Hero content will be here */}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="features-section py-16 bg-background" ref={featuresRef}>
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
            className="section-title text-3xl md:text-4xl font-bold text-center mb-12"
          >
            Why Join <span className="gradient-text">BLOTIC</span>?
          </motion.h2>
          <motion.div
            className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={featureContainerVariants}
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
          >
            <motion.div variants={featureCardVariants}>
              <Card className="feature-card bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow text-center h-full">
                <div className="feature-icon bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto relative">
                  <GraduationCap className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h3 className="feature-title text-xl font-semibold mb-2">Hands-on Learning</h3>
                <p className="feature-description text-muted-foreground">
                  Practical workshops and projects in blockchain and Web3 technologies
                </p>
              </Card>
            </motion.div>
            <motion.div variants={featureCardVariants}>
              <Card className="feature-card bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow text-center h-full">
                <div className="feature-icon bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto relative">
                  <Users className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h3 className="feature-title text-xl font-semibold mb-2">Expert Community</h3>
                <p className="feature-description text-muted-foreground">
                  Connect with industry professionals and like-minded peers
                </p>
              </Card>
            </motion.div>
            <motion.div variants={featureCardVariants}>
              <Card className="feature-card bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow text-center h-full">
                <div className="feature-icon bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto relative">
                  <Trophy className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h3 className="feature-title text-xl font-semibold mb-2">Competitions</h3>
                <p className="feature-description text-muted-foreground">
                  Participate in coding competitions and challenges
                </p>
              </Card>
            </motion.div>
            <motion.div variants={featureCardVariants}>
              <Card className="feature-card bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow text-center h-full">
                <div className="feature-icon bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto relative">
                  <Briefcase className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h3 className="feature-title text-xl font-semibold mb-2">Career Growth</h3>
                <p className="feature-description text-muted-foreground">
                  Access to internships and job opportunities in blockchain companies
                </p>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Events Section */}
      <section className="events-section py-16">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-3xl md:text-4xl font-bold text-center mb-12">
            Upcoming <span className="gradient-text">Events</span>
          </h2>

          {eventsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading upcoming events...</p>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {upcomingEvents.map((event) => {
                  const dateInfo = formatEventDate(event.event_date);
                  const isRegistered = user ? userRegistrations.has(event.id) : false;
                  const isFull = event.max_participants !== null && 
                                event.max_participants !== undefined && 
                                event.current_participants !== null && 
                                event.current_participants !== undefined && 
                                event.current_participants >= event.max_participants;
                  const spotsLeft = event.max_participants
                    ? event.max_participants - (event.current_participants ?? 0)
                    : null;
                  const canSeeRegistrationCounts = userProfile?.role === "admin" || 
                                                   userProfile?.role === "core" || 
                                                   userProfile?.role === "co_head" || 
                                                   userProfile?.role === "member";

                  return (
                    <Card key={event.id} className="event-card bg-card/50 backdrop-blur-sm border border-border rounded-lg overflow-hidden flex flex-col">
                      {/* Event Image with Badges */}
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={event.image_url || "/default-events-cover-image.png"} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Date Badge - Top Left */}
                        <div className="absolute top-4 left-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-3 shadow-lg">
                          <div className="text-2xl font-bold leading-none">{dateInfo.day}</div>
                          <div className="text-xs uppercase font-semibold">{dateInfo.month}</div>
                        </div>

                        {/* Event Type Badge - Top Right */}
                        <div className="absolute top-4 right-4">
                          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                            {event.event_type || 'Event'}
                          </div>
                        </div>

                        {/* Registration Status Badge - Bottom Right */}
                        <div className="absolute bottom-4 right-4">
                          {event.is_registration_open ? (
                            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <span className="w-2 h-2 bg-white rounded-full"></span>
                              Open
                            </div>
                          ) : (
                            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <span className="w-2 h-2 bg-white rounded-full"></span>
                              Closed
                            </div>
                          )}
                        </div>
                      </div>

                      <CardContent className="p-6 flex flex-col flex-1">
                        {/* Content that can grow */}
                        <div className="flex-1">
                          {/* Title */}
                          <h3 className="text-xl font-bold mb-2 line-clamp-2">{event.title}</h3>

                          {/* Description */}
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {event.description}
                          </p>

                          {/* Event Details */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <i className="fas fa-clock text-primary"></i>
                              <span>{new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            
                            {event.location && (
                              <div className="flex items-center gap-2 text-sm">
                                <i className="fas fa-map-marker-alt text-primary"></i>
                                <span className="line-clamp-1">{event.location}</span>
                              </div>
                            )}

                            {canSeeRegistrationCounts && event.max_participants && (
                              <div className="flex items-center gap-2 text-sm">
                                <i className="fas fa-users text-primary"></i>
                                <span>
                                  {event.current_participants || 0} / {event.max_participants} participants
                                  {spotsLeft !== null && spotsLeft > 0 && (
                                    <span className="text-accent ml-1">({spotsLeft} spots left)</span>
                                  )}
                                </span>
                              </div>
                            )}

                            {/* Registration Fee Display */}
                            {event.registration_fee !== null && event.registration_fee !== undefined ? (
                              parseFloat(event.registration_fee.toString()) > 0 ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <i className="fas fa-dollar-sign text-primary"></i>
                                  <span>₹{event.registration_fee}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-sm">
                                  <i className="fas fa-dollar-sign text-green-400"></i>
                                  <span className="text-green-400 font-medium">Free</span>
                                </div>
                              )
                            ) : (
                              <div className="flex items-center gap-2 text-sm">
                                <i className="fas fa-dollar-sign text-green-400"></i>
                                <span className="text-green-400 font-medium">Free</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Button - Always at bottom */}
                        <div className="mt-auto">
                          {event.is_registration_open ? (
                            <Button
                              className={`w-full ${!isRegistered ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white' : ''}`}
                              size="sm"
                              variant={isRegistered ? "outline" : "default"}
                              onClick={() => handleRegisterClick(event.id)}
                              disabled={
                                isRegistered ||
                                isFull ||
                                (user && !canRegister) ||
                                (registeringEventId === event.id && isRegistrationPending)
                              }
                            >
                              {registeringEventId === event.id && isRegistrationPending ? (
                                <span className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Processing...
                                </span>
                              ) : isRegistered ? (
                                "Registered"
                              ) : isFull ? (
                                "Event Full"
                              ) : (user && !canRegister) ? (
                                "Not Eligible"
                              ) : (
                                "Register Now"
                              )}
                            </Button>
                          ) : (
                            <Button className="w-full" size="sm" variant="outline" disabled>
                              Registration Closed
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <div className="text-center">
                <Button asChild variant="secondary">
                  <Link to="/events">View All Events</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg mb-2">No upcoming events</p>
              <p className="text-muted-foreground mb-4">Check back soon for exciting events!</p>
              <Button asChild variant="outline">
                <Link to="/events">View Past Events</Link>
              </Button>
            </div>
          )}
        </div>
      </section>


    </div>
  );
};

export default Home;