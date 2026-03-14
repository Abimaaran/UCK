import React from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { initialTournaments } from '../data/mockData';
import './TournamentsSection.css';

const TournamentsSection = () => {
  const [tournaments] = useLocalStorage('uck_tournaments', initialTournaments);

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'upcoming': return '#FF6B6B';
      case 'ongoing': return '#FFD700';
      case 'completed': return '#20C997';
      default: return '#4A90E2';
    }
  };

  return (
    <section className="tournaments-section" id="tournaments">
      <div className="container">
        <div className="section-header">
          <div className="header-decoration">
            <div className="chess-board-icon">♜</div>
            <h2 className="section-title">Tournaments & Events</h2>
            <div className="chess-board-icon">♜</div>
          </div>
          <p className="section-subtitle">Compete, Learn, and Grow with Uncrowned Kings</p>
        </div>
        
        <div className="tournaments-container">
          {tournaments.map((tournament, index) => (
            <div 
              className={`tournament-plate ${tournament.status.toLowerCase()}`}
              key={index}
              style={{ 
                '--tournament-color': getStatusColor(tournament.status),
                '--tournament-gradient': tournament.gradient 
              }}
            >
              <div className="plate-wrapper">
                <div className="plate-header">
                  <div 
                    className="plate-icon-wrapper"
                    style={{ background: tournament.gradient }}
                  >
                    <span className="plate-icon">{tournament.icon}</span>
                  </div>
                  
                  <div className="plate-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(tournament.status) }}
                    >
                      {tournament.status}
                    </span>
                  </div>
                </div>
                
                <div className="plate-body">
                  <h3 className="tournament-name">{tournament.name}</h3>
                  
                  <div className="tournament-details">
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">{tournament.date}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">👥</span>
                      <span className="detail-text">{tournament.participants}</span>
                    </div>
                  </div>
                </div>
                
                <div className="plate-footer">
                  <button className="view-details-btn">
                    View Details
                    <span className="btn-arrow">→</span>
                  </button>
                </div>
                
                <div className="plate-decoration">
                  <div className="corner-line top-left"></div>
                  <div className="corner-line top-right"></div>
                  <div className="corner-line bottom-left"></div>
                  <div className="corner-line bottom-right"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="tournaments-cta">
          <p className="cta-text">Want to participate in our upcoming tournaments?</p>
          <button className="register-cta-btn">
            Register Now
            <span className="cta-icon">♛</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default TournamentsSection;