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
  const [tabRefreshKey, setTabRefreshKey] = useState(0);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    localStorage.setItem('adminActiveTab', tabKey);
    setIsSidebarOpen(false);
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

      <div className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span className="sidebar-logo">♔</span>
            <h2>Admin Panel</h2>
          </div>
          <button 
            className="sidebar-close-btn" 
            onClick={() => setIsSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav className="sidebar-nav">
          <button
            className="nav-item"
            onClick={() => { window.location.href = '/'; }}
          >
            <span className="nav-icon">🌐</span>
            Web Demo
          </button>
          <button
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => handleTabChange('students')}
          >
            <span className="nav-icon">👥</span>
            Student Management
          </button>
          <button
            className={`nav-item ${activeTab === 'coaches' ? 'active' : ''}`}
            onClick={() => handleTabChange('coaches')}
          >
            <span className="nav-icon">👤</span>
            Coaches
          </button>
          <button
            className={`nav-item ${activeTab === 'tournaments' ? 'active' : ''}`}
            onClick={() => handleTabChange('tournaments')}
          >
            <span className="nav-icon">🏆</span>
            Tournaments
          </button>
          <button
            className={`nav-item ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => handleTabChange('achievements')}
          >
            <span className="nav-icon">🎖️</span>
            Achievements
          </button>
          <button
            className={`nav-item ${activeTab === 'timetable' ? 'active' : ''}`}
            onClick={() => handleTabChange('timetable')}
          >
            <span className="nav-icon">📅</span>
            Timetable
          </button>
          <button
            className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => handleTabChange('attendance')}
          >
            <span className="nav-icon">📅</span>
            Attendance
          </button>
          <button
            className={`nav-item ${activeTab === 'fees' ? 'active' : ''}`}
            onClick={() => handleTabChange('fees')}
          >
            <span className="nav-icon">💰</span>
            Fees System
          </button>
          <button
            className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => handleTabChange('reviews')}
          >
            <span className="nav-icon">📝</span>
            Reviews Management
          </button>
          <button
            className={`nav-item ${activeTab === 'user-feedbacks' ? 'active' : ''}`}
            onClick={() => handleTabChange('user-feedbacks')}
          >
            <span className="nav-icon">💬</span>
            User Feedbacks
          </button>

          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('settings')}
          >
            <span className="nav-icon">⚙️</span>
            Settings
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            Exit Admin
          </button>
        </div>
      </div>
      <main className="admin-content">
        <header className="content-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <button 
              className="hamburger-menu-btn" 
              onClick={() => setIsSidebarOpen(true)}
            >
              ☰
            </button>
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              onClick={handleRefreshCurrentTab} 
              style={{
                background: 'rgba(212,175,55,0.12)',
                border: '1px solid rgba(212,175,55,0.35)',
                color: '#d4af37',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,175,55,0.12)'}
              title="Refresh data for this section without reloading page"
            >
              <span>🔄</span> Refresh Section
            </button>
            
            <button className="header-logout-btn" onClick={handleLogout}>
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
