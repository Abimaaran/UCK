// src/components/Footer.jsx
import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Academy Info Section */}
          <div className="footer-section academy-info">
            <div className="academy-header">
              <div className="chess-icon">♔</div>
              <div className="academy-brand">
                <h3 className="academy-name">Uncrowned Kings</h3>
                <p className="academy-tagline">Chess Academy</p>
              </div>
            </div>
            <p className="academy-description">
              Empowering chess enthusiasts to reach their full potential through expert coaching and innovative learning methods.
            </p>
            
             
              
           
          </div>
          
          {/* Quick Links Section */}
          <div className="footer-section quick-links">
            <h4 className="section-title">Quick Links</h4>
            <ul className="links-list">
              <li><a href="#home" className="footer-link">Home</a></li>
              <li><a href="#about" className="footer-link">About Us</a></li>
              <li><a href="#coaches" className="footer-link">Coaches</a></li>
              <li><a href="#students" className="footer-link">Students</a></li>
              <li><a href="#tournaments" className="footer-link">Tournaments</a></li>
              <li><a href="#contact" className="footer-link">Contact</a></li>
            </ul>
          </div>
          
          {/* Contact Info Section */}
          <div className="footer-section contact-info">
            <h4 className="section-title">Contact Us</h4>
            <div className="contact-details">
              <div className="contact-item">
                <div className="contact-icon-wrapper">
                  <span className="contact-icon">📍</span>
                </div>
                <div className="contact-text">
                  <span className="contact-label">Main Academy</span>
                  <span className="contact-value">No.6, St Benedict Road, Nallur, Jaffna</span>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon-wrapper">
                  <span className="contact-icon">📱</span>
                </div>
                <div className="contact-text">
                  <span className="contact-label">Phone / WhatsApp</span>
                  <a href="https://wa.me/940779594569" target="_blank" rel="noopener noreferrer" className="contact-link">
                    +94 077 959 4569
                  </a>
                  <a href="https://wa.me/940724682692" target="_blank" rel="noopener noreferrer" className="contact-link">
                    +94 072 468 2692
                  </a>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon-wrapper">
                  <span className="contact-icon">✉️</span>
                </div>
                <div className="contact-text">
                  <span className="contact-label">Email</span>
                  <a href="mailto:uncrownedkings2025@gmail.com" className="contact-link">
                    uncrownedkings2025@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Social Media Section */}
          <div className="footer-section social-media">
            <h4 className="section-title">Follow Us</h4>
            <p className="social-description">Stay connected for updates and chess tips</p>
            
            <div className="social-buttons">
              <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-round"
              title="Facebook"
            >
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="12" fill="#1877F2" />
              <path
                d="M15 8.5h-1.6c-.3 0-.4.2-.4.5v1.5H15l-.3 2h-1.7V18h-2.1v-5.5H9.5v-2h1.4V8.7c0-1.4.9-2.7 2.9-2.7H15v2.5z"
                fill="#fff"
              />
            </svg>
          </a>

    <a
      href="https://www.instagram.com/uncrownedkingschess/profilecard/?igsh=MWNnMXY2ZmhvNG84cg=="
      target="_blank"
      rel="noopener noreferrer"
      className="social-round"
      title="Instagram"
    >
      <svg viewBox="0 0 24 24">
        <defs>
          <linearGradient id="ig" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f58529" />
            <stop offset="50%" stopColor="#dd2a7b" />
            <stop offset="100%" stopColor="#8134af" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="12" fill="url(#ig)" />
        <rect x="7" y="7" width="10" height="10" rx="3" stroke="#fff" strokeWidth="1.8" fill="none" />
        <circle cx="12" cy="12" r="2.5" stroke="#fff" strokeWidth="1.8" fill="none" />
        <circle cx="15.5" cy="8.5" r="1" fill="#fff" />
      </svg>
    </a>

<a
  href="https://wa.me/940779594569"
  target="_blank"
  rel="noopener noreferrer"
  className="social-round"
  title="WhatsApp"
>
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="12" fill="#25D366" />
    <path
      d="M16.6 13.9c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.6.1-.2.2-.7.7-.8.8-.1.1-.3.1-.5 0-.2-.1-1-.4-1.8-1.3-.7-.7-1.2-1.6-1.3-1.8-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.3.5 1.8.6.7.2 1.4.2 1.9.1.6-.1 1.3-.6 1.5-1.1.2-.5.2-.9.1-1-.1-.1-.2-.2-.4-.3z"
      fill="#fff"
    />
  </svg>
</a>

              
              
            </div>
            
            <div className="newsletter">
              <h5 className="newsletter-title">Subscribe to Newsletter</h5>
              <form className="newsletter-form">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="newsletter-input"
                />
                <button type="submit" className="newsletter-btn">
                  <span className="btn-arrow">→</span>
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} Uncrowned Kings Chess Academy. All rights reserved.
            </p>
            
            <div className="footer-links">
              <a href="#" className="footer-bottom-link">Privacy Policy</a>
              <span className="separator">•</span>
              <a href="#" className="footer-bottom-link">Terms of Service</a>
              <span className="separator">•</span>
              <a href="#" className="footer-bottom-link">Refund Policy</a>
            </div>
            
            <div className="footer-credits">
              <span className="credit-text">Designed with </span>
              <span className="heart-icon">♔</span>
              <span className="credit-text"> for chess lovers</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;