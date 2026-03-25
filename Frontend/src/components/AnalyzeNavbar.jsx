import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AnalyzeNavbar.css';

const AnalyzeNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('isStudentLoggedIn');
    localStorage.removeItem('loggedInStudentId');
    navigate('/');
  };

  return (
    <nav className="analyze-navbar">
      <div className="analyze-nav-container">
        <div className="analyze-nav-brand" onClick={() => navigate('/')}>
          <span className="analyze-nav-crown">♔</span>
          <div className="analyze-nav-text">
            <span className="analyze-nav-title">UCK Analysis</span>
          </div>
        </div>

        <div className="analyze-nav-links">
          <button
            className={`analyze-nav-link ${location.pathname === '/student-portal' ? 'active' : ''}`}
            onClick={() => navigate('/student-portal')}
          >
            <i className="fas fa-user"></i> Profile
          </button>
          <button
            className={`analyze-nav-link ${location.pathname === '/analyze-game' ? 'active' : ''}`}
            onClick={() => navigate('/analyze-game')}
          >
            <i className="fas fa-chess-board"></i> Analyze Game
          </button>
        </div>

        <button className="analyze-nav-logout" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </nav>
  );
};

export default AnalyzeNavbar;
