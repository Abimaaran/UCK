// src/components/HeroSection.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="hero-section" id="home">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">
            Think Like a King<span className="highlight">Play to Master</span>
          </h1>
          <p className="hero-subtitle">
            At Uncrowned Kings, learn chess from passionate FIDE-rated coaches committed to your growth.
Build strategic thinking, improve consistently, and take your game to the next level.
          </p>
          <div className="hero-actions">
            <button className="hero-btn primary" onClick={() => navigate('/register')}>
              Register Now..
            </button>
            <button className="hero-btn secondary">
              Watch Demo Class
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <h3>5+</h3>
              <p>Years Experienced Coaches</p>
            </div>
            <div className="stat">
              <h3>150+</h3>
              <p>Students Trained</p>
            </div>
            <div className="stat">
              <h3>50+</h3>
              <p>Tournaments Won</p>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <div className="chessboard-animation">
            {/* White Pieces */}
            <div className="chess-piece king">♔</div>
            <div className="chess-piece knight">♘</div>
            <div className="chess-piece pawn-white">♙</div>
            <div className="chess-piece rook">♖</div>
            
            {/* Black Pieces */}
            <div className="chess-piece queen">♕</div>
            <div className="chess-piece bishop">♗</div>
            <div className="chess-piece pawn-black">♟</div>
          </div>
        </div>
      </div>
      <div className="hero-wave">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 60L60 50C120 40 240 20 360 20C480 20 600 40 720 53.3C840 66.7 960 73.3 1080 70C1200 66.7 1320 53.3 1380 46.7L1440 40V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V60Z" fill="var(--bg-primary)"/>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;