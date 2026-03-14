import React, { useState, useEffect } from 'react';
import { getCollection } from '../services/api';
import './CoachesSection.css';

const CoachesSection = () => {
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [coaches, setCoaches] = useState([]);

  useEffect(() => {
    const loadCoaches = async () => {
      try {
        const data = await getCollection('coaches');
        setCoaches(data);
      } catch (error) {
        console.error("Failed to load coaches", error);
      }
    };
    loadCoaches();
  }, []);

  // Generate SVG placeholder images with chess pieces
  const generateChessAvatar = (name, piece = '♔') => {
    const initials = name.split(' ').map(n => n[0]).join('');
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%2300BFFF;stop-opacity:1"/><stop offset="100%" style="stop-color:%230A74DA;stop-opacity:1"/></linearGradient></defs><rect width="300" height="300" fill="url(%23grad)"/><text x="150" y="150" font-family="Arial" font-size="80" fill="%23FFFFFF" text-anchor="middle" dy=".3em">${piece}</text><text x="150" y="220" font-family="Arial" font-size="30" fill="%23FFFFFF" text-anchor="middle">${initials}</text></svg>`;
  };

  const closeCoachProfile = () => {
    setSelectedCoach(null);
  };

  return (
    <section className="coaches-section" id="coaches">
      <div className="container">
        <div className="section-header">
          <div className="header-decoration">
            <div className="crown-icon">♔</div>
            <h2 className="section-title">Meet Our Expert Coaches</h2>
            <div className="crown-icon">♔</div>
          </div>
          <p className="section-subtitle">Learn from Internationally Rated FIDE Coaches</p>
        </div>
        
        <div className="coaches-container">
          {coaches.map((coach) => (
            <div 
              className="coach-profile-plate" 
              key={coach.id}
              onClick={() => openCoachProfile(coach)}
            >
              <div className="profile-wrapper">
                <div className="coach-image-container" style={{ background: coach.colorGradient }}>
                  <div className="image-wrapper">
                    <img 
                      src={generateChessAvatar(coach.name, coach.chessPiece)}
                      alt={coach.name} 
                      className="coach-image"
                    />
                    <div className="image-overlay">
                      <span className="view-profile-text">View Profile</span>
                    </div>
                  </div>
                  
                  <div className="fide-badge">
                    <span className="fide-icon">♛</span>
                    <span className="fide-text">{coach.fideId}</span>
                  </div>
                </div>
                
                <div className="coach-info">
                  <div className="coach-header">
                    <h3 className="coach-name">{coach.name}</h3>
                    <div className="rating-badge">
                      <span className="rating-star">★</span>
                      <span className="rating-text">{coach.rating}</span>
                    </div>
                  </div>
                  
                  <div className="coach-title-container">
                    <span className="coach-title">{coach.title}</span>
                    <span className="experience-badge">{coach.experience}</span>
                  </div>
                  
                  <div className="specialization-tag">
                    <span className="tag-icon">🎯</span>
                    <span>{coach.specialization}</span>
                  </div>
                  
                  <p className="coach-bio-preview">{coach.bio.substring(0, 80)}...</p>
                  
                  <div className="achievements-preview">
                    {coach.achievements.slice(0, 2).map((achievement, idx) => (
                      <span key={idx} className="achievement-tag">
                        {achievement}
                      </span>
                    ))}
                    {coach.achievements.length > 2 && (
                      <span className="achievement-more">+{coach.achievements.length - 2} more</span>
                    )}
                  </div>
                </div>
                
                <div className="profile-decoration">
                  <div className="decor-line top"></div>
                  <div className="decor-line right"></div>
                  <div className="decor-line bottom"></div>
                  <div className="decor-line left"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="coaches-cta">
          <p className="cta-text">Ready to learn from our FIDE-rated experts?</p>
          <button className="book-session-btn">
            Book a Trial Session
            <span className="btn-crown">♛</span>
          </button>
        </div>
      </div>

      {/* Coach Profile Modal */}
      {selectedCoach && (
        <div className="coach-modal-overlay" onClick={closeCoachProfile}>
          <div className="coach-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeCoachProfile}>×</button>
            
            <div className="modal-coach-profile">
              <div className="modal-image-section">
                <div 
                  className="modal-image-wrapper"
                  style={{ background: selectedCoach.colorGradient }}
                >
                  <img 
                    src={generateChessAvatar(selectedCoach.name, selectedCoach.chessPiece)}
                    alt={selectedCoach.name}
                    className="modal-coach-image"
                  />
                </div>
                
                <div className="modal-badges">
                  <div className="modal-fide-badge">
                    <span className="modal-fide-icon">♛</span>
                    <div>
                      <div className="fide-label">FIDE ID</div>
                      <div className="fide-value">{selectedCoach.fideId.split(' ')[1]}</div>
                    </div>
                  </div>
                  
                  <div className="modal-rating-badge">
                    <span className="modal-rating-icon">⭐</span>
                    <div>
                      <div className="rating-label">FIDE Rating</div>
                      <div className="rating-value">{selectedCoach.rating.split(': ')[1]}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-info-section">
                <div className="modal-header">
                  <h2 className="modal-coach-name">{selectedCoach.name}</h2>
                  <div className="modal-title-experience">
                    <span className="modal-title">{selectedCoach.title}</span>
                    <span className="modal-experience">• {selectedCoach.experience}</span>
                  </div>
                </div>
                
                <div className="modal-specialization">
                  <span className="specialization-label">Specialization:</span>
                  <span className="specialization-value">{selectedCoach.specialization}</span>
                </div>
                
                <div className="modal-bio">
                  <h3 className="bio-title">About Coach</h3>
                  <p className="bio-content">{selectedCoach.bio}</p>
                </div>
                
                <div className="modal-achievements">
                  <h3 className="achievements-title">Key Achievements</h3>
                  <ul className="achievements-list">
                    {selectedCoach.achievements.map((achievement, idx) => (
                      <li key={idx} className="achievement-item">
                        <span className="achievement-icon">🏆</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="modal-actions">
                  <button className="modal-book-btn">
                    <span className="book-icon">📅</span>
                    Book Session with {selectedCoach.name.split(' ')[1]}
                  </button>
                  <button className="modal-contact-btn">
                    <span className="contact-icon">📧</span>
                    Contact Coach
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CoachesSection;