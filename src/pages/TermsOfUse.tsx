import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Mail, MapPin } from "@/components/icons";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/utils/animations";

const TermsOfUse = () => {
  return (
    <div className="min-h-screen py-8 md:py-16">
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div 
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">Terms of Use</h1>
          <p className="text-muted-foreground text-sm md:text-base">Last updated: February 2025</p>
        </motion.div>

        <motion.div 
          className="space-y-6 md:space-y-8 text-left"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
              }
            }
          }}
        >
          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              By accessing and using BLOTIC's website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">2. Use License</h2>
            <p className="text-muted-foreground text-sm md:text-base mb-3 leading-relaxed">
              Permission is granted to temporarily download one copy of the materials on BLOTIC's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-1 md:space-y-2 text-muted-foreground text-sm md:text-base ml-2 md:ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">3. Membership</h2>
            <h3 className="text-xl font-semibold mb-3">Eligibility</h3>
            <p className="text-muted-foreground mb-4">
              BLOTIC membership is open to students of Bharati Vidyapeeth College of Engineering. Membership is subject to approval and compliance with our community guidelines.
            </p>
            
            <h3 className="text-xl font-semibold mb-3">Member Responsibilities</h3>
            <p className="text-muted-foreground mb-3">As a BLOTIC member, you agree to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Maintain respectful and professional behavior</li>
              <li>Participate actively in club activities and events</li>
              <li>Follow all college and club rules and regulations</li>
              <li>Contribute positively to the community</li>
            </ul>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">4. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content, trademarks, service marks, trade names, logos, and other intellectual property displayed on this website are the property of BLOTIC or their respective owners. You may not use, reproduce, or distribute any content without prior written permission.
            </p>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">5. User Content</h2>
            <p className="text-muted-foreground">
              You are responsible for any content you submit to our website or events. By submitting content, you grant BLOTIC a non-exclusive, royalty-free license to use, modify, and distribute your content for club-related purposes.
            </p>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">6. Prohibited Activities</h2>
            <p className="text-muted-foreground mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Use the website for any unlawful purpose</li>
              <li>Transmit any harmful, threatening, or offensive content</li>
              <li>Interfere with the proper functioning of the website</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">7. Privacy</h2>
            <p className="text-muted-foreground">
              Your privacy is important to us. Please review our{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              , which also governs your use of the website, to understand our practices.
            </p>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">8. Disclaimers</h2>
            <p className="text-muted-foreground">
              The materials on BLOTIC's website are provided on an 'as is' basis. BLOTIC makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">9. Limitations</h2>
            <p className="text-muted-foreground">
              In no event shall BLOTIC or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on BLOTIC's website, even if BLOTIC or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">10. Event Participation</h2>
            <p className="text-muted-foreground">
              Participation in BLOTIC events is voluntary and at your own risk. You agree to follow all event rules and safety guidelines. BLOTIC reserves the right to remove participants who violate event policies.
            </p>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">11. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your access to our services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">12. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
            </p>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">13. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be interpreted and governed by the laws of India, without regard to its conflict of law provisions.
            </p>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">14. Contact Information</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about these Terms of Use, please contact us at:
            </p>
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <p className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <strong className="mr-2">Email:</strong>
                <a href="https://mail.google.com/mail/?view=cm&fs=1&to=bloticbvducoep@gmail.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  bloticbvducoep@gmail.com
                </a>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <strong className="mr-2">Address:</strong>
                <a 
                  href="https://maps.app.goo.gl/HNAdBGmDKhkQmR117?g_st=aw" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Bharati Vidyapeeth Campus, Dhankawadi Pune, Maharashtra
                </a>
              </p>
            </div>
          </motion.section>
        </motion.div>

        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <Button asChild size="lg">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
};

export default TermsOfUse;
