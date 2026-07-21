import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Mail, MapPin } from "@/components/icons";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/utils/animations";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen py-8 md:py-16">
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div 
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed text-sm md:text-base">Last updated: February 2025</p>
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
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">1. Introduction</h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed text-sm md:text-base leading-relaxed">
              BLOTIC ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or participate in our events.
            </p>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">2. Information We Collect</h2>
            <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">Personal Information</h3>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed text-sm md:text-base mb-3 leading-relaxed">
              We may collect personal information that you voluntarily provide to us when you:
            </p>
            <ul className="list-disc list-inside space-y-1 md:space-y-2 text-muted-foreground text-sm md:text-base leading-relaxed text-sm md:text-base ml-2 md:ml-4">
              <li>Register for BLOTIC membership</li>
              <li>Participate in our events and workshops</li>
              <li>Contact us for support or inquiries</li>
              <li>Subscribe to our newsletter or communications</li>
            </ul>
            
            <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 mt-4 md:mt-6">Automatically Collected Information</h3>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed text-sm md:text-base mb-3 leading-relaxed">
              We may automatically collect certain information about your device and usage patterns, including:
            </p>
            <ul className="list-disc list-inside space-y-1 md:space-y-2 text-muted-foreground text-sm md:text-base leading-relaxed text-sm md:text-base ml-2 md:ml-4">
              <li>IP address and location data</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent on our website</li>
              <li>Referring website information</li>
            </ul>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed text-sm md:text-base mb-3 leading-relaxed">We use the collected information for the following purposes:</p>
            <ul className="list-disc list-inside space-y-1 md:space-y-2 text-muted-foreground text-sm md:text-base leading-relaxed text-sm md:text-base ml-2 md:ml-4">
              <li>To provide and maintain our services</li>
              <li>To communicate with you about events and opportunities</li>
              <li>To improve our website and services</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
            </ul>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">4. Information Sharing and Disclosure</h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed text-sm md:text-base mb-3 leading-relaxed">
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-1 md:space-y-2 text-muted-foreground text-sm md:text-base leading-relaxed text-sm md:text-base ml-2 md:ml-4">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With trusted service providers who assist in our operations</li>
            </ul>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">5. Data Security</h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
            </p>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm md:text-base leading-relaxed ml-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Object to processing of your information</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">7. Cookies and Tracking</h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Our website may use cookies and similar tracking technologies to enhance your experience. You can control cookie settings through your browser preferences.
            </p>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">8. Third-Party Links</h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
            </p>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">9. Changes to This Policy</h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </motion.section>

          <motion.section 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-4">
              If you have any questions about this Privacy Policy, please contact us at:
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
          transition={{ duration: 0.5, delay: 0.8 }}
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

export default PrivacyPolicy;
