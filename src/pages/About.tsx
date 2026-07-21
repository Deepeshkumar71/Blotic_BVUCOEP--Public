import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';

const About: React.FC = () => {
  // Refs for scroll animations
  const missionRef = useRef(null);
  const whatWeDoRef = useRef(null);
  const collegeInfoRef = useRef(null);
  
  // Check if sections are in view
  const missionInView = useInView(missionRef, { once: true, margin: "-100px" });
  const whatWeDoInView = useInView(whatWeDoRef, { once: true, margin: "-100px" });
  const collegeInView = useInView(collegeInfoRef, { once: true, margin: "-100px" });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const cardRowVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <>
      
      <div className="about-page relative z-10" style={{ color: '#ffffff' }}>
      {/* Hero Section */}
      <section className="hero-section py-2 sm:py-20 relative pt-32 sm:pt-40">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hero-content text-center mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white whitespace-nowrap">About <span className="gradient-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">BLOTIC</span></h1>
            <p className="text-2xl md:text-3xl mb-6 text-gray-200 font-semibold max-w-full">Empowering the Next Generation of Blockchain Innovators</p>
            <p className="text-lg md:text-xl mb-8 text-gray-300 leading-relaxed max-w-4xl mx-auto">
              BLOTIC is Bharati Vidyapeeth College of Engineering's premier technical club focused on blockchain technology, Web3, and emerging innovations.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register" className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold hover:scale-105 transition-transform">Join Our Community</Link>
              <a href="#mission" className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold border border-white/20 hover:bg-white/20 transition-colors">Learn More</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="section py-16" id="mission" ref={missionRef}>
        <div className="container mx-auto px-4">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={missionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-center mb-12 text-white"
          >
            Our <span className="gradient-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Mission</span> & Vision
          </motion.h2>
          <motion.div 
            className="grid md:grid-cols-2 gap-8"
            variants={cardRowVariants}
            initial="hidden"
            animate={missionInView ? "visible" : "hidden"}
          >
            <motion.div 
              variants={itemVariants}
              className="card mission-card bg-card/50 backdrop-blur-sm rounded-lg p-8 border border-white/10"
            >
              <div className="feature-icon mb-4 text-primary text-4xl">
                <i className="fas fa-bullseye"></i>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-white">Our Mission</h2>
              <p className="text-white text-base leading-relaxed">
                To empower students with hands-on experience in blockchain development, smart contracts, decentralized applications (dApps), and other cutting-edge technologies that are shaping the future of the internet. We bridge the gap between theoretical knowledge and practical implementation through workshops, competitions, projects, and industry interactions.
              </p>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="card vision-card bg-card/50 backdrop-blur-sm rounded-lg p-8 border border-white/10"
            >
              <div className="feature-icon mb-4 text-primary text-4xl">
                <i className="fas fa-eye"></i>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-white">Our Vision</h2>
              <p className="text-white text-base leading-relaxed">
                We envision a future where students are not just consumers of technology but creators and innovators who drive the next wave of digital transformation. BLOTIC aims to cultivate a community of blockchain enthusiasts and Web3 developers who will lead the decentralized revolution.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="section what-we-do" ref={whatWeDoRef}>
        <div className="container">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={whatWeDoInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
            className="section-title"
          >
            What We <span className="gradient-text">Do</span>
          </motion.h2>
          <motion.div 
            className="grid grid-3"
            variants={containerVariants}
            initial="hidden"
            animate={whatWeDoInView ? "visible" : "hidden"}
          >
            <motion.div variants={itemVariants} className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-code"></i>
              </div>
              <h3 className="feature-title">Technical Workshops</h3>
              <p className="feature-description">
                Hands-on workshops covering blockchain fundamentals, smart contract development, dApp creation, and Web3 technologies.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-trophy"></i>
              </div>
              <h3 className="feature-title">Competitions & Challenges</h3>
              <p className="feature-description">
                Regular coding competitions and challenges to test students and showcase their blockchain development skills.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-users"></i>
              </div>
              <h3 className="feature-title">Community Building</h3>
              <p className="feature-description">
                Fostering a collaborative environment where students can learn, share ideas, and work together on innovative projects.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-handshake"></i>
              </div>
              <h3 className="feature-title">Industry Connections</h3>
              <p className="feature-description">
                Networking events, guest lectures, and partnerships with blockchain companies and industry experts.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-project-diagram"></i>
              </div>
              <h3 className="feature-title">Project Development</h3>
              <p className="feature-description">
                Supporting students in developing real-world blockchain projects and decentralized applications.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <h3 className="feature-title">Learning Resources</h3>
              <p className="feature-description">
                Curated learning materials, documentation, and resources to help students stay updated with blockchain trends.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* College Information Section */}
      <section className="section college-info py-16" ref={collegeInfoRef}>
        <div className="container mx-auto px-4">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={collegeInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-center mb-16 text-white"
          >
            Our <span className="gradient-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Home</span>
          </motion.h2>
          
          <motion.div 
            className="flex flex-col lg:flex-row gap-8 lg:gap-12 max-w-6xl mx-auto"
            variants={cardRowVariants}
            initial="hidden"
            animate={collegeInView ? "visible" : "hidden"}
          >
            {/* College Information Card */}
            <motion.div variants={itemVariants} className="flex-1">
              <div className="card bg-card/50 backdrop-blur-sm rounded-lg p-8 border border-white/10 h-full flex flex-col">
                <div className="college-logo-placeholder mb-6 text-center">
                  <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-university text-3xl text-primary"></i>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-6 text-white text-center">Bharati Vidyapeeth College of Engineering</h3>
                <p className="text-white text-base leading-relaxed mb-6">
                  Leading the way in innovative technology education and emerging tech research, BVCOE provides the perfect environment for technical clubs like BLOTIC to thrive. The college's commitment to fostering innovation and entrepreneurship creates an ideal ecosystem for students to explore blockchain and Web3 technologies.
                </p>
                <p className="text-white text-base leading-relaxed">
                  Located in the heart of Pune, BVCOE offers state-of-the-art facilities and a vibrant academic environment that encourages interdisciplinary collaboration and research.
                </p>
              </div>
            </motion.div>
            
            {/* Contact Information Card */}
            <motion.div variants={itemVariants} className="flex-1">
              <div className="card bg-card/50 backdrop-blur-sm rounded-lg p-8 border border-white/10 h-full flex flex-col">
                <h3 className="text-2xl font-bold mb-6 text-white text-center">Contact Information</h3>
                
                <motion.div 
                  className="contact-info space-y-4 mb-8"
                  variants={containerVariants}
                  initial="hidden"
                  animate={collegeInView ? "visible" : "hidden"}
                >
                  <motion.div variants={itemVariants} className="contact-item flex items-center gap-4 p-4 bg-primary/10 rounded-lg">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <i className="fas fa-envelope text-primary"></i>
                    </div>
                    <a href="https://mail.google.com/mail/?view=cm&fs=1&to=bloticbvducoep@gmail.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary transition-colors">
                      bloticbvducoep@gmail.com
                    </a>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="contact-item flex items-center gap-4 p-4 bg-primary/10 rounded-lg">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <i className="fas fa-map-marker-alt text-primary"></i>
                    </div>
                    <a 
                      href="https://maps.app.goo.gl/HNAdBGmDKhkQmR117?g_st=aw" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white hover:text-primary transition-colors"
                    >
                      Bharati Vidyapeeth Campus, Dhankawadi Pune, Maharashtra
                    </a>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="contact-item flex items-center gap-4 p-4 bg-primary/10 rounded-lg">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <i className="fas fa-calendar text-primary"></i>
                    </div>
                    <span className="text-white">Established 2022</span>
                  </motion.div>
                </motion.div>
                
                <div className="mt-auto">
                  <h4 className="text-xl font-bold mb-4 text-white text-center">Connect With Us</h4>
                  <motion.div 
                    className="social-links flex justify-center gap-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate={collegeInView ? "visible" : "hidden"}
                  >
                    <motion.a 
                      variants={itemVariants}
                      href="https://www.instagram.com/blotic_bvducoep?igsh=Z25lNWZvNTBmaWN1" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="social-link w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <i className="fab fa-instagram text-white"></i>
                    </motion.a>
                    <motion.a 
                      variants={itemVariants}
                      href="https://www.linkedin.com/company/blotic/posts/?feedView=all" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="social-link w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <i className="fab fa-linkedin-in text-white"></i>
                    </motion.a>
                    <motion.a 
                      variants={itemVariants}
                      href="https://chat.whatsapp.com/D1QbpsJZuV1CscnlwA21JS" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="social-link w-12 h-12 bg-green-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <i className="fab fa-whatsapp text-white"></i>
                    </motion.a>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      </div>
    </>
  );
};

export default About;