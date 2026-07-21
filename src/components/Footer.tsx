import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer>
      {/* Animated Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-purple-500 rounded-full filter blur-[100px] opacity-10"></div>
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-amber-500 rounded-full filter blur-[100px] opacity-10"></div>
      </div>

      <div className="footer-content">
        <div className="footer-section brand-section">
          <div className="footer-logo">
            <h3>BLOTIC</h3>
            <p>Empowering the next generation of Web3 innovators at Bharati Vidyapeeth College of Engineering</p>
          </div>
          <div className="footer-contact">
            <p className="flex items-center gap-2">
              <i className="fas fa-envelope flex-shrink-0"></i>
              <a href="https://mail.google.com/mail/?view=cm&fs=1&to=bloticbvducoep@gmail.com" target="_blank" rel="noopener noreferrer">bloticbvducoep@gmail.com</a>
            </p>
            <p className="flex items-start gap-2">
              <i className="fas fa-map-marker-alt flex-shrink-0 mt-1"></i>
              <a 
                href="https://maps.app.goo.gl/HNAdBGmDKhkQmR117?g_st=aw" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Bharati Vidyapeeth Campus, Dhankawadi Pune, Maharashtra
              </a>
            </p>
          </div>
        </div>
        
        <div className="footer-section links-section">
          <div className="footer-column">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/core">Core Team</Link></li>
              <li><Link to="/events">Events</Link></li>
              <li><Link to="/gallery">Gallery</Link></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4>Resources</h4>
            <ul>
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/terms-of-use">Terms of Use</Link></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4>Connect With Us</h4>
            <div className="social-icons-wrapper">
              <a 
                href="https://www.instagram.com/blotic_bvducoep?igsh=Z25lNWZvNTBmaWN1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-icon-animated instagram"
                aria-label="Follow us on Instagram"
              >
                <div className="tooltip">Instagram</div>
                <span className="icon-circle">
                  <i className="fab fa-instagram" aria-hidden="true"></i>
                </span>
              </a>
              <a 
                href="https://www.linkedin.com/company/blotic/posts/?feedView=all" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-icon-animated linkedin"
                aria-label="Connect with us on LinkedIn"
              >
                <div className="tooltip">LinkedIn</div>
                <span className="icon-circle">
                  <i className="fab fa-linkedin-in" aria-hidden="true"></i>
                </span>
              </a>
              <a 
                href="https://chat.whatsapp.com/D1QbpsJZuV1CscnlwA21JS" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-icon-animated whatsapp"
                aria-label="Join our WhatsApp group"
              >
                <div className="tooltip">WhatsApp</div>
                <span className="icon-circle">
                  <i className="fab fa-whatsapp" aria-hidden="true"></i>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2025 BLOTIC - Bharati Vidyapeeth's Premier Blockchain & Web3 Club. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;