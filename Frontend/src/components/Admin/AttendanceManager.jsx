import React, { useState, useEffect } from 'react';
import { getCollection, updateItem, createItem } from '../../services/api';

const AttendanceManager = () => {
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [viewingCalendarStudent, setViewingCalendarStudent] = useState(null);

  const getStudentLevel = (student) => {
    const levelStr = student.level || student.chessExperience || '';
    const lower = levelStr.toLowerCase();
    if (lower.includes('advanced')) return 'Advanced';
    if (lower.includes('intermediate')) return 'Intermediate';
    if (lower.includes('beginner')) return 'Beginner';
    return 'Unassigned';
  };

  const getLevelCount = (level) => {
    if (level === 'All') return approvedStudents.length;
    return approvedStudents.filter(s => getStudentLevel(s) === level).length;
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Students
      try {
        const studentData = await getCollection('students');
        setApprovedStudents(Array.isArray(studentData) ? studentData.filter(s => s.status === 'Approved') : []);
      } catch (err) {
        console.warn("Failed to fetch students:", err.message);
        setApprovedStudents([]);
      }

      // 2. Fetch Attendance
      try {
        const allAttendance = await getCollection('attendance');
        const attendanceMap = {};
        if (Array.isArray(allAttendance)) {
          allAttendance.forEach(record => {
            if (!attendanceMap[record.studentId]) {
              attendanceMap[record.studentId] = {};
            }
            attendanceMap[record.studentId][record.date] = record.status;
          });
        }
        setAttendance(attendanceMap);
      } catch (err) {
        console.warn("Failed to fetch attendance:", err.message);
        setAttendance({});
      }
    };
    fetchData();
  }, []);

  const handleAttendanceChange = async (studentId, status, targetDate = selectedDate) => {
    try {
      // Typically you'd send { studentId, date: targetDate, status } to the backend
      // Here we assume a PUT/POST to `/attendance/${studentId}` with the date and status
      const payload = {
        date: targetDate,
        status: status
      };
      // Note: this depends heavily on how your backend expects attendance data.
      // E.g., a generic update or a specific attendance mark endpoint
      await updateItem('attendance', studentId, payload);

      const newAttendance = { ...attendance };
      if (!newAttendance[studentId]) newAttendance[studentId] = {};
      newAttendance[studentId][targetDate] = status;
      setAttendance(newAttendance);
    } catch (err) {
      console.error("Failed to update attendance", err);
      alert("Could not update attendance.");
    }
  };

  const calculateStats = (studentId) => {
    const studentRecords = attendance[studentId] || {};
    const dates = Object.keys(studentRecords).filter(d => d.startsWith(selectedMonth));
    const markedDates = dates.filter(d => studentRecords[d] === 'Present' || studentRecords[d] === 'Absent');
    const total = markedDates.length;
    const present = markedDates.filter(d => studentRecords[d] === 'Present').length;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
    return { total, present, percentage };
  };

  const filteredStudents = approvedStudents.filter(student => {
    const studentName = (student.studentName || student.name || '').toLowerCase();
    const studentIdStr = (student.studentId || '').toString().toLowerCase();

    const matchesSearch = studentName.includes(searchTerm.toLowerCase()) ||
      studentIdStr.includes(searchTerm.toLowerCase());

    const currentStatus = attendance[student.studentId]?.[selectedDate] || 'Unmarked';
    const matchesFilter = statusFilter === 'All' ||
      (statusFilter === 'Present' && currentStatus === 'Present') ||
      (statusFilter === 'Absent' && currentStatus === 'Absent') ||
      (statusFilter === 'Unmarked' && currentStatus === 'Unmarked');

    const matchesLevel = selectedLevel === 'All' || getStudentLevel(student) === selectedLevel;

    return matchesSearch && matchesFilter && matchesLevel;
  });

  return (
    <div className="manager-container">
      {/* Level Filter Buttons */}
      <div className="level-filter-container" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['All', 'Beginner', 'Intermediate', 'Advanced'].map(level => {
          const count = getLevelCount(level);
          const isActive = selectedLevel === level;
          return (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                border: `1px solid ${isActive ? '#d4af37' : 'rgba(255,255,255,0.1)'}`,
                background: isActive ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? '#d4af37' : '#bbb',
                fontWeight: isActive ? '700' : '500',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isActive ? '0 4px 12px rgba(212, 175, 55, 0.15)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.border = '1px solid rgba(212, 175, 55, 0.4)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#bbb';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }
              }}
            >
              {level} <span style={{
                background: isActive ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                color: isActive ? '#d4af37' : '#888',
                padding: '2px 6px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="manager-header" style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ minWidth: '180px' }}>
          <label>Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ minWidth: '180px' }}>
          <label>Stats Month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ minWidth: '250px', flex: '1' }}>
          <label>Search Student Name or ID</label>
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ minWidth: '150px' }}>
          <label>Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Students</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Unmarked">Unmarked </option>
          </select>
        </div>
      </div>

      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Student Name</th>
              <th>Status for {selectedDate}</th>
              <th>Monthly Progress ({selectedMonth})</th>
            </tr>
          </thead>
          <tbody>
            {approvedStudents.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>No approved students found.</td></tr>
            ) : filteredStudents.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>No students found matching your search or filter.</td></tr>
            ) : (
              filteredStudents.map(student => {
                const stats = calculateStats(student.studentId);
                const currentStatus = attendance[student.studentId]?.[selectedDate] || 'Unmarked';

                return (
                  <tr key={student.studentId}>
                    <td>#{student.studentId}</td>
                    <td>
                      <span 
                        onClick={() => setViewingCalendarStudent(student)}
                        style={{ 
                          cursor: 'pointer', 
                          color: '#d4af37', 
                          fontWeight: '600',
                          borderBottom: '1px dashed rgba(212, 175, 55, 0.4)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'color 0.2s, border-bottom 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.borderBottom = '1px solid #fff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#d4af37';
                          e.currentTarget.style.borderBottom = '1px dashed rgba(212, 175, 55, 0.4)';
                        }}
                        title="Click to view full attendance calendar"
                      >
                        {student.studentName || student.name || 'N/A'} 📅
                      </span>
                    </td>
                    <td>
                      <div className="attendance-action-wrapper" style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          className={`attendance-btn present-btn ${currentStatus === 'Present' ? 'active' : ''}`}
                          style={{
                            padding: '0.6rem 1.25rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: `2px solid ${currentStatus === 'Present' ? '#20C997' : 'rgba(255,255,255,0.05)'}`,
                            background: currentStatus === 'Present' ? '#20C997' : 'rgba(255,255,255,0.03)',
                            color: currentStatus === 'Present' ? '#000' : '#888',
                            boxShadow: currentStatus === 'Present' ? '0 4px 12px rgba(32, 201, 151, 0.25)' : 'none'
                          }}
                          onClick={() => handleAttendanceChange(student.studentId, 'Present')}
                        >
                          <span style={{ fontSize: '1rem' }}>{currentStatus === 'Present' ? '✓' : '○'}</span>
                          Present
                        </button>
                        <button
                          className={`attendance-btn absent-btn ${currentStatus === 'Absent' ? 'active' : ''}`}
                          style={{
                            padding: '0.6rem 1.25rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: `2px solid ${currentStatus === 'Absent' ? '#FF6B6B' : 'rgba(255,255,255,0.05)'}`,
                            background: currentStatus === 'Absent' ? '#FF6B6B' : 'rgba(255,255,255,0.03)',
                            color: currentStatus === 'Absent' ? '#000' : '#888',
                            boxShadow: currentStatus === 'Absent' ? '0 4px 12px rgba(255, 107, 107, 0.25)' : 'none'
                          }}
                          onClick={() => handleAttendanceChange(student.studentId, 'Absent')}
                        >
                          <span style={{ fontSize: '1rem' }}>{currentStatus === 'Absent' ? '✕' : '○'}</span>
                          Absent
                        </button>
                        <button
                          className={`attendance-btn none-btn ${currentStatus === 'Unmarked' ? 'active' : ''}`}
                          style={{
                            padding: '0.6rem 1.25rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: `2px solid ${currentStatus === 'Unmarked' ? '#aaa' : 'rgba(255,255,255,0.05)'}`,
                            background: currentStatus === 'Unmarked' ? '#aaa' : 'rgba(255,255,255,0.03)',
                            color: currentStatus === 'Unmarked' ? '#000' : '#888',
                            boxShadow: currentStatus === 'Unmarked' ? '0 4px 12px rgba(255, 255, 255, 0.1)' : 'none'
                          }}
                          onClick={() => handleAttendanceChange(student.studentId, 'Unmarked')}
                        >
                          <span style={{ fontSize: '1rem' }}>{currentStatus === 'Unmarked' ? '●' : '○'}</span>
                          Clear
                        </button>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ flex: 1, height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${stats.percentage}%`,
                            height: '100%',
                            background: stats.percentage > 75 ? '#20C997' : stats.percentage > 50 ? '#FFD700' : '#FF6B6B',
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                        <span style={{ fontWeight: 'bold', minWidth: '45px' }}>{stats.percentage}%</span>
                      </div>
                      <small style={{ color: '#888' }}>{stats.present}/{stats.total} days</small>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
       {viewingCalendarStudent && (
        <AttendanceCalendarModal
          student={viewingCalendarStudent}
          attendance={attendance}
          onAttendanceChange={handleAttendanceChange}
          onClose={() => setViewingCalendarStudent(null)}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ATTENDANCE CALENDAR MODAL COMPONENT
   ═══════════════════════════════════════════════════════════ */
const AttendanceCalendarModal = ({ student, attendance, onAttendanceChange, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [activeEditingDay, setActiveEditingDay] = useState(null);

  const year = parseInt(selectedMonth.split('-')[0], 10);
  const monthIndex = parseInt(selectedMonth.split('-')[1], 10) - 1; // 0-indexed month

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days calculations
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();

  const handlePrevMonth = () => {
    setActiveEditingDay(null);
    let newMonth = monthIndex - 1;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    const monthStr = String(newMonth + 1).padStart(2, '0');
    setSelectedMonth(`${newYear}-${monthStr}`);
  };

  const handleNextMonth = () => {
    setActiveEditingDay(null);
    let newMonth = monthIndex + 1;
    let newYear = year;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    const monthStr = String(newMonth + 1).padStart(2, '0');
    setSelectedMonth(`${newYear}-${monthStr}`);
  };

  const getAttendanceStatus = (day) => {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(monthIndex + 1).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;
    return attendance[student.studentId]?.[dateKey] || 'Unmarked';
  };

  // Render the day cells
  const dayCells = [];
  // Empty padding cells for start of month
  for (let i = 0; i < firstDayOfWeek; i++) {
    dayCells.push(<div key={`empty-${i}`} style={{ opacity: 0.1, background: 'rgba(255,255,255,0.02)', aspectRatio: '1/1' }}></div>);
  }
  // Actual calendar days
  const todayStr = new Date().toISOString().split('T')[0];
  for (let day = 1; day <= totalDays; day++) {
    const status = getAttendanceStatus(day);
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(monthIndex + 1).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;
    const isToday = dateKey === todayStr;
    const isActiveEditing = activeEditingDay === day;

    let dayBg = 'rgba(255, 255, 255, 0.03)';
    let dayBorder = '1px solid rgba(255, 255, 255, 0.06)';
    let dayColor = '#eee';
    let statusText = 'Unmarked';
    let indicatorColor = '#555';

    if (status === 'Present') {
      dayBg = 'rgba(32, 201, 151, 0.12)';
      dayBorder = '1px solid rgba(32, 201, 151, 0.4)';
      dayColor = '#20C997';
      statusText = 'Present';
      indicatorColor = '#20C997';
    } else if (status === 'Absent') {
      dayBg = 'rgba(255, 107, 107, 0.12)';
      dayBorder = '1px solid rgba(255, 107, 107, 0.4)';
      dayColor = '#FF6B6B';
      statusText = 'Absent';
      indicatorColor = '#FF6B6B';
    }

    let borderStyle = dayBorder;
    if (isActiveEditing) {
      borderStyle = '2px solid #d4af37';
    } else if (isToday) {
      borderStyle = '2px dashed #d4af37';
    }

    dayCells.push(
      <div
        key={`day-${day}`}
        onClick={() => setActiveEditingDay(day)}
        style={{
          background: dayBg,
          border: borderStyle,
          borderRadius: '6px',
          padding: '0.3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          aspectRatio: '1/1',
          position: 'relative',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          boxShadow: isActiveEditing ? '0 0 12px rgba(212, 175, 55, 0.4)' : (isToday ? '0 0 8px rgba(212, 175, 55, 0.15)' : 'none')
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
        }}
      >
        <span style={{ fontWeight: '700', fontSize: '0.85rem', color: dayColor }}>{day}</span>
        {status !== 'Unmarked' && (
          <span 
            style={{ 
              fontSize: '0.55rem', 
              fontWeight: '700', 
              textTransform: 'uppercase', 
              background: indicatorColor, 
              color: '#000', 
              padding: '1px 3px', 
              borderRadius: '3px',
              textAlign: 'center'
            }}
          >
            {statusText}
          </span>
        )}
      </div>
    );
  }

  // Monthly stats for the modal
  const presentCount = dayCells.filter((_, i) => {
    const d = i - firstDayOfWeek + 1;
    return d > 0 && getAttendanceStatus(d) === 'Present';
  }).length;
  const absentCount = dayCells.filter((_, i) => {
    const d = i - firstDayOfWeek + 1;
    return d > 0 && getAttendanceStatus(d) === 'Absent';
  }).length;
  const unmarkedCount = totalDays - presentCount - absentCount;
  const totalMarked = presentCount + absentCount;
  const attendanceRate = totalMarked === 0 ? 0 : Math.round((presentCount / totalMarked) * 100);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }} onClick={onClose}>
      <div 
        style={{
          background: 'linear-gradient(145deg, #121212, #1a1a1a)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '480px',
          padding: '1.25rem',
          color: '#fff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#aaa',
            fontSize: '1rem',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 82, 82, 0.2)';
            e.currentTarget.style.color = '#ff5252';
            e.currentTarget.style.borderColor = '#ff5252';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.color = '#aaa';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        >
          ✕
        </button>

        <h2 style={{ color: '#d4af37', marginTop: 0, marginBottom: '0.2rem', fontSize: '1.25rem' }}>
          {student.studentName || student.name}
        </h2>
        <p style={{ color: '#888', margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 'bold' }}>
          Student ID: <span style={{ color: '#d4af37' }}>#{student.studentId}</span>
        </p>

        {/* Modal Calendar Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button 
            onClick={handlePrevMonth}
            style={{
              background: 'rgba(212,175,55,0.08)',
              border: '1px solid rgba(212,175,55,0.3)',
              color: '#d4af37',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.8rem'
            }}
          >
            ◀ Prev
          </button>
          <span style={{ fontSize: '1.05rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            {monthNames[monthIndex]} {year}
          </span>
          <button 
            onClick={handleNextMonth}
            style={{
              background: 'rgba(212,175,55,0.08)',
              border: '1px solid rgba(212,175,55,0.3)',
              color: '#d4af37',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.8rem'
            }}
          >
            Next ▶
          </button>
        </div>

        {/* Calendar Grid Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '4px' }}>
          {daysOfWeek.map(d => (
            <div key={d} style={{ color: '#888', fontWeight: 'bold', fontSize: '0.8rem', paddingBottom: '2px' }}>{d}</div>
          ))}
        </div>

        {/* Calendar Grid Days */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '1rem' }}>
          {dayCells}
        </div>

        {/* Inline Attendance Editor */}
        {activeEditingDay && (() => {
          const dayStr = String(activeEditingDay).padStart(2, '0');
          const monthStr = String(monthIndex + 1).padStart(2, '0');
          const dateKey = `${year}-${monthStr}-${dayStr}`;
          const currentStatus = getAttendanceStatus(activeEditingDay);

          return (
            <div style={{
              margin: '1rem 0',
              padding: '0.75rem',
              background: 'rgba(212, 175, 55, 0.04)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem', color: '#ccc' }}>
                Set attendance for <strong>{monthNames[monthIndex]} {activeEditingDay}, {year}</strong>:
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                <button
                  onClick={() => onAttendanceChange(student.studentId, 'Present', dateKey)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    transition: 'all 0.2s',
                    border: `1.5px solid ${currentStatus === 'Present' ? '#20C997' : 'rgba(32, 201, 151, 0.2)'}`,
                    background: currentStatus === 'Present' ? '#20C997' : 'transparent',
                    color: currentStatus === 'Present' ? '#000' : '#20C997'
                  }}
                >
                  Present
                </button>
                <button
                  onClick={() => onAttendanceChange(student.studentId, 'Absent', dateKey)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    transition: 'all 0.2s',
                    border: `1.5px solid ${currentStatus === 'Absent' ? '#FF6B6B' : 'rgba(255, 107, 107, 0.2)'}`,
                    background: currentStatus === 'Absent' ? '#FF6B6B' : 'transparent',
                    color: currentStatus === 'Absent' ? '#000' : '#FF6B6B'
                  }}
                >
                  Absent
                </button>
                <button
                  onClick={() => onAttendanceChange(student.studentId, 'Unmarked', dateKey)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    transition: 'all 0.2s',
                    border: `1.5px solid ${currentStatus === 'Unmarked' ? '#aaa' : 'rgba(255, 255, 255, 0.1)'}`,
                    background: currentStatus === 'Unmarked' ? '#aaa' : 'transparent',
                    color: currentStatus === 'Unmarked' ? '#000' : '#aaa'
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          );
        })()}

        {/* Monthly Summary Statistics */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '0.75rem',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#888' }}>Present</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#20C997' }}>{presentCount}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#888' }}>Absent</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#FF6B6B' }}>{absentCount}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#888' }}>Unmarked</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#aaa' }}>{unmarkedCount}</span>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1rem' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#888' }}>Rate</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#d4af37' }}>{attendanceRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManager;

