import React, { useState, useEffect } from 'react';
import { getCollection, updateItem, createItem } from '../../services/api';

let cachedApprovedStudents = null;
let cachedAttendanceMap = null;

const AttendanceManager = ({ initialStudents }) => {
  const [approvedStudents, setApprovedStudents] = useState(() => {
    if (Array.isArray(initialStudents) && initialStudents.length > 0) {
      return initialStudents.filter(s => s.status === 'Approved' && !s.isPaused);
    }
    return cachedApprovedStudents || [];
  });
  const [attendance, setAttendance] = useState(() => cachedAttendanceMap || {});
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [viewingCalendarStudent, setViewingCalendarStudent] = useState(null);
  const [selectedStudentForView, setSelectedStudentForView] = useState(null);

  const formatDisplayPhone = (phone) => {
    if (!phone) return 'N/A';
    let str = String(phone).trim();
    if (str.startsWith('+94')) {
      str = '0' + str.slice(3).trim();
    } else if (str.startsWith('94') && str.length === 11) {
      str = '0' + str.slice(2).trim();
    }
    return str;
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    const str = String(dateVal).trim();
    if (!str || str === 'null' || str === 'undefined' || str === 'N/A') return 'N/A';
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
      const [d, m, y] = str.split('/');
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    if (str.includes('-')) {
      const datePart = str.split('T')[0];
      const parts = datePart.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
    }
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (e) {}
    return str;
  };

  const formatDOB = (dobStr) => formatDate(dobStr);

  const highlightMatch = (text, query) => {
    if (!query || !query.trim()) return text;
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = String(text).split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="search-highlight-blink">
          {part}
        </span>
      ) : part
    );
  };

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
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [studentData, allAttendance] = await Promise.all([
          getCollection('students').catch(err => {
            console.warn("Failed to fetch students:", err.message);
            return null;
          }),
          getCollection('attendance').catch(err => {
            console.warn("Failed to fetch attendance:", err.message);
            return null;
          })
        ]);

        if (!isMounted) return;

        if (Array.isArray(studentData)) {
          const approved = studentData.filter(s => s.status === 'Approved' && !s.isPaused);
          cachedApprovedStudents = approved;
          setApprovedStudents(approved);
        }

        if (Array.isArray(allAttendance)) {
          const attendanceMap = {};
          allAttendance.forEach(record => {
            if (!attendanceMap[record.studentId]) {
              attendanceMap[record.studentId] = {};
            }
            attendanceMap[record.studentId][record.date] = record.status;
          });
          cachedAttendanceMap = attendanceMap;
          setAttendance(attendanceMap);
        }
      } catch (err) {
        console.warn("Error fetching attendance data:", err);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  const handleAttendanceChange = async (studentId, status, targetDate = selectedDate) => {
    const previousStatus = attendance[studentId]?.[targetDate];
    if (previousStatus === status) return;

    // ⚡ Optimistic UI Update: Instant visual feedback with zero latency
    const newAttendance = {
      ...attendance,
      [studentId]: {
        ...(attendance[studentId] || {}),
        [targetDate]: status
      }
    };
    setAttendance(newAttendance);
    if (cachedAttendanceMap) {
      if (!cachedAttendanceMap[studentId]) cachedAttendanceMap[studentId] = {};
      cachedAttendanceMap[studentId][targetDate] = status;
    }

    try {
      const payload = {
        date: targetDate,
        status: status
      };
      await updateItem('attendance', studentId, payload);
    } catch (err) {
      console.error("Failed to update attendance", err);
      // Revert optimistic update on failure
      const reverted = {
        ...attendance,
        [studentId]: {
          ...(attendance[studentId] || {}),
          [targetDate]: previousStatus
        }
      };
      setAttendance(reverted);
      if (cachedAttendanceMap) {
        cachedAttendanceMap[studentId][targetDate] = previousStatus;
      }
      alert("Could not update attendance. Please try again.");
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

  const [sortBy, setSortBy] = useState('studentId');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
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

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === 'studentId') {
      const valA = a.studentId || '';
      const valB = b.studentId || '';
      const numA = parseInt(valA.replace(/\D/g, ''), 10);
      const numB = parseInt(valB.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else if (sortBy === 'name') {
      const valA = a.studentName || a.name || '';
      const valB = b.studentName || b.name || '';
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else if (sortBy === 'percentage') {
      const pctA = calculateStats(a.studentId).percentage;
      const pctB = calculateStats(b.studentId).percentage;
      return sortOrder === 'asc' ? pctA - pctB : pctB - pctA;
    }
    return 0;
  });

  return (
    <div className="manager-container">
      <style>{`
        @keyframes blinkHighlight {
          0% { background-color: rgba(212, 175, 55, 0.95); color: #000; box-shadow: 0 0 5px rgba(212, 175, 55, 0.6); }
          100% { background-color: rgba(212, 175, 55, 0.2); color: #fff; }
        }
        .search-highlight-blink {
          animation: blinkHighlight 0.6s infinite alternate;
          font-weight: 700;
          padding: 0 2px;
          border-radius: 3px;
        }
      `}</style>
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
            <option value="All" style={{ background: '#15151a', color: '#fff' }}>All Students</option>
            <option value="Present" style={{ background: '#15151a', color: '#fff' }}>Present</option>
            <option value="Absent" style={{ background: '#15151a', color: '#fff' }}>Absent</option>
            <option value="Unmarked" style={{ background: '#15151a', color: '#fff' }}>Unmarked </option>
          </select>
        </div>
      </div>

      {/* Sorting Control Bar */}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ color: '#aaa', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort Attendance List By:</span>
        {[
          { key: 'studentId', label: '🪪 Student ID' },
          { key: 'name', label: '🔤 Student Name' },
          { key: 'percentage', label: '📊 Attendance %' }
        ].map(item => {
          const isActive = sortBy === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleSort(item.key)}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '6px',
                border: `1px solid ${isActive ? '#d4af37' : 'rgba(255,255,255,0.1)'}`,
                background: isActive ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                color: isActive ? '#d4af37' : '#ccc',
                fontSize: '0.8rem',
                fontWeight: isActive ? '600' : '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.2s'
              }}
            >
              {item.label} {isActive ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
            </button>
          );
        })}
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
            ) : sortedStudents.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>No students found matching your search or filter.</td></tr>
            ) : (
              sortedStudents.map(student => {
                const stats = calculateStats(student.studentId);
                const currentStatus = student.isPaused ? 'Unmarked' : (attendance[student.studentId]?.[selectedDate] || 'Unmarked');

                return (
                  <tr key={student.studentId} style={{ opacity: student.isPaused ? 0.7 : 1 }}>
                    <td>
                      <span
                        onClick={() => setSelectedStudentForView(student)}
                        style={{
                          cursor: 'pointer',
                          color: '#d4af37',
                          fontWeight: '700',
                          borderBottom: '1px dashed rgba(212, 175, 55, 0.4)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Click to view and edit student profile details"
                      >
                        #{highlightMatch(student.studentId, searchTerm)} 🔍
                      </span>
                    </td>
                    <td>
                      <span 
                        onClick={() => !student.isPaused && setViewingCalendarStudent(student)}
                        style={{ 
                          cursor: student.isPaused ? 'default' : 'pointer', 
                          color: student.isPaused ? '#888' : '#d4af37', 
                          fontWeight: '600',
                          borderBottom: student.isPaused ? 'none' : '1px dashed rgba(212, 175, 55, 0.4)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'color 0.2s, border-bottom 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!student.isPaused) {
                            e.currentTarget.style.color = '#fff';
                            e.currentTarget.style.borderBottom = '1px solid #fff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!student.isPaused) {
                            e.currentTarget.style.color = '#d4af37';
                            e.currentTarget.style.borderBottom = '1px dashed rgba(212, 175, 55, 0.4)';
                          }
                        }}
                        title={student.isPaused ? "Student is paused" : "Click to view full attendance calendar"}
                      >
                        {highlightMatch(student.studentName || student.name || 'N/A', searchTerm)} 📅
                        {student.isPaused && (
                          <span style={{ 
                            marginLeft: '8px', 
                            fontSize: '0.7rem', 
                            background: 'rgba(255, 107, 107, 0.15)', 
                            color: '#ff6b6b', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            border: '1px solid rgba(255, 107, 107, 0.3)'
                          }}>
                            Paused
                          </span>
                        )}
                      </span>
                    </td>
                    <td>
                      {student.isPaused ? (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ 
                            fontSize: '0.82rem', 
                            fontWeight: 'bold', 
                            color: '#ff6b6b', 
                            background: 'rgba(255, 107, 107, 0.1)', 
                            padding: '0.5rem 1.25rem', 
                            borderRadius: '8px', 
                            border: '1px solid rgba(255, 107, 107, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            ⏸️ PAUSED (Unmarked)
                          </span>
                        </div>
                      ) : (
                        <div className="attendance-action-wrapper" style={{ display: 'flex', gap: '0.75rem' }}>
                          <button
                            className={`attendance-btn present-btn ${currentStatus === 'Present' ? 'active' : ''}`}
                            style={{
                              padding: '0.6rem 1.25rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              transition: 'transform 0.08s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
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
                              transition: 'transform 0.08s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
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
                      )}
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
      {selectedStudentForView && (
        <StudentProfileModal
          student={selectedStudentForView}
          onClose={() => setSelectedStudentForView(null)}
          onStudentUpdated={(updated) => {
            setSelectedStudentForView(updated);
            setApprovedStudents(prev => prev.map(s => {
              if (s.studentId === updated.studentId || (s.id && s.id === updated.id)) {
                return { ...s, ...updated };
              }
              return s;
            }));
            if (cachedApprovedStudents) {
              cachedApprovedStudents = cachedApprovedStudents.map(s => {
                if (s.studentId === updated.studentId || (s.id && s.id === updated.id)) {
                  return { ...s, ...updated };
                }
                return s;
              });
            }
          }}
          formatDisplayPhone={formatDisplayPhone}
          formatDOB={formatDOB}
          formatDate={formatDate}
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

/* ═══════════════════════════════════════════════════════════
   STUDENT PROFILE DETAILS MODAL WITH EDIT MODE
   ═══════════════════════════════════════════════════════════ */
const StudentProfileModal = ({ student, onClose, onStudentUpdated, formatDisplayPhone, formatDOB, formatDate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(student);

  useEffect(() => {
    setCurrentStudent(student);
    setIsEditing(false);
  }, [student]);

  if (!currentStudent) return null;

  const detailRow = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ color: '#fff', fontWeight: '600' }}>{value || 'N/A'}</span>
    </div>
  );

  const editField = (label, name, value, type = 'text', options = null) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', color: '#d4af37', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
        {label}
      </label>
      {options ? (
        <select
          value={value}
          onChange={(e) => setEditForm(prev => ({ ...prev, [name]: e.target.value }))}
          style={{
            width: '100%', padding: '0.65rem 0.85rem', background: '#101014',
            border: '1px solid rgba(212,175,55,0.35)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem',
            outline: 'none', boxSizing: 'border-box'
          }}
        >
          {options.map(opt => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={optVal} value={optVal} style={{ background: '#15151a', color: '#fff' }}>
                {optLabel}
              </option>
            );
          })}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          rows="2"
          value={value}
          onChange={(e) => setEditForm(prev => ({ ...prev, [name]: e.target.value }))}
          style={{
            width: '100%', padding: '0.65rem 0.85rem', background: '#101014',
            border: '1px solid rgba(212,175,55,0.35)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem',
            outline: 'none', boxSizing: 'border-box', resize: 'vertical'
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => setEditForm(prev => ({ ...prev, [name]: e.target.value }))}
          style={{
            width: '100%', padding: '0.65rem 0.85rem', background: '#101014',
            border: '1px solid rgba(212,175,55,0.35)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem',
            outline: 'none', boxSizing: 'border-box'
          }}
        />
      )}
    </div>
  );

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const targetDbId = currentStudent.id || currentStudent._id || currentStudent.studentId;
      const updatedFields = {
        studentName: (editForm.studentName || '').trim(),
        name: (editForm.studentName || '').trim(),
        email: (editForm.email || '').trim(),
        phone: (editForm.phoneNumber || '').trim(),
        phoneNumber: (editForm.phoneNumber || '').trim(),
        dob: (editForm.dateOfBirth || '').trim(),
        dateOfBirth: (editForm.dateOfBirth || '').trim(),
        level: editForm.chessExperience || 'Beginner',
        chessExperience: editForm.chessExperience || 'Beginner',
        school: (editForm.school || '').trim(),
        gender: editForm.gender || 'N/A',
        fideId: (editForm.fideId || '').trim(),
        fideRating: (editForm.fideRating || '').trim(),
        parentName: (editForm.parentName || '').trim(),
        parentOccupation: (editForm.parentOccupation || '').trim(),
        address: (editForm.address || '').trim()
      };

      await updateItem('students', targetDbId, updatedFields);

      const merged = { ...currentStudent, ...updatedFields };
      setCurrentStudent(merged);
      if (onStudentUpdated) onStudentUpdated(merged);
      setIsEditing(false);
      alert('✅ Student details updated successfully!');
    } catch (err) {
      console.error('Failed to update student details:', err);
      alert('Failed to update student: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000,
      padding: '1rem'
    }} onClick={() => { onClose(); setIsEditing(false); }}>
      <div style={{
        background: '#15151a', width: '100%', maxWidth: '520px',
        borderRadius: '15px', border: '1px solid rgba(212,175,55,0.3)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)', overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '1.25rem 1.5rem', background: 'rgba(212,175,55,0.1)',
          borderBottom: '1px solid rgba(212,175,55,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#d4af37', fontSize: '1.25rem' }}>
            {isEditing ? '✏️ Edit Student Details' : 'Student Profile Details'}
          </h3>
          <button onClick={() => { onClose(); setIsEditing(false); }} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎓</div>
            <h2 style={{ margin: 0, color: '#fff' }}>{currentStudent.studentName || currentStudent.name}</h2>
            <span style={{ color: '#d4af37', fontWeight: '700' }}>#{currentStudent.studentId}</span>
          </div>

          {isEditing ? (
            /* ── EDIT MODE ── */
            <div>
              {editField('Full Name *', 'studentName', editForm.studentName || '')}
              {editField('Email Address', 'email', editForm.email || '', 'email')}
              {editField('Phone Number *', 'phoneNumber', editForm.phoneNumber || '')}
              {editField('Date of Birth (DD/MM/YYYY)', 'dateOfBirth', editForm.dateOfBirth || '')}
              {editField('Chess Level', 'chessExperience', editForm.chessExperience || 'Beginner', 'select', [
                { value: 'Beginner', label: 'Beginner' },
                { value: 'Intermediate', label: 'Intermediate' },
                { value: 'Advanced', label: 'Advanced' }
              ])}
              {editField('School / College', 'school', editForm.school || '')}
              {editField('Gender', 'gender', editForm.gender || 'N/A', 'select', ['Male', 'Female', 'Other', 'N/A'])}
              {editField('FIDE ID', 'fideId', editForm.fideId || '')}
              {editField('FIDE Rating', 'fideRating', editForm.fideRating || '')}
              {editField('Parent Name', 'parentName', editForm.parentName || '')}
              {editField('Parent Occupation', 'parentOccupation', editForm.parentOccupation || '')}
              {editField('Address', 'address', editForm.address || '', 'textarea')}
            </div>
          ) : (
            /* ── VIEW MODE ── */
            <>
              {detailRow('Full Name', currentStudent.studentName || currentStudent.name)}
              {detailRow('Email Address', currentStudent.email)}
              {detailRow('Phone Number', formatDisplayPhone(currentStudent.phoneNumber || currentStudent.phone || currentStudent.whatsappNo))}
              {detailRow('Date of Birth', formatDOB(currentStudent.dateOfBirth || currentStudent.dob))}
              {detailRow('Chess Level', currentStudent.chessExperience || currentStudent.level)}
              {detailRow('Registration Date', formatDate(currentStudent.approvedDate || currentStudent.approved_date || currentStudent.createdAt || currentStudent.created_at))}
              {detailRow('School / College', currentStudent.school)}
              {detailRow('Gender', currentStudent.gender)}
              {detailRow('FIDE ID', currentStudent.fideId && String(currentStudent.fideId).trim() ? currentStudent.fideId : 'N/A')}
              {detailRow('FIDE Rating', currentStudent.fideRating && String(currentStudent.fideRating).trim() ? currentStudent.fideRating : 'N/A')}
              {detailRow('Parent Name', currentStudent.parentName)}
              {detailRow('Parent Occupation', currentStudent.parentOccupation)}

              <div style={{ marginTop: '1.5rem' }}>
                <span style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Address</span>
                <p style={{ color: '#fff', fontSize: '0.95rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', lineHeight: '1.6', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {currentStudent.address || 'No address provided.'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        {isEditing ? (
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              style={{
                padding: '0.65rem 1.4rem', background: 'rgba(255,255,255,0.08)', color: '#bbb',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', fontWeight: '600', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '0.65rem 1.8rem', background: '#20C997', color: '#000',
                border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {isSaving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        ) : (
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={() => {
                setEditForm({
                  studentName: currentStudent.studentName || currentStudent.name || '',
                  email: currentStudent.email || '',
                  phoneNumber: currentStudent.phoneNumber || currentStudent.phone || currentStudent.whatsappNo || '',
                  dateOfBirth: currentStudent.dateOfBirth || currentStudent.dob || '',
                  chessExperience: currentStudent.chessExperience || currentStudent.level || 'Beginner',
                  school: currentStudent.school || '',
                  gender: currentStudent.gender || 'N/A',
                  fideId: currentStudent.fideId || '',
                  fideRating: currentStudent.fideRating || '',
                  parentName: currentStudent.parentName || '',
                  parentOccupation: currentStudent.parentOccupation || '',
                  address: currentStudent.address || ''
                });
                setIsEditing(true);
              }}
              style={{
                padding: '0.65rem 1.4rem', background: 'rgba(212,175,55,0.15)', color: '#d4af37',
                border: '1px solid #d4af37', borderRadius: '6px', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
              }}
            >
              ✏️ Edit Details
            </button>
            <button onClick={() => { onClose(); setIsEditing(false); }} style={{
              padding: '0.65rem 2rem', background: '#d4af37', color: '#000',
              border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer'
            }}>Close Details</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceManager;


