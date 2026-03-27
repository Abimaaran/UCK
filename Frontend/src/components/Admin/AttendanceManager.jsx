import React, { useState, useEffect } from 'react';
import { getCollection, updateItem, createItem } from '../../services/api';

const AttendanceManager = () => {
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

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

  const handleAttendanceChange = async (studentId, status) => {
    try {
      // Typically you'd send { studentId, date: selectedDate, status } to the backend
      // Here we assume a PUT/POST to `/attendance/${studentId}` with the date and status
      const payload = {
        date: selectedDate,
        status: status
      };
      // Note: this depends heavily on how your backend expects attendance data.
      // E.g., a generic update or a specific attendance mark endpoint
      await updateItem('attendance', studentId, payload);

      const newAttendance = { ...attendance };
      if (!newAttendance[studentId]) newAttendance[studentId] = {};
      newAttendance[studentId][selectedDate] = status;
      setAttendance(newAttendance);
    } catch (err) {
      console.error("Failed to update attendance", err);
      alert("Could not update attendance.");
    }
  };

  const calculateStats = (studentId) => {
    const studentRecords = attendance[studentId] || {};
    const dates = Object.keys(studentRecords).filter(d => d.startsWith(selectedMonth));
    const total = dates.length;
    const present = dates.filter(d => studentRecords[d] === 'Present').length;
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

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="manager-container">
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
                    <td>{student.studentName || student.name || 'N/A'}</td>
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
    </div>
  );
};

export default AttendanceManager;
