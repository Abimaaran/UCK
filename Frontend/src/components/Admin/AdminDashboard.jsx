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

  const [activeTab, setActiveTab] = useState('students');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    window.dispatchEvent(new Event('adminLogin')); // Notify other components
    window.location.href = '/';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'coaches':
        return <CoachManager coaches={coaches} setCoaches={setCoaches} />;
      case 'tournaments':
        return <TournamentManager tournaments={tournaments} setTournaments={setTournaments} />;
      case 'achievements':
        return <AchievementManager achievements={achievements} setAchievements={setAchievements} />;
      case 'timetable':
        return <TimetableManager timetable={timetable} setTimetable={setTimetable} />;
      case 'attendance':
        return <AttendanceManager />;
      case 'fees':
        return <FeesManager />;
      case 'reviews':
        return <StudentReviewManager />;
      case 'user-feedbacks':
        return <UserReviewManager />;
      case 'settings':
        return <AdminSettings />;
      case 'web-demo':
        return <WebDemoView />;
      case 'students':
      default:
        return <StudentApprovalManager students={pendingStudents} setStudents={setPendingStudents} />;
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
            className={`nav-item ${activeTab === 'web-demo' ? 'active' : ''}`}
            onClick={() => { setActiveTab('web-demo'); setIsSidebarOpen(false); }}
          >
            <span className="nav-icon">🌐</span>
            Web Demo
          </button>
          <button
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }}
          >
            <span className="nav-icon">👥</span>
            Student Management
          </button>
          <button
            className={`nav-item ${activeTab === 'coaches' ? 'active' : ''}`}
            onClick={() => { setActiveTab('coaches'); setIsSidebarOpen(false); }}
          >
            <span className="nav-icon">👤</span>
            Coaches
          </button>
          <button
            className={`nav-item ${activeTab === 'tournaments' ? 'active' : ''}`}
            onClick={() => { setActiveTab('tournaments'); setIsSidebarOpen(false); }}
          >
            <span className="nav-icon">🏆</span>
            Tournaments
          </button>
          <button
            className={`nav-item ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => { setActiveTab('achievements'); setIsSidebarOpen(false); }}
          >
            <span className="nav-icon">🎖️</span>
            Achievements
          </button>
          <button
            className={`nav-item ${activeTab === 'timetable' ? 'active' : ''}`}
            onClick={() => { setActiveTab('timetable'); setIsSidebarOpen(false); }}
          >
            <span className="nav-icon">📅</span>
            Timetable
          </button>
          <button
            className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }}
          >
            <span className="nav-icon">📅</span>
            Attendance
          </button>
          <button
            className={`nav-item ${activeTab === 'fees' ? 'active' : ''}`}
            onClick={() => { setActiveTab('fees'); setIsSidebarOpen(false); }}
          >
            <span className="nav-icon">💰</span>
            Fees System
          </button>
          <button
            className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => { setActiveTab('reviews'); setIsSidebarOpen(false); }}
          >
            <span className="nav-icon">📝</span>
            Reviews Management
          </button>
          <button
            className={`nav-item ${activeTab === 'user-feedbacks' ? 'active' : ''}`}
            onClick={() => { setActiveTab('user-feedbacks'); setIsSidebarOpen(false); }}
          >
            <span className="nav-icon">💬</span>
            User Feedbacks
          </button>

          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
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
          <button className="header-logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span className="logout-label-desktop">Logout</span>
          </button>
        </header>
        <div className="content-body">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const WebDemoView = () => {
  return (
    <div style={{ 
      width: '100%', 
      height: 'calc(100vh - 180px)', 
      background: 'rgba(0,0,0,0.2)', 
      borderRadius: '12px', 
      border: '1px solid rgba(212,175,55,0.2)', 
      overflow: 'hidden' 
    }}>
      <iframe 
        src={window.location.origin} 
        title="UCK Chess Academy Public Website" 
        style={{ width: '100%', height: '100%', border: 'none', background: '#050505' }}
      />
    </div>
  );
};

export default AdminDashboard;
