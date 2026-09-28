import React, { useState, useEffect, useRef } from 'react';
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

/* ── PROFESSIONAL SVG ICONS FOR NAVIGATION ───────────────────── */
const StudentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

const CoachIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const TournamentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
);

const AchievementIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7"/>
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
  </svg>
);

const TimetableIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const AttendanceIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    <polyline points="9 14 11 16 15 12"/>
  </svg>
);

const FeesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);

const ReviewIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const FeedbackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const WebDemoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

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

  // Theme Mode: Dark or Light
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('adminThemeMode') || 'dark';
  });

  const toggleThemeMode = () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
    localStorage.setItem('adminThemeMode', nextMode);
  };

  // Live Navigation Command Palette / Search Modal
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // System Entities for Universal Deep Search
  const [coaches, setCoaches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  // Dynamic API loading
  useEffect(() => {
    const loadAll = async () => {
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
        (async () => {
          try {
            const all = await getCollection('students');
            const list = Array.isArray(all) ? all : [];
            setAllStudents(list);
            setPendingStudents(list.filter(s => s.status === 'Pending'));
          } catch (err) {
            console.warn('Failed to load students:', err.message);
            setAllStudents([]);
            setPendingStudents([]);
          }
        })()
      ]);
    };
    loadAll();
  }, [tabRefreshKey]);

  // Keyboard shortcut (⌘K or Ctrl+K / Esc) handler for Command Palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchFocused(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navSections = [
    { key: 'students', label: 'Student Approval', desc: 'Manage pending registration applications & student profiles', icon: <StudentIcon />, category: 'Pages & Tools' },
    { key: 'coaches', label: 'Coaches', desc: 'Add & manage certified chess instructors', icon: <CoachIcon />, category: 'Pages & Tools' },
    { key: 'tournaments', label: 'Tournaments', desc: 'Schedule and manage academy tournaments', icon: <TournamentIcon />, category: 'Pages & Tools' },
    { key: 'achievements', label: 'Achievements', desc: 'Publish student awards and trophies', icon: <AchievementIcon />, category: 'Pages & Tools' },
    { key: 'timetable', label: 'Timetable', desc: 'Configure weekly training schedules', icon: <TimetableIcon />, category: 'Pages & Tools' },
    { key: 'attendance', label: 'Attendance', desc: 'Track daily class attendance records', icon: <AttendanceIcon />, category: 'Pages & Tools' },
    { key: 'fees', label: 'Fees System', desc: 'Manage tuition payments, receipts & WhatsApp reminders', icon: <FeesIcon />, category: 'Pages & Tools' },
    { key: 'reviews', label: 'Student Reviews', desc: 'Review & moderate student testimonials', icon: <ReviewIcon />, category: 'Pages & Tools' },
    { key: 'user-feedbacks', label: 'User Feedbacks', desc: 'Read contact form messages & inquiries', icon: <FeedbackIcon />, category: 'Pages & Tools' },
    { key: 'web-demo', label: 'Web Demo', desc: 'Open main website public view', icon: <WebDemoIcon />, category: 'Pages & Tools' },
    { key: 'settings', label: 'Settings', desc: 'Change admin security password & preferences', icon: <SettingsIcon />, category: 'Pages & Tools' },
  ];

  /* ── UNIVERSAL DEEP SYSTEM SEARCH (Like Android / iOS System Search) ── */
  const searchLower = searchQuery.toLowerCase().trim();
  const [searchTargetItem, setSearchTargetItem] = useState(null);

  // 1. Pages & Features
  const matchedPages = navSections.filter(sec => 
    sec.label.toLowerCase().includes(searchLower) ||
    sec.desc.toLowerCase().includes(searchLower)
  );

  // 2. Real Student Database Matches
  const matchedStudents = searchLower ? allStudents.filter(s => 
    (s.fullName || s.name || '').toLowerCase().includes(searchLower) ||
    (s.studentId || '').toLowerCase().includes(searchLower) ||
    (s.phone || '').includes(searchLower) ||
    (s.parentName || '').toLowerCase().includes(searchLower)
  ).slice(0, 5).map(s => ({
    key: 'students',
    label: `${s.fullName || s.name || 'Student'} (${s.studentId || 'ID'})`,
    desc: `Status: ${s.status || 'Active'} • Phone: ${s.phone || 'N/A'} • Skill: ${s.chessSkillLevel || 'Standard'}`,
    icon: <StudentIcon />,
    category: 'Student Data',
    targetData: s
  })) : [];

  // 3. Real Coaches Matches
  const matchedCoaches = searchLower ? coaches.filter(c => 
    (c.name || '').toLowerCase().includes(searchLower) ||
    (c.specialization || c.role || '').toLowerCase().includes(searchLower)
  ).slice(0, 4).map(c => ({
    key: 'coaches',
    label: `Coach ${c.name}`,
    desc: `Role: ${c.specialization || c.role || 'Instructor'} • FIDE Rating: ${c.rating || 'N/A'}`,
    icon: <CoachIcon />,
    category: 'Coaches Data',
    targetData: c
  })) : [];

  // 4. Real Tournaments Matches
  const matchedTournaments = searchLower ? tournaments.filter(t => 
    (t.title || t.name || '').toLowerCase().includes(searchLower) ||
    (t.location || t.venue || '').toLowerCase().includes(searchLower)
  ).slice(0, 4).map(t => ({
    key: 'tournaments',
    label: `Tournament: ${t.title || t.name}`,
    desc: `Location: ${t.location || t.venue || 'Academy'} • Date: ${t.date || 'Upcoming'}`,
    icon: <TournamentIcon />,
    category: 'Tournaments Data',
    targetData: t
  })) : [];

  // Combined Results List
  const allSearchResults = [
    ...matchedPages,
    ...matchedStudents,
    ...matchedCoaches,
    ...matchedTournaments
  ];

  const handleSearchResultClick = (sec) => {
    setSearchTargetItem(sec.targetData || null);
    handleTabChange(sec.key);
  };

  const handleTabChange = (tabKey) => {
    if (tabKey === 'web-demo') {
      window.location.href = '/';
      return;
    }
    setActiveTab(tabKey);
    localStorage.setItem('adminActiveTab', tabKey);
    setIsSidebarOpen(false); // Mobile drawer close
    setIsHovered(false);     // Instantly collapse desktop hover sidebar on click!
    setIsSearchFocused(false);
    setSearchQuery('');
    if (document.activeElement) {
      document.activeElement.blur();
    }
  };

  const handleRefreshCurrentTab = () => {
    setTabRefreshKey(prev => prev + 1);
  };

  // Lock body scroll when sidebar drawer or search palette is open
  useEffect(() => {
    if (isSidebarOpen || isSearchFocused) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen, isSearchFocused]);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminActiveTab');
    window.dispatchEvent(new Event('adminLogin'));
    window.location.href = '/';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'coaches':
        return <CoachManager key={tabRefreshKey} coaches={coaches} setCoaches={setCoaches} targetItem={searchTargetItem} />;
      case 'tournaments':
        return <TournamentManager key={tabRefreshKey} tournaments={tournaments} setTournaments={setTournaments} targetItem={searchTargetItem} />;
      case 'achievements':
        return <AchievementManager key={tabRefreshKey} achievements={achievements} setAchievements={setAchievements} targetItem={searchTargetItem} />;
      case 'timetable':
        return <TimetableManager key={tabRefreshKey} timetable={timetable} setTimetable={setTimetable} targetItem={searchTargetItem} />;
      case 'attendance':
        return <AttendanceManager key={tabRefreshKey} targetItem={searchTargetItem} />;
      case 'fees':
        return <FeesManager key={tabRefreshKey} targetItem={searchTargetItem} />;
      case 'reviews':
        return <StudentReviewManager key={tabRefreshKey} targetItem={searchTargetItem} />;
      case 'user-feedbacks':
        return <UserReviewManager key={tabRefreshKey} targetItem={searchTargetItem} />;
      case 'settings':
        return <AdminSettings key={tabRefreshKey} targetItem={searchTargetItem} />;
      case 'students':
      default:
        return <StudentApprovalManager key={tabRefreshKey} students={pendingStudents} setStudents={setPendingStudents} targetItem={searchTargetItem} />;
    }
  };

  return (
    <div className={`admin-dashboard theme-${themeMode} ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar Backdrop Overlay on Mobile */}
      {isSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Global Universal System Command Search Modal Overlay (100% Top Stacking) */}
      {isSearchFocused && (
        <div className="global-command-palette-backdrop" onClick={() => setIsSearchFocused(false)}>
          <div className="global-command-palette-card" onClick={e => e.stopPropagation()}>
            <div className="command-palette-search-box">
              <span className="search-icon"><SearchIcon /></span>
              <input 
                type="text" 
                placeholder="Search students, coaches, tournaments, fees, or features..." 
                className="command-palette-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <span className="esc-badge" onClick={() => setIsSearchFocused(false)}>ESC</span>
            </div>

            <div className="palette-header">SYSTEM UNIVERSAL SEARCH</div>

            <div className="palette-list">
              {allSearchResults.length > 0 ? (
                allSearchResults.map((sec, idx) => (
                  <div 
                    key={`${sec.key}-${idx}`} 
                    className="palette-item"
                    onClick={() => handleSearchResultClick(sec)}
                  >
                    <span className="palette-item-icon">{sec.icon}</span>
                    <div className="palette-item-text">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="palette-item-title">{sec.label}</span>
                        {sec.category && <span className="palette-category-tag">{sec.category}</span>}
                      </div>
                      <span className="palette-item-desc">{sec.desc}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="palette-no-results">No matching data or section found</div>
              )}
            </div>
          </div>
        </div>
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
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => handleTabChange('students')}
            title="Student Approval"
          >
            <span className="nav-icon"><StudentIcon /></span>
            <span className="nav-label">Student Approval</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'coaches' ? 'active' : ''}`}
            onClick={() => handleTabChange('coaches')}
            title="Coaches"
          >
            <span className="nav-icon"><CoachIcon /></span>
            <span className="nav-label">Coaches</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'tournaments' ? 'active' : ''}`}
            onClick={() => handleTabChange('tournaments')}
            title="Tournaments"
          >
            <span className="nav-icon"><TournamentIcon /></span>
            <span className="nav-label">Tournaments</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => handleTabChange('achievements')}
            title="Achievements"
          >
            <span className="nav-icon"><AchievementIcon /></span>
            <span className="nav-label">Achievements</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'timetable' ? 'active' : ''}`}
            onClick={() => handleTabChange('timetable')}
            title="Timetable"
          >
            <span className="nav-icon"><TimetableIcon /></span>
            <span className="nav-label">Timetable</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => handleTabChange('attendance')}
            title="Attendance"
          >
            <span className="nav-icon"><AttendanceIcon /></span>
            <span className="nav-label">Attendance</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'fees' ? 'active' : ''}`}
            onClick={() => handleTabChange('fees')}
            title="Fees System"
          >
            <span className="nav-icon"><FeesIcon /></span>
            <span className="nav-label">Fees System</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => handleTabChange('reviews')}
            title="Reviews Management"
          >
            <span className="nav-icon"><ReviewIcon /></span>
            <span className="nav-label">Reviews</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'user-feedbacks' ? 'active' : ''}`}
            onClick={() => handleTabChange('user-feedbacks')}
            title="User Feedbacks"
          >
            <span className="nav-icon"><FeedbackIcon /></span>
            <span className="nav-label">User Feedbacks</span>
          </button>

          {/* Web Demo right after User Feedbacks as requested */}
          <button
            className="nav-item"
            onClick={() => handleTabChange('web-demo')}
            title="Live Website Demo"
          >
            <span className="nav-icon"><WebDemoIcon /></span>
            <span className="nav-label">Web Demo</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('settings')}
            title="Settings"
          >
            <span className="nav-icon"><SettingsIcon /></span>
            <span className="nav-label">Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout} title="Exit Admin">
            <span className="nav-icon"><LogoutIcon /></span>
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
              <span className="header-breadcrumb">Admin / Control Panel</span>
              <h1>
                {activeTab === 'students' && 'Student Approval'}
                {activeTab === 'coaches' && 'Coach Management'}
                {activeTab === 'tournaments' && 'Tournament Management'}
                {activeTab === 'achievements' && 'Achievement Management'}
                {activeTab === 'timetable' && 'Timetable Schedule'}
                {activeTab === 'attendance' && 'Attendance Tracking'}
                {activeTab === 'fees' && 'Fees & WhatsApp System'}
                {activeTab === 'reviews' && 'Student Reviews'}
                {activeTab === 'user-feedbacks' && 'User Feedback & Inquiry'}
                {activeTab === 'settings' && 'Admin Settings'}
              </h1>
            </div>
          </div>
          
          <div className="header-right">
            {/* Universal System Search Input */}
            <div className="header-search-wrapper" onClick={() => setIsSearchFocused(true)}>
              <span className="search-icon"><SearchIcon /></span>
              <input 
                type="text" 
                placeholder="Universal System Search..." 
                className="header-search-input"
                readOnly
              />
              <kbd className="search-shortcut">⌘K</kbd>
            </div>

            {/* Quick Theme Toggle Button in Header */}
            <button 
              onClick={toggleThemeMode} 
              className="header-theme-btn"
              title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {themeMode === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            <button 
              onClick={handleRefreshCurrentTab} 
              className="header-refresh-btn"
              title="Refresh data for this section without reloading page"
            >
              <span className="refresh-spin"><RefreshIcon /></span>
              <span className="btn-text">Refresh</span>
            </button>
            
            <button className="header-logout-btn" onClick={handleLogout} title="Logout">
              <span className="nav-icon"><LogoutIcon /></span>
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
