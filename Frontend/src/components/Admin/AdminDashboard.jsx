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
      case 'students':
      default:
        return <StudentApprovalManager students={pendingStudents} setStudents={setPendingStudents} />;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">♔</span>
          <h2>Admin Panel</h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <span className="nav-icon">👥</span>
            Student Management
          </button>
          <button
            className={`nav-item ${activeTab === 'coaches' ? 'active' : ''}`}
            onClick={() => setActiveTab('coaches')}
          >
            <span className="nav-icon">👤</span>
            Coaches
          </button>
          <button
            className={`nav-item ${activeTab === 'tournaments' ? 'active' : ''}`}
            onClick={() => setActiveTab('tournaments')}
          >
            <span className="nav-icon">🏆</span>
            Tournaments
          </button>
          <button
            className={`nav-item ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            <span className="nav-icon">🎖️</span>
            Achievements
          </button>
          <button
            className={`nav-item ${activeTab === 'timetable' ? 'active' : ''}`}
            onClick={() => setActiveTab('timetable')}
          >
            <span className="nav-icon">📅</span>
            Timetable
          </button>
          <button
            className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <span className="nav-icon">📅</span>
            Attendance
          </button>
          <button
            className={`nav-item ${activeTab === 'fees' ? 'active' : ''}`}
            onClick={() => setActiveTab('fees')}
          >
            <span className="nav-icon">💰</span>
            Fees System
          </button>
          <button
            className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <span className="nav-icon">📝</span>
            Reviews Management
          </button>
          <button
            className={`nav-item ${activeTab === 'user-feedbacks' ? 'active' : ''}`}
            onClick={() => setActiveTab('user-feedbacks')}
          >
            <span className="nav-icon">💬</span>
            User Feedbacks
          </button>
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
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
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h1>
          <button className="header-logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </header>
        <div className="content-body">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
