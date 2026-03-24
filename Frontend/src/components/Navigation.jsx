import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navigation.css';
import { useTheme } from '../context/ThemeContext';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(localStorage.getItem('isAdminLoggedIn') === 'true');
  const [isStudentLoggedIn, setIsStudentLoggedIn] = useState(localStorage.getItem('isStudentLoggedIn') === 'true');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Listen for login/logout events and scroll
  useEffect(() => {
    const syncState = () => {
      setIsAdminLoggedIn(localStorage.getItem('isAdminLoggedIn') === 'true');
      setIsStudentLoggedIn(localStorage.getItem('isStudentLoggedIn') === 'true');
    };

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Determine active section based on scroll
      const sections = ['home', 'about', 'students', 'tournaments', 'timetable', 'coaches', 'contact'];
      let current = '';
      
      for (let i = 0; i < sections.length; i++) {
        const section = document.getElementById(sections[i]);
        if (section) {
          const sectionTop = section.offsetTop;
          // Subtracted offset so the active state changes right before the section hits top
          if (window.scrollY >= sectionTop - 150) {
            current = sections[i];
          }
        }
      }
      if (current) {
        setActiveSection(current);
      }
    };

    window.addEventListener('adminLogin', syncState);
    window.addEventListener('studentLogin', syncState);
    window.addEventListener('storage', syncState);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('adminLogin', syncState);
      window.removeEventListener('studentLogin', syncState);
      window.removeEventListener('storage', syncState);
      window.removeEventListener('scroll', handleScroll);
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

  const logoImageUrl = "/image.png";

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

  const renderPortalButtons = (mobile = false) => {
    const baseClass = mobile ? 'mobile-btn' : 'nav-action-btn';

    if (isAdminLoggedIn) {
      return (
        <div className="nav-actions-group">
          <button
            className={`${baseClass} admin-active-btn`}
            onClick={() => { navigate('/admin'); setIsOpen(false); }}
          >
            Admin Panel
          </button>
          <button
            className={`${baseClass} logout-btn`}
            onClick={() => { handleAdminLogout(); setIsOpen(false); }}
          >
            Logout
          </button>
        </div>
      );
    }

    if (isStudentLoggedIn) {
      return (
        <div className="nav-actions-group">
          <button
            className={`${baseClass} student-portal-btn`}
            onClick={() => { navigate('/student-portal'); setIsOpen(false); }}
          >
            🎓 Student Portal
          </button>
          <button
            className={`${baseClass} logout-btn`}
            onClick={() => { handleStudentLogout(); setIsOpen(false); }}
          >
            Logout
          </button>
        </div>
      );
    }

    return (
      <div className="nav-actions-group">
        <button 
          className={`${baseClass} login-btn outline`} 
          onClick={() => { 
            scrollToSection('login'); 
            window.dispatchEvent(new CustomEvent('setPortalType', { detail: 'admin' }));
            setIsOpen(false); 
          }}
        >
          Admin Login
        </button>
        <button 
          className={`${baseClass} login-btn primary`} 
          onClick={() => { 
            scrollToSection('login'); 
            window.dispatchEvent(new CustomEvent('setPortalType', { detail: 'student' }));
            setIsOpen(false); 
          }}
        >
          Student Portal
        </button>
      </div>
    );
  };

  return (
    <nav className={`navbar premium-nav ${scrolled ? 'nav-scrolled' : ''}`}>
      <div className="nav-container">
        {/* Left: Logo Section */}
        <div className="nav-brand" onClick={scrollToTop}>
          <img
            src={logoImageUrl}
            alt="UCK Logo"
            className="brand-logo"
          />
          <div className="brand-text">
            <h1 className="brand-title">Uncrowned Kings</h1>
            <p className="brand-tagline">Chess Academy</p>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <div className="nav-links desktop-links">
          <button onClick={() => scrollToSection('home')} className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}>Home</button>
          <button onClick={() => scrollToSection('about')} className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}>About</button>
          <button onClick={() => scrollToSection('students')} className={`nav-link ${activeSection === 'students' ? 'active' : ''}`}>Students</button>
          <button onClick={() => scrollToSection('tournaments')} className={`nav-link ${activeSection === 'tournaments' ? 'active' : ''}`}>Tournaments</button>
          <button onClick={() => scrollToSection('timetable')} className={`nav-link ${activeSection === 'timetable' ? 'active' : ''}`}>Timetable</button>
          <button onClick={() => scrollToSection('coaches')} className={`nav-link ${activeSection === 'coaches' ? 'active' : ''}`}>Coaches</button>
          <button onClick={() => scrollToSection('contact')} className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}>Contact</button>
        </div>

        {/* Right: Actions */}
        <div className="nav-actions desktop-actions">
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className="divider"></div>
          {renderPortalButtons(false)}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Navigation"
        >
          <span className={`bar ${isOpen ? 'rotate-45' : ''}`}></span>
          <span className={`bar ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`bar ${isOpen ? '-rotate-45' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        <div className="mobile-links">
          <button onClick={() => scrollToSection('home')} className={`mobile-link ${activeSection === 'home' ? 'active' : ''}`}>Home</button>
          <button onClick={() => scrollToSection('about')} className={`mobile-link ${activeSection === 'about' ? 'active' : ''}`}>About Us</button>
          <button onClick={() => scrollToSection('students')} className={`mobile-link ${activeSection === 'students' ? 'active' : ''}`}>Students</button>
          <button onClick={() => scrollToSection('tournaments')} className={`mobile-link ${activeSection === 'tournaments' ? 'active' : ''}`}>Tournaments</button>
          <button onClick={() => scrollToSection('timetable')} className={`mobile-link ${activeSection === 'timetable' ? 'active' : ''}`}>Timetable</button>
          <button onClick={() => scrollToSection('coaches')} className={`mobile-link ${activeSection === 'coaches' ? 'active' : ''}`}>Coaches</button>
          <button onClick={() => scrollToSection('contact')} className={`mobile-link ${activeSection === 'contact' ? 'active' : ''}`}>Contact Us</button>
        </div>
        
        <div className="mobile-divider"></div>
        
        <div className="mobile-bottom-actions">
          <div className="mobile-theme-wrapper">
            <span>Theme: </span>
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
          {renderPortalButtons(true)}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;