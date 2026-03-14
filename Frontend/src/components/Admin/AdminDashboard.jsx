import React, { useState, useEffect } from 'react';
import { getCollection } from '../../services/api';
import CoachManager from './CoachManager';
import TournamentManager from './TournamentManager';
import AchievementManager from './AchievementManager';
import TimetableManager from './TimetableManager';
import StudentApprovalManager from './StudentApprovalManager';
import AboutUsManager from './AboutUsManager';
import AttendanceManager from './AttendanceManager';
import FeesManager from './FeesManager';
import StudentReviewManager from './StudentReviewManager';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('students');
  
  // State for all manageable entities
  const [coaches, setCoaches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [aboutFeatures, setAboutFeatures] = useState([]);
  
  // Dynamic API loading
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [c, t, a, time, ab] = await Promise.all([
          getCollection('coaches'),
          getCollection('tournaments'),
          getCollection('achievements'),
          getCollection('timetable'),
          getCollection('about')
        ]);
        setCoaches(c || []);
        setTournaments(t || []);
        setAchievements(a || []);
        setTimetable(time || []);
        setAboutFeatures(ab || []);
        
        // pending students might be a subset of a generic students endpoint or its own endpoint
        // Assuming a specific endpoint or derived from all students where status != approved
        const allStudents = await getCollection('students');
        setPendingStudents(Array.isArray(allStudents) ? allStudents.filter(s => s.status === 'Pending') : []);
        
      } catch (error) {
        console.error("Failed to load admin data", error);
      }
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
      case 'about':
        return <AboutUsManager features={aboutFeatures} setFeatures={setAboutFeatures} />;
      case 'attendance':
        return <AttendanceManager />;
      case 'fees':
        return <FeesManager />;
      case 'reviews':
        return <StudentReviewManager />;
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
            className={`nav-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <span className="nav-icon">👑</span>
            Why Choose Us
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
            Student Reviews
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
        </header>
        <div className="content-body">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
