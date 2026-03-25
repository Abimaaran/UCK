import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentProfile, getStudentAttendance, getStudentFees, getStudentReviews } from '../services/api';
import './StudentPortal.css';

const APPROVED_KEY = 'chess_academy_approved_students';

const StudentPortal = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);

  const [attendance, setAttendance] = useState({});
  const [fees, setFees] = useState({});
  const [reviews, setReviews] = useState({});
  const [viewMonth, setViewMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isStudentLoggedIn') === 'true';
    const studentId = localStorage.getItem('loggedInStudentId');

    if (!isLoggedIn || !studentId) {
      navigate('/#login');
      return;
    }

    const fetchPortalData = async () => {
      try {
        const profile = await getStudentProfile(studentId);
        setStudent(profile);

        // Fetch dependent data separately with individual error handling to prevent portal crash
        const fetchDependentData = async (fetcher, setter, label) => {
          try {
            const data = await fetcher(studentId);
            setter(data || []);
          } catch (err) {
            console.warn(`Failed to fetch ${label}:`, err.message);
            setter([]); // Fallback to empty
          }
        };

        await Promise.all([
          fetchDependentData(getStudentAttendance, setAttendance, 'attendance'),
          fetchDependentData(getStudentFees, setFees, 'fees'),
          fetchDependentData(getStudentReviews, setReviews, 'reviews')
        ]);

      } catch (error) {
        console.error("Failed to fetch student profile:", error);
        if (error.response?.status === 404) {
             navigate('/#login');
        }
      }
    };

    fetchPortalData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isStudentLoggedIn');
    localStorage.removeItem('loggedInStudentId');
    navigate('/');
  };

  if (!student) return null;

  const calculateAttendance = () => {
    // Adapter for array-based attendance from API
    // backend format [{date: '2023-10-01', status: 'Present'}, ...]
    const monthRecords = Array.isArray(attendance) 
        ? attendance.filter(r => r.date?.startsWith(viewMonth))
        : [];
        
    const total = monthRecords.length;
    const present = monthRecords.filter(r => r.status === 'Present').length;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
    return { total, present, percentage, history: monthRecords };
  };

  const attendanceStats = calculateAttendance();
  
  // Adapter for array-based fees from API
  const feeRecord = Array.isArray(fees) 
    ? fees.find(f => f.month === viewMonth) 
    : null;
  const feeStatus = feeRecord ? 'Paid' : 'Not Paid';
  
  // Adapter for review array
  const personalReview = Array.isArray(reviews) && reviews.length > 0 
    ? reviews[reviews.length - 1] 
    : null;

  const displayName = student.studentName || student.name || 'Student';
  const initials = displayName
    .split(' ')
    .filter(n => n.length > 0)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="student-portal">
      {/* Top bar */}
      <header className="portal-header">
        <div className="portal-brand">
          <span className="portal-crown">♔</span>
          <span>Uncrowned Kings Chess Academy</span>
        </div>
        <button className="portal-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="portal-main">
        {/* Welcome card */}
        <div className="portal-welcome-card">
          <div className="portal-avatar">{initials}</div>
          <div className="portal-welcome-text">
            <h1>Welcome back, {displayName}! ♟️</h1>
            <p>Your chess journey continues at Uncrowned Kings.</p>
          </div>
        </div>

        {/* Dashboard Controls */}
        <div className="portal-controls" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ fontWeight: '600' }}>Select Month to View Stats:</label>
          <input 
            type="month" 
            value={viewMonth} 
            onChange={(e) => setViewMonth(e.target.value)}
            style={{ 
              padding: '8px 15px', 
              borderRadius: '8px', 
              background: 'var(--card-bg)', 
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)'
            }}
          />
        </div>

        {/* Tracking Highlights */}
        <div className="portal-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="portal-info-card highlighted">
            <div className="info-card-icon">📈</div>
            <div className="info-card-label">Attendance ({viewMonth})</div>
            <div className="info-card-value">{attendanceStats.percentage}%</div>
            <div className="stats-progress-bar" style={{ height: '6px', background: '#333', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${attendanceStats.percentage}%`, height: '100%', background: 'var(--accent-gold)' }}></div>
            </div>
            <small style={{ color: '#888', marginTop: '5px', display: 'block' }}>{attendanceStats.present} out of {attendanceStats.total} sessions</small>
          </div>

          <div className="portal-info-card highlighted">
            <div className="info-card-icon">💰</div>
            <div className="info-card-label">Fee Status ({viewMonth})</div>
            <div className={`info-card-value ${feeStatus === 'Paid' ? 'text-success' : 'text-danger'}`} style={{ color: feeStatus === 'Paid' ? '#20C997' : '#FF6B6B' }}>
              {feeStatus}
            </div>
            <small style={{ color: '#888', marginTop: '5px', display: 'block' }}>
              {feeStatus === 'Paid' ? 'Payment verified by admin' : 'Pending payment for this month'}
            </small>
          </div>

          <div className="portal-info-card highlighted" style={{ cursor: 'pointer', border: '1px solid var(--accent-gold)' }} onClick={() => navigate('/analyze-game')}>
            <div className="info-card-icon">♟️</div>
            <div className="info-card-label">Analyze Game</div>
            <div className="info-card-value" style={{ color: 'var(--accent-gold)' }}>Launch Board</div>
            <small style={{ color: '#888', marginTop: '5px', display: 'block' }}>
              Review your matches with Stockfish analysis and board editor
            </small>
            <button className="portal-action-btn" style={{ 
              marginTop: '15px', 
              width: '100%', 
              padding: '8px', 
              background: 'var(--accent-gold)', 
              color: '#000', 
              border: 'none', 
              borderRadius: '6px',
              fontWeight: '700',
              cursor: 'pointer'
            }}>
              Open Analyzer
            </button>
          </div>
        </div>

        {/* Feedback Section */}
        {personalReview && (
          <div className="portal-notice review-notice" style={{ marginBottom: '2rem', borderLeftColor: 'var(--accent-gold)' }}>
            <span className="notice-icon">📝</span>
            <div>
              <strong>Latest Performance Feedback ({personalReview.date})</strong>
              <p style={{ marginTop: '0.5rem', fontStyle: 'italic', lineHeight: '1.6' }}>"{personalReview.text}"</p>
            </div>
          </div>
        )}

        {/* Info grid */}
        <div className="portal-info-grid">
          <div className="portal-info-card">
            <div className="info-card-icon">🪪</div>
            <div className="info-card-label">Student ID</div>
            <div className="info-card-value">#{student.studentId}</div>
          </div>
          <div className="portal-info-card">
            <div className="info-card-icon">♟️</div>
            <div className="info-card-label">Level</div>
            <div className="info-card-value">{student.chessExperience || student.level || 'N/A'}</div>
          </div>
          <div className="portal-info-card">
            <div className="info-card-icon">📅</div>
            <div className="info-card-label">Date of Birth</div>
            <div className="info-card-value">{student.dateOfBirth || student.dob || 'N/A'}</div>
          </div>
          <div className="portal-info-card">
            <div className="info-card-icon">✅</div>
            <div className="info-card-label">Status</div>
            <div className="info-card-value approved-badge">{student.status}</div>
          </div>
          <div className="portal-info-card">
            <div className="info-card-icon">📧</div>
            <div className="info-card-label">Email</div>
            <div className="info-card-value" style={{ fontSize: '0.9rem' }}>{student.email}</div>
          </div>
          <div className="portal-info-card">
            <div className="info-card-icon">🏛️</div>
            <div className="info-card-label">Approved On</div>
            <div className="info-card-value">{student.approvedDate || (student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A')}</div>
          </div>
        </div>



        {/* Detailed History */}
        <div className="portal-section" style={{ marginTop: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--accent-gold)', fontSize: '1.5rem' }}>Daily Attendance Log</h3>
            <span style={{ fontSize: '0.9rem', color: '#888' }}>Month: {new Date(viewMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          </div>
          
          {attendanceStats.history.length > 0 ? (
            <div className="history-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {attendanceStats.history.sort((a,b) => new Date(b.date) - new Date(a.date)).map(record => (
                <div key={record.date} style={{ 
                  padding: '1.25rem', 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1.05rem', color: '#fff' }}>
                      {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                    <small style={{ color: '#666' }}>{record.date}</small>
                  </div>
                  <span style={{ 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: record.status === 'Present' ? 'rgba(32, 201, 151, 0.15)' : 'rgba(255, 107, 107, 0.15)',
                    color: record.status === 'Present' ? '#20C997' : '#FF6B6B',
                    border: `1px solid ${record.status === 'Present' ? 'rgba(32, 201, 151, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`
                  }}>{record.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              padding: '3rem', 
              textAlign: 'center', 
              background: 'rgba(255, 255, 255, 0.02)', 
              borderRadius: '15px', 
              border: '1px dashed var(--border-color)',
              color: '#666'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📅</div>
              <p>No attendance records found for this month.</p>
              <small>Records will appear here once your coach marks your attendance.</small>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentPortal;
