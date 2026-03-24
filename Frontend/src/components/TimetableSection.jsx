import React, { useState, useEffect } from 'react';
import { getCollection } from '../services/api';
import './TimetableSection.css';

const TimetableSection = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const data = await getCollection('timetable');
        if (Array.isArray(data)) {
          setTimetable(data);
        }
      } catch (err) {
        console.error("Failed to fetch timetable", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  if (loading) {
    return (
      <section className="timetable-section" id="timetable">
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loading-spinner">Loading Schedule...</div>
        </div>
      </section>
    );
  }

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const groupedTimetable = timetable.reduce((acc, session) => {
    const day = session.day || 'Other';
    if (!acc[day]) acc[day] = [];
    acc[day].push(session);
    return acc;
  }, {});

  const sortedDays = Object.keys(groupedTimetable).sort((a, b) => {
    return dayOrder.indexOf(a) - dayOrder.indexOf(b);
  });

  return (
    <section className="timetable-section" id="timetable">
      <div className="container">
        <div className="section-header">
          <div className="header-decoration">
            <div className="clock-icon">📅</div>
            <h2 className="section-title">Academy Schedule</h2>
            <div className="clock-icon">📅</div>
          </div>
          <p className="section-subtitle">Weekly training schedule categorized by day and level</p>
        </div>

        <div className="timetable-grouped-container">
          {sortedDays.length > 0 ? (
            sortedDays.map((day) => (
              <div key={day} className="day-group">
                <h3 className="day-header">{day}</h3>
                <div className="timetable-grid">
                  {groupedTimetable[day].map((session) => (
                    <div key={session.id || session._id} className="schedule-card">
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
                  ))}
                </div>
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
