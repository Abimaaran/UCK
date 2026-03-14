// src/components/TimetableSection.jsx
import React from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { initialTimetable } from '../data/mockData';
import './TimetableSection.css';

const TimetableSection = () => {
  const [timetable] = useLocalStorage('uck_timetable', initialTimetable);

  // Group timetable entries by day if needed, or just list them
  // For simplicity and a clean look, we'll show them as cards
  
  return (
    <section className="timetable-section" id="timetable">
      <div className="container">
        <div className="section-header">
          <div className="header-decoration">
            <div className="clock-icon">📅</div>
            <h2 className="section-title">Academy Schedule</h2>
            <div className="clock-icon">📅</div>
          </div>
          <p className="section-subtitle">Weekly training schedule and session timings</p>
        </div>

        <div className="timetable-grid">
          {timetable.length > 0 ? (
            timetable.map((session) => (
              <div key={session.id} className="schedule-card">
                <div className="day-badge">{session.day}</div>
                <div className="card-inner">
                  <div className="session-time">
                    <span className="icon">⏰</span>
                    {session.time}
                  </div>
                  <div className="session-level">
                    <span className="icon">🎯</span>
                    {session.level}
                  </div>
                  <div className="session-coach">
                    <span className="icon">👤</span>
                    {session.coach}
                  </div>
                </div>
                <div className="card-decoration"></div>
              </div>
            ))
          ) : (
            <div className="empty-timetable">
              <p>No schedule available at the moment.</p>
            </div>
          )}
        </div>

        <div className="timetable-note">
          <p>* All timings are in local time. Schedule subject to change during tournaments.</p>
        </div>
      </div>
    </section>
  );
};

export default TimetableSection;
