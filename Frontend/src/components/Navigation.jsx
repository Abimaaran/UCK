import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navigation.css';
import { useTheme } from '../context/ThemeContext';


const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(localStorage.getItem('isAdminLoggedIn') === 'true');
  const [isStudentLoggedIn, setIsStudentLoggedIn] = useState(localStorage.getItem('isStudentLoggedIn') === 'true');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Listen for login/logout events
  React.useEffect(() => {
    const syncState = () => {
      setIsAdminLoggedIn(localStorage.getItem('isAdminLoggedIn') === 'true');
      setIsStudentLoggedIn(localStorage.getItem('isStudentLoggedIn') === 'true');
    };

    window.addEventListener('adminLogin', syncState);
    window.addEventListener('studentLogin', syncState);
    window.addEventListener('storage', syncState);

    return () => {
      window.removeEventListener('adminLogin', syncState);
      window.removeEventListener('studentLogin', syncState);
      window.removeEventListener('storage', syncState);
    };
  }, []);

  const handleAdminLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    setIsAdminLoggedIn(false);
    navigate('/');
  };

  const handleStudentLogout = () => {
    localStorage.removeItem('isStudentLoggedIn');
    localStorage.removeItem('loggedInStudentId');
    setIsStudentLoggedIn(false);
    navigate('/');
  };

  // Your logo image URL
  const logoImageUrl = "/image.png";

  // Smooth scroll function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsOpen(false);
  };

  /* ── Portal buttons (right side) rendered based on auth state ── */
  const renderPortalButtons = (mobile = false) => {
    const base = mobile ? 'btn-login' : 'btn-login';

    if (isAdminLoggedIn) {
      return (
        <>
          <button
            className={`${base} admin-btn`}
            onClick={() => { navigate('/admin'); setIsOpen(false); }}
          >
            Admin Login
          </button>
          <button
            className={`${base} logout-btn`}
            onClick={() => { handleAdminLogout(); setIsOpen(false); }}
          >
            Logout
          </button>
        </>
      );
    }

    if (isStudentLoggedIn) {
      return (
        <>
          <button
            className={`${base} student-portal-btn`}
            onClick={() => { navigate('/student-portal'); setIsOpen(false); }}
          >
            🎓 Student Portal
          </button>
          <button
            className={`${base} logout-btn`}
            onClick={() => { handleStudentLogout(); setIsOpen(false); }}
          >
            Logout
          </button>
        </>
      );
    }

    return (
      <div className="nav-actions">
        <button 
          className={base} 
          onClick={() => { 
            scrollToSection('login'); 
            window.dispatchEvent(new CustomEvent('setPortalType', { detail: 'admin' }));
            setIsOpen(false); 
          }}
        >
          Admin Login
        </button>
        <button 
          className={base} 
          onClick={() => { 
            scrollToSection('login'); 
            window.dispatchEvent(new CustomEvent('setPortalType', { detail: 'student' }));
            setIsOpen(false); 
          }}
        >
          Student Portal
        </button>
        <div className="nav-separator-mini"></div>
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Dark/Light Mode">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    );
  };

  return (
    <nav className="navbar">
      <div className="nav-container vertical-header">
        {/* Top: Logo Section */}
        <div className="header-top-section">
          <button onClick={scrollToTop} className="logo-button">
            <div className="vertical-logo-wrapper">
              <img
                src={logoImageUrl}
                alt="Uncrowned Kings Chess Academy Logo"
                className="centered-logo"
              />
              <div className="vertical-logo-text">
                <h1 className="logo-title">Uncrowned Kings Chess Academy</h1>
                <p className="logo-tagline">Think Strategically, Play Brilliantly</p>
              </div>
            </div>
          </button>
        </div>

        {/* Bottom: Navigation Links & Actions Section */}
        <div className="header-bottom-section">
          <div className="centered-nav-links">
            <button onClick={() => scrollToSection('home')} className="nav-link active">Home</button>
            <button onClick={() => scrollToSection('about')} className="nav-link">About US</button>
            <button onClick={() => scrollToSection('students')} className="nav-link">Students</button>
            <button onClick={() => scrollToSection('tournaments')} className="nav-link">Tournaments</button>
            <button onClick={() => scrollToSection('timetable')} className="nav-link">Timetable</button>
            <button onClick={() => scrollToSection('coaches')} className="nav-link">Coaches</button>
            <button onClick={() => scrollToSection('contact')} className="nav-link">Contact US</button>
            <div className="nav-row-separator"></div>
            {renderPortalButtons(false)}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={`bar ${isOpen ? 'rotate-45' : ''}`}></span>
          <span className={`bar ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`bar ${isOpen ? '-rotate-45' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        <div className="mobile-logo-center">
          <img
            src={logoImageUrl}
            alt="Uncrowned Kings Chess Academy Logo"
            className="mobile-centered-logo"
          />
          <div className="mobile-center-text">
            <h3>Uncrowned Kings Chess Academy</h3>
            <p>Think Strategically, Play Brilliantly</p>
          </div>
        </div>
        <button onClick={() => scrollToSection('home')} className="mobile-link">Home</button>
        <button onClick={() => scrollToSection('about')} className="mobile-link">About US</button>
        <button onClick={() => scrollToSection('students')} className="mobile-link">Students</button>
        <button onClick={() => scrollToSection('tournaments')} className="mobile-link">Tournaments</button>
        <button onClick={() => scrollToSection('timetable')} className="mobile-link">Timetable</button>
        <button onClick={() => scrollToSection('coaches')} className="mobile-link">Coaches</button>
        <button onClick={() => scrollToSection('contact')} className="mobile-link">Contact US</button>
        <div className="mobile-actions">
          {renderPortalButtons(true)}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;