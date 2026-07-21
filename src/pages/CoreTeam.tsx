import React, { lazy, Suspense } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/utils/animations";
import { 
  Loader2, 
  Crown, 
  UserCheck, 
  Megaphone, 
  Handshake, 
  Code, 
  Share, 
  Calendar, 
  Paintbrush, 
  Edit, 
  Lightbulb, 
  Users, 
  GraduationCap, 
  User 
} from "@/components/icons";

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
  avatar_url: string | null;
}

const CoreTeam: React.FC = () => {
  // Helper function to generate WhatsApp chat URL from phone number
  const generateWhatsAppURL = (phoneNumber: string): string => {
    // Remove all non-digit characters except +
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // If number doesn't start with +, assume it's an Indian number and add +91
    let formattedNumber = cleanNumber;
    if (!cleanNumber.startsWith('+')) {
      formattedNumber = `+91${cleanNumber}`;
    }
    
    // Remove the + for WhatsApp URL format
    const whatsappNumber = formattedNumber.replace('+', '');
    
    return `https://wa.me/${whatsappNumber}`;
  };

  const { data: teamMembers, isLoading, error, refetch } = useQuery({
    queryKey: ["core-team"], // Synchronized with admin dashboard
    queryFn: async () => {
      console.log('[CoreTeam] Fetching core team members via direct Supabase...');
      
      // Use direct Supabase query for optimal performance (no API roundtrip)
      const { data, error } = await supabase
        .from("core_team")
        .select(`
          id, 
          user_id,
          full_name, 
          position, 
          branch, 
          skills, 
          instagram_url, 
          linkedin_url, 
          whatsapp_url, 
          is_leadership, 
          is_active, 
          display_order,
          avatar_url
        `)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (error) {
        console.error('[CoreTeam] Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      const teamData = data || [];
      console.log('[CoreTeam] Fetched', teamData.length, 'members');
      return teamData as CoreTeamMember[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2, // Reduced retries for faster failure
    retryDelay: 500, // Faster retry
  });

  // Filter faculty coordinators from the database
  const facultyCoordinators = teamMembers?.filter(member => 
    member.position.toLowerCase().includes('faculty') || 
    member.position.toLowerCase().includes('coordinator')
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('[CoreTeam] Error state:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Error loading team members</p>
          <p className="text-sm text-gray-500 mt-2">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
          <div className="mt-4 space-x-2">
            <button 
              onClick={() => refetch()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry Query
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no team members
  if (!isLoading && (!teamMembers || teamMembers.length === 0)) {
    return (
      <div className="core-team-page">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title"><span className="gradient-text">Core Team</span></h1>
            <p className="hero-subtitle">Meet the passionate individuals driving BLOTIC forward</p>
            <p className="hero-description">
              Our dedicated team of leaders, innovators, and blockchain enthusiasts work together to create an exceptional experience for our community.
            </p>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="section">
          <div className="container">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-300 mb-2">Team Members Coming Soon</h2>
              <p className="text-gray-500 mb-4">
                We're building an amazing team. Check back soon to meet our leadership and core team members!
              </p>
              <button 
                onClick={() => refetch()} 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Refresh
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const getIconForRole = (role: string) => {
    const iconProps = { className: "w-8 h-8 text-white" };
    
    switch (role.toLowerCase()) {
      case 'president':
        return <Crown {...iconProps} />;
      case 'vice president':
        return <UserCheck {...iconProps} />;
      case 'marketing head':
        return <Megaphone {...iconProps} />;
      case 'pr head':
        return <Handshake {...iconProps} />;
      case 'dev-rel head':
        return <Code {...iconProps} />;
      case 'social media head':
        return <Share {...iconProps} />;
      case 'event head':
        return <Calendar {...iconProps} />;
      case 'designing head':
        return <Paintbrush {...iconProps} />;
      case 'content head':
        return <Edit {...iconProps} />;
      case 'research head':
        return <Lightbulb {...iconProps} />;
      case 'hr head':
        return <Users {...iconProps} />;
      case 'faculty coordinator':
        return <GraduationCap {...iconProps} />;
      default:
        return <User {...iconProps} />;
    }
  };

  const leadershipTeam = teamMembers?.filter(member => member.is_leadership) || [];
  const coreTeam = teamMembers?.filter(member => 
    !member.is_leadership && 
    !(member.position.toLowerCase().includes('faculty') || member.position.toLowerCase().includes('coordinator'))
  ) || [];

  return (
    <div className="core-team-page">
      {/* Hero Section */}
      <section className="hero-section">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hero-content"
        >
          <h1 className="hero-title"><span className="gradient-text">Core Team</span></h1>
          <p className="hero-subtitle">Meet the passionate individuals driving BLOTIC forward</p>
          <p className="hero-description">
            Our dedicated team of leaders, innovators, and blockchain enthusiasts work together to create an exceptional experience for our community.
          </p>
        </motion.div>
      </section>
      {/* Leadership Section */}
      <section className="section leadership-section" style={{ background: 'rgba(96, 46, 166, 0.05)' }}>
        <div className="container">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="section-title leadership-title"
          >
            Leadership Team
          </motion.h2>
          <div className="grid grid-3">
            {leadershipTeam.map((member, index) => (
              <motion.div 
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className={`member-card leadership ${member.position === 'President' ? 'president' : ''}`}
              >
                <div className="member-image">
                  {member.avatar_url ? (
                    <img 
                      src={member.avatar_url} 
                      alt={member.full_name}
                      className="member-avatar"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.style.display = 'none';
                        const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="placeholder-avatar"
                    style={{ display: member.avatar_url ? 'none' : 'flex' }}
                  >
                    {getIconForRole(member.position)}
                  </div>
                </div>
                <div className="member-info">
                  <h3 className="member-role">{member.position}</h3>
                  <h4 className="member-name">{member.full_name}</h4>
                  <p className="member-department">{member.branch}</p>
                  <div className="member-skills">
                    {member.skills?.map((skill, index) => (
                      <span key={index} className="skill">{skill}</span>
                    )) || []}
                  </div>
                  <div className="member-social">
                    {member.whatsapp_url && (
                      <a href={generateWhatsAppURL(member.whatsapp_url)} className="social-link" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-whatsapp"></i>
                      </a>
                    )}
                    {member.linkedin_url && (
                      <a href={member.linkedin_url} className="social-link" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-linkedin"></i>
                      </a>
                    )}
                    {member.instagram_url && (
                      <a href={member.instagram_url} className="social-link" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-instagram"></i>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="section-title"
          >
            Core Team
          </motion.h2>
          <div className="grid grid-3">
            {coreTeam.map((member, index) => (
              <motion.div 
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="member-card leadership"
              >
                <div className="member-image">
                  {member.avatar_url ? (
                    <img 
                      src={member.avatar_url} 
                      alt={member.full_name}
                      className="member-avatar"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.style.display = 'none';
                        const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="placeholder-avatar"
                    style={{ display: member.avatar_url ? 'none' : 'flex' }}
                  >
                    {getIconForRole(member.position)}
                  </div>
                </div>
                <div className="member-info">
                  <h3 className="member-role">{member.position}</h3>
                  <h4 className="member-name">{member.full_name}</h4>
                  <p className="member-department">{member.branch}</p>
                  <div className="member-skills">
                    {member.skills?.map((skill, index) => (
                      <span key={index} className="skill">{skill}</span>
                    )) || []}
                  </div>
                  <div className="member-social">
                    {member.whatsapp_url && (
                      <a href={generateWhatsAppURL(member.whatsapp_url)} className="social-link" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-whatsapp"></i>
                      </a>
                    )}
                    {member.linkedin_url && (
                      <a href={member.linkedin_url} className="social-link" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-linkedin"></i>
                      </a>
                    )}
                    {member.instagram_url && (
                      <a href={member.instagram_url} className="social-link" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-instagram"></i>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Faculty Coordinators Section */}
      <section className="section" style={{ background: 'rgba(96, 46, 166, 0.05)' }}>
        <div className="container">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="section-title"
          >
            Faculty Coordinators
          </motion.h2>
          <div className="grid grid-2">
            {facultyCoordinators.map((member, index) => (
              <motion.div 
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="member-card leadership faculty"
              >
                <div className="member-image">
                  {member.avatar_url ? (
                    <img 
                      src={member.avatar_url} 
                      alt={member.full_name}
                      className="member-avatar"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.style.display = 'none';
                        const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="placeholder-avatar"
                    style={{ display: member.avatar_url ? 'none' : 'flex' }}
                  >
                    {getIconForRole(member.position)}
                  </div>
                </div>
                <div className="member-info">
                  <h3 className="member-role">{member.position}</h3>
                  <h4 className="member-name">{member.full_name}</h4>
                  <p className="member-department">{member.branch}</p>
                  <div className="member-skills">
                    {member.skills?.map((skill, index) => (
                      <span key={index} className="skill">{skill}</span>
                    )) || []}
                  </div>
                  <div className="member-social">
                    {member.whatsapp_url && (
                      <a href={generateWhatsAppURL(member.whatsapp_url)} className="social-link" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-whatsapp"></i>
                      </a>
                    )}
                    {member.linkedin_url && (
                      <a href={member.linkedin_url} className="social-link" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-linkedin"></i>
                      </a>
                    )}
                    {member.instagram_url && (
                      <a href={member.instagram_url} className="social-link" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-instagram"></i>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CoreTeam;