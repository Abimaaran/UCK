import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCollection } from '../../services/api';
import CoachManager from './CoachManager';
import TournamentManager from './TournamentManager';
import AchievementManager from './AchievementManager';
import TimetableManager from './TimetableManager';
import StudentApprovalManager from './StudentApprovalManager';
import AttendanceManager from './AttendanceManager';
import FeesManager from './FeesManager';
import StudentReviewManager from './StudentReviewManager';
import UserReviewManager from './UserReviewManager';
import AdminSettings from './AdminSettings';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('isAdminLoggedIn') === 'true';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) return null; // Prevent UI flash during redirect

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('adminActiveTab') || 'students';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [tabRefreshKey, setTabRefreshKey] = useState(0);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    localStorage.setItem('adminActiveTab', tabKey);
    setIsSidebarOpen(false); // Mobile drawer close
    setIsHovered(false);     // Instantly collapse desktop hover sidebar on click!
  };

  const handleRefreshCurrentTab = () => {
    setTabRefreshKey(prev => prev + 1);
  };

  // Lock body scroll when sidebar drawer is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  // State for all manageable entities
  const [coaches, setCoaches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);

  // Dynamic API loading
  useEffect(() => {
    const loadAll = async () => {
      // Helper for resilient fetching
      const fetchSection = async (key, setter, endpoint) => {
        try {
          const data = await getCollection(endpoint || key);
          setter(Array.isArray(data) ? data : []);
        } catch (err) {
          console.warn(`Failed to load ${key}:`, err.message);
          setter([]);
        }
      };

      await Promise.all([
        fetchSection('coaches', setCoaches),
        fetchSection('tournaments', setTournaments),
        fetchSection('achievements', setAchievements),
        fetchSection('timetable', setTimetable),
        // Fetch students and filter pending
        (async () => {
          try {
            const all = await getCollection('students');
            const list = Array.isArray(all) ? all : [];
            setPendingStudents(list.filter(s => s.status === 'Pending'));
          } catch (err) {
            console.warn('Failed to load students:', err.message);
            setPendingStudents([]);
          }
        })()
      ]);
    };
    loadAll();
  }, [tabRefreshKey]);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminActiveTab');
    window.dispatchEvent(new Event('adminLogin')); // Notify other components
    window.location.href = '/';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'coaches':
        return <CoachManager key={tabRefreshKey} coaches={coaches} setCoaches={setCoaches} />;
      case 'tournaments':
        return <TournamentManager key={tabRefreshKey} tournaments={tournaments} setTournaments={setTournaments} />;
      case 'achievements':
        return <AchievementManager key={tabRefreshKey} achievements={achievements} setAchievements={setAchievements} />;
      case 'timetable':
        return <TimetableManager key={tabRefreshKey} timetable={timetable} setTimetable={setTimetable} />;
      case 'attendance':
        return <AttendanceManager key={tabRefreshKey} />;
      case 'fees':
        return <FeesManager key={tabRefreshKey} />;
      case 'reviews':
        return <StudentReviewManager key={tabRefreshKey} />;
      case 'user-feedbacks':
        return <UserReviewManager key={tabRefreshKey} />;
      case 'settings':
        return <AdminSettings key={tabRefreshKey} />;
      case 'students':
      default:
        return <StudentApprovalManager key={tabRefreshKey} students={pendingStudents} setStudents={setPendingStudents} />;
    }
  };

  return (
    <div className={`admin-dashboard ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar Backdrop Overlay on Mobile */}
      {isSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div 
        className={`admin-sidebar ${isSidebarOpen ? 'open' : ''} ${isHovered ? 'hover-expanded' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="sidebar-header">
          <div className="brand-wrapper">
            <span className="sidebar-logo">♔</span>
            <div className="brand-text">
              <h2>UCK Admin</h2>
              <span className="brand-badge">SaaS Control</span>
            </div>
          </div>
          <button 
            className="sidebar-close-btn" 
            onClick={() => setIsSidebarOpen(false)}
            title="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className="nav-item"
            onClick={() => { window.location.href = '/'; }}
            title="Web Demo"
          >
            <span className="nav-icon">🌐</span>
            <span className="nav-label">Web Demo</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => handleTabChange('students')}
            title="Student Management"
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">Student Approval</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'coaches' ? 'active' : ''}`}
            onClick={() => handleTabChange('coaches')}
            title="Coaches"
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">Coaches</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'tournaments' ? 'active' : ''}`}
            onClick={() => handleTabChange('tournaments')}
            title="Tournaments"
          >
            <span className="nav-icon">🏆</span>
            <span className="nav-label">Tournaments</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => handleTabChange('achievements')}
            title="Achievements"
          >
            <span className="nav-icon">🎖️</span>
            <span className="nav-label">Achievements</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'timetable' ? 'active' : ''}`}
            onClick={() => handleTabChange('timetable')}
            title="Timetable"
          >
            <span className="nav-icon">📅</span>
            <span className="nav-label">Timetable</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => handleTabChange('attendance')}
            title="Attendance"
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Attendance</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'fees' ? 'active' : ''}`}
            onClick={() => handleTabChange('fees')}
            title="Fees System"
          >
            <span className="nav-icon">💰</span>
            <span className="nav-label">Fees System</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => handleTabChange('reviews')}
            title="Reviews Management"
          >
            <span className="nav-icon">📝</span>
            <span className="nav-label">Reviews</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'user-feedbacks' ? 'active' : ''}`}
            onClick={() => handleTabChange('user-feedbacks')}
            title="User Feedbacks"
          >
            <span className="nav-icon">💬</span>
            <span className="nav-label">User Feedbacks</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('settings')}
            title="Settings"
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout} title="Exit Admin">
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Exit Admin</span>
          </button>
        </div>
      </div>

      <main className="admin-content">
        <header className="content-header">
          <div className="header-left">
            <button 
              className="hamburger-menu-btn" 
              onClick={() => setIsSidebarOpen(true)}
            >
              ☰
            </button>
            <div className="header-title-box">
              <span className="header-breadcrumb">Admin / Overview</span>
              <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h1>
            </div>
          </div>
          
          <div className="header-right">
            <div className="header-search-wrapper">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search data..." className="header-search-input" />
              <kbd className="search-shortcut">⌘F</kbd>
            </div>

            <button 
              onClick={handleRefreshCurrentTab} 
              className="header-refresh-btn"
              title="Refresh data for this section without reloading page"
            >
              <span className="refresh-spin">🔄</span>
              <span className="btn-text">Refresh Section</span>
            </button>
            
            <button className="header-logout-btn" onClick={handleLogout} title="Logout">
              <span className="nav-icon">🚪</span>
              <span className="logout-label-desktop">Logout</span>
            </button>
          </div>
        </header>

        <div className="content-body">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
