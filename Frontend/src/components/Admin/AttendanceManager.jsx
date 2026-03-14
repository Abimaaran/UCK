import React, { useState, useEffect } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';

const AttendanceManager = () => {
  const [approvedStudents] = useLocalStorage('chess_academy_approved_students', []);
  const [attendance, setAttendance] = useLocalStorage('uck_attendance', {});
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleAttendanceChange = (studentId, status) => {
    const newAttendance = { ...attendance };
    if (!newAttendance[studentId]) newAttendance[studentId] = {};
    newAttendance[studentId][selectedDate] = status;
    setAttendance(newAttendance);
  };

  const calculateStats = (studentId) => {
    const studentRecords = attendance[studentId] || {};
    const dates = Object.keys(studentRecords).filter(d => d.startsWith(selectedMonth));
    const total = dates.length;
    const present = dates.filter(d => studentRecords[d] === 'Present').length;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
    return { total, present, percentage };
  };

  return (
    <div className="manager-container">
      <div className="manager-header" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Select Date to Mark</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>View Stats Month</label>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
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
            ) : (
              approvedStudents.map(student => {
                const stats = calculateStats(student.studentId);
                const currentStatus = attendance[student.studentId]?.[selectedDate] || 'Unmarked';
                
                return (
                  <tr key={student.studentId}>
                    <td>#{student.studentId}</td>
                    <td>{student.name}</td>
                    <td>
                      <div className="action-btns" style={{ gap: '0.5rem' }}>
                        <button 
                          className={`edit-btn ${currentStatus === 'Present' ? 'active' : ''}`}
                          style={{ background: currentStatus === 'Present' ? '#20C997' : 'transparent' }}
                          onClick={() => handleAttendanceChange(student.studentId, 'Present')}
                        >
                          Present
                        </button>
                        <button 
                          className={`delete-btn ${currentStatus === 'Absent' ? 'active' : ''}`}
                          style={{ background: currentStatus === 'Absent' ? '#FF6B6B' : 'transparent' }}
                          onClick={() => handleAttendanceChange(student.studentId, 'Absent')}
                        >
                          Absent
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
