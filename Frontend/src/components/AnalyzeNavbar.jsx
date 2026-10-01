import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaChessBoard, FaSignOutAlt } from 'react-icons/fa';
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
            <FaUser style={{ marginRight: '6px' }} /> Profile
          </button>
          <button
            className={`analyze-nav-link ${location.pathname === '/analyze-game' ? 'active' : ''}`}
            onClick={() => navigate('/analyze-game')}
          >
            <FaChessBoard style={{ marginRight: '6px' }} /> Analyze Game
          </button>
        </div>

        <button className="analyze-nav-logout" onClick={handleLogout}>
          <FaSignOutAlt style={{ marginRight: '6px' }} /> Logout
        </button>
      </div>
    </nav>
  );
};

export default AnalyzeNavbar;
