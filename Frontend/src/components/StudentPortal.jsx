import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentPortal.css';

const APPROVED_KEY = 'chess_academy_approved_students';

const StudentPortal = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isStudentLoggedIn') === 'true';
    const studentId = localStorage.getItem('loggedInStudentId');

    if (!isLoggedIn || !studentId) {
      navigate('/#login');
      return;
    }

    const approved = JSON.parse(localStorage.getItem(APPROVED_KEY) || '[]');
    const found = approved.find(s => String(s.studentId) === studentId);
    if (!found) {
      navigate('/#login');
      return;
    }
    setStudent(found);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isStudentLoggedIn');
    localStorage.removeItem('loggedInStudentId');
    navigate('/');
  };

  const [attendance] = useState(() => JSON.parse(localStorage.getItem('uck_attendance') || '{}'));
  const [fees] = useState(() => JSON.parse(localStorage.getItem('uck_fees') || '{}'));
  const [reviews] = useState(() => JSON.parse(localStorage.getItem('uck_reviews') || '{}'));
  const [viewMonth, setViewMonth] = useState(new Date().toISOString().slice(0, 7));

  if (!student) return null;

  const calculateAttendance = () => {
    const records = attendance[student.studentId] || {};
    const dates = Object.keys(records).filter(d => d.startsWith(viewMonth));
    const total = dates.length;
    const present = dates.filter(d => records[d] === 'Present').length;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
    return { total, present, percentage, history: dates.sort().reverse().map(d => ({ date: d, status: records[d] })) };
  };

  const attendanceStats = calculateAttendance();
  const feeStatus = fees[student.studentId]?.[viewMonth] || 'Not Paid';
  const personalReview = reviews[student.studentId];

  const initials = student.name
    .split(' ')
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
            <h1>Welcome back, {student.name.split(' ')[0]}! ♟️</h1>
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
            <div className="info-card-value">{student.level}</div>
          </div>
          <div className="portal-info-card">
            <div className="info-card-icon">📅</div>
            <div className="info-card-label">Date of Birth</div>
            <div className="info-card-value">{student.dob}</div>
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
            <div className="info-card-value">{student.approvedDate}</div>
          </div>
        </div>

        {/* Notice */}
        <div className="portal-notice">
          <span className="notice-icon">💡</span>
          <div>
            <strong>Your Portal Credentials</strong>
            <p>Username: <code>#{student.studentId}</code> &nbsp;|&nbsp; Password: <code>{student.dob}</code> (your date of birth)</p>
            <small>Keep these safe. Contact admin to reset your password.</small>
          </div>
        </div>

        {/* Detailed History */}
        {attendanceStats.history.length > 0 && (
          <div className="portal-section" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-gold)' }}>Attendance Log ({viewMonth})</h3>
            <div className="history-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {attendanceStats.history.map(record => (
                <div key={record.date} style={{ 
                  padding: '1rem', 
                  background: 'var(--card-bg)', 
                  borderRadius: '10px', 
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: '500' }}>{record.date}</span>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem',
                    background: record.status === 'Present' ? 'rgba(32, 201, 151, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                    color: record.status === 'Present' ? '#20C997' : '#FF6B6B'
                  }}>{record.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentPortal;
