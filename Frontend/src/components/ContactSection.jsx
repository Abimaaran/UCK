// src/components/ContactSection.jsx
import React, { useState } from 'react';
import './ContactSection.css';

const ContactSection = () => {
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log({
        review,
        rating,
        timestamp: new Date().toISOString()
      });
      setIsSubmitting(false);
      setReviewSubmitted(true);
      setReview('');
      setRating(0);
      
      // Reset after 3 seconds
      setTimeout(() => setReviewSubmitted(false), 3000);
    }, 1000);
  };

  const handleStarClick = (value) => {
    setRating(value);
  };

  return (
    <section className="contact-section" id="contact">
      <div className="container">
        <div className="section-header">
          <div className="header-decoration">
            <div className="contact-icon">📞</div>
            <h2 className="section-title">Contact Us</h2>
            <div className="contact-icon">📍</div>
          </div>
          <p className="section-subtitle">Get in Touch with Uncrowned Kings Chess Academy</p>
        </div>
        
        <div className="contact-top-section">
          {/* Contact Information Container */}
          <div className="contact-info-plate">
            <div className="plate-content">
              <div className="plate-header">
                <div className="header-icon-wrapper">
                  <span className="header-icon">🏰</span>
                </div>
                <h3 className="plate-title">Contact Information</h3>
              </div>
              
              <div className="contact-details-container">
                <div className="contact-item-plate">
                  <div className="contact-icon-container" style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF5252)' }}>
                    <span className="contact-item-icon">📍</span>
                  </div>
                  <div className="contact-item-content">
                    <h4 className="contact-item-title">Our Locations</h4>
                    <div className="address-section">
                      <div className="main-address">
                        <span className="address-label">Main Academy:</span>
                        <p className="address-text">No.6, St Benedict Road, Nallur, Jaffna</p>
                      </div>
                      <div className="branches-section">
                        <span className="branches-label">Branch Locations:</span>
                        <div className="branch-item">
                          <span className="branch-marker">♟️</span>
                          <span className="branch-text">Church Lane, Kachcheri</span>
                        </div>
                        <div className="branch-item">
                          <span className="branch-marker">♟️</span>
                          <span className="branch-text">Uduvil</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="contact-item-plate">
                  <div className="contact-icon-container" style={{ background: 'linear-gradient(135deg, #4A90E2, #2A70D2)' }}>
                    <span className="contact-item-icon">📱</span>
                  </div>
                  <div className="contact-item-content">
                    <h4 className="contact-item-title">Phone Numbers</h4>
                    <div className="phone-list">
                      <a href="tel:+940779594569" className="phone-link">
                        <span className="phone-icon">📞</span>
                        <span className="phone-number">+94 077 959 4569</span>
                      </a>
                      <a href="tel:+940724682692" className="phone-link">
                        <span className="phone-icon">📞</span>
                        <span className="phone-number">+94 072 468 2692</span>
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="contact-item-plate">
                  <div className="contact-icon-container" style={{ background: 'linear-gradient(135deg, #20C997, #0BA360)' }}>
                    <span className="contact-item-icon">✉️</span>
                  </div>
                  <div className="contact-item-content">
                    <h4 className="contact-item-title">Email Address</h4>
                    <a href="mailto:uncrownedkings2025@gmail.com" className="email-link">
                      <span className="email-icon">📧</span>
                      <span className="email-address">uncrownedkings2025@gmail.com</span>
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="operating-hours">
                <h4 className="hours-title">Class Hours</h4>
                <div className="hours-grid">
                  <div className="hours-item">
                    <span className="hours-day">Tuesday & Friday</span>
                    <span className="hours-time">3:00 PM - 7:00 PM</span>
                  </div>
                  <div className="hours-item">
                    <span className="hours-day">Saturday & Sunday</span>
                    <span className="hours-time">9:00 AM - 12:00 noon</span>
                  </div>
                  <div className="hours-item">
                    <span className="hours-day">Online Classes</span>
                    <span className="hours-time">Starting Soon</span>
                  </div>
                </div>
              </div>
              
              <div className="social-connect">
                <h4 className="social-title">Connect With Us</h4>
                <div className="social-icons">
                  <a href="#" className="social-icon" title="Facebook">
                    <span><svg width="36" height="36" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="12"/>
  <path d="M15 8.5h-1.6c-.3 0-.4.2-.4.5v1.5H15l-.3 2h-1.7V18h-2.1v-5.5H9.5v-2h1.4V8.7c0-1.4.9-2.7 2.9-2.7H15v2.5z" fill="#fff"/>
</svg>
</span>
                  </a>
                  <a href="#" className="social-icon" title="WhatsApp">
                    <span><svg width="36" height="36" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="12"/>
  <path d="M16.6 13.9c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.6.1-.2.2-.7.7-.8.8-.1.1-.3.1-.5 0-.2-.1-1-.4-1.8-1.3-.7-.7-1.2-1.6-1.3-1.8-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.3.5 1.8.6.7.2 1.4.2 1.9.1.6-.1 1.3-.6 1.5-1.1.2-.5.2-.9.1-1-.1-.1-.2-.2-.4-.3z" fill="#fff"/>
</svg>
</span>
                  </a>
                  <a href="#" className="social-icon" title="Instagram">
                    <span><svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ig" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f58529"/>
      <stop offset="50%" stop-color="#dd2a7b"/>
      <stop offset="100%" stop-color="#8134af"/>
    </linearGradient>
  </defs>
  <circle cx="12" cy="12" r="12" fill="url(#ig)"/>
  <rect x="7" y="7" width="10" height="10" rx="3" ry="3" fill="none" stroke="#fff" stroke-width="1.8"/>
  <circle cx="12" cy="12" r="2.5" fill="none" stroke="#fff" stroke-width="1.8"/>
  <circle cx="15.5" cy="8.5" r="1" fill="#fff"/>
</svg>
</span>
                  </a>
                  
                </div>
              </div>
              
              <div className="plate-decoration">
                <div className="corner-decor top-left"></div>
                <div className="corner-decor top-right"></div>
                <div className="corner-decor bottom-left"></div>
                <div className="corner-decor bottom-right"></div>
              </div>
            </div>
          </div>
          
          {/* Review Container */}
          <div className="review-container-plate">
            <div className="plate-content">
              <div className="plate-header">
                <div className="header-icon-wrapper">
                  <span className="header-icon">⭐</span>
                </div>
                <h3 className="plate-title">Share Your Experience</h3>
              </div>
              
              <div className="review-content">
                {reviewSubmitted ? (
                  <div className="review-success">
                    <div className="success-icon">✅</div>
                    <h4 className="success-title">Thank You!</h4>
                    <p className="success-text">Your review has been submitted successfully.</p>
                    <p className="success-subtext">We value your feedback!</p>
                  </div>
                ) : (
                  <>
                    <div className="rating-section">
                      <h4 className="rating-title">Rate Your Experience</h4>
                      <div className="stars-container">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`star-btn ${star <= rating ? 'active' : ''}`}
                            onClick={() => handleStarClick(star)}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <p className="rating-text">
                        {rating === 0 ? 'Select your rating' : `You rated: ${rating} star${rating > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    
                    <form onSubmit={handleReviewSubmit} className="review-form">
                      <div className="form-group">
                        <textarea
                          className="review-textarea"
                          placeholder="Share your experience with our academy...
                          
What did you like most about our coaching?
How has chess improved for you or your child?
Any suggestions for improvement?"
                          value={review}
                          onChange={(e) => setReview(e.target.value)}
                          rows="4"
                          required
                        />
                        <div className="textarea-footer">
                          <span className="char-count">{review.length}/500</span>
                          <span className="hint-text">Minimum 50 characters</span>
                        </div>
                      </div>
                      
                      <div className="form-fields">
                        <div className="form-group">
                          <input
                            type="text"
                            className="name-input"
                            placeholder="Your Name (Optional)"
                          />
                        </div>
                        
                        <div className="form-group">
                          <input
                            type="email"
                            className="email-input"
                            placeholder="Your Email (Optional - for updates)"
                          />
                        </div>
                      </div>
                      
                      <div className="submit-section">
                        <button
                          type="submit"
                          className="submit-review-btn"
                          disabled={isSubmitting || review.length < 50 || rating === 0}
                        >
                          {isSubmitting ? (
                            <>
                              <span className="spinner"></span>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <span className="submit-icon">📤</span>
                              Submit Review
                            </>
                          )}
                        </button>
                        <p className="privacy-note">
                          By submitting, you agree to our <a href="#" className="privacy-link">Privacy Policy</a>
                        </p>
                      </div>
                    </form>
                    
                    <div className="review-guidelines">
                      <h4 className="guidelines-title">Review Guidelines</h4>
                      <ul className="guidelines-list">
                        <li>Be honest and specific about your experience</li>
                        <li>Focus on coaching quality and learning outcomes</li>
                        <li>Share constructive feedback to help us improve</li>
                        <li>No personal attacks or inappropriate language</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
              
              <div className="plate-decoration">
                <div className="corner-decor top-left"></div>
                <div className="corner-decor top-right"></div>
                <div className="corner-decor bottom-left"></div>
                <div className="corner-decor bottom-right"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="contact-cta">
          <p className="cta-text">Interested in joining our chess academy?</p>
          <button className="trial-btn">
            Schedule a Free Trial Class
            <span className="btn-chess">♛</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;