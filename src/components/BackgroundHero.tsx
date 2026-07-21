import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";
import { getSetting } from "@/utils/adminSettingsManager";

const BackgroundHero = () => {
  const [siteDescription, setSiteDescription] = useState("Experience the Virtual Matrix - Where digital innovation meets seamless collaboration");

  useEffect(() => {
    // Load site description from centralized settings manager
    const loadSiteDescription = () => {
      const description = getSetting('siteDescription');
      if (description) {
        setSiteDescription(description);
      }
    };

    // Load on mount
    loadSiteDescription();

    // Listen for settings updates
    const handleSettingsUpdate = () => {
      loadSiteDescription();
    };

    window.addEventListener('adminSettingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('adminSettingsUpdated', handleSettingsUpdate);
    };
  }, []);

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Virtual Matrix Background"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Blotic
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            {siteDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button variant="hero" size="lg" onClick={scrollToContent}>
              Explore Matrix
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.getElementById("events")?.scrollIntoView({ behavior: "smooth" })}>
              View Events
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <button
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
          aria-label="Scroll down"
        >
          <ChevronDown className="w-8 h-8 text-primary" />
        </button>
      </div>
    </div>
  );
};

export default BackgroundHero;
