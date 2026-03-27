import React, { useState, useEffect } from 'react';
import { getCollection, updateItem } from '../../services/api';

const FeesManager = () => {
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [fees, setFees] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

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

      // 2. Fetch Fees
      try {
        const allFees = await getCollection('fees');
        const feesMap = {};
        if (Array.isArray(allFees)) {
          allFees.forEach(record => {
            if (!feesMap[record.studentId]) {
              feesMap[record.studentId] = {};
            }
            feesMap[record.studentId][record.month] = record.status;
          });
        }
        setFees(feesMap);
      } catch (err) {
        console.warn("Failed to fetch fees:", err.message);
        setFees({});
      }
    };
    fetchData();
  }, []);

  const handleFeeChange = async (studentId, status) => {
    try {
      const payload = {
          month: selectedMonth,
          status: status
      };
      await updateItem('fees', studentId, payload);
      
      const newFees = { ...fees };
      if (!newFees[studentId]) newFees[studentId] = {};
      newFees[studentId][selectedMonth] = status;
      setFees(newFees);
    } catch (err) {
      console.error("Failed to update fees", err);
      alert("Could not update fees.");
    }
  };

  const getMonthName = (monthStr) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const filteredStudents = approvedStudents.filter(student => {
    const studentName = (student.studentName || student.name || '').toLowerCase();
    const studentIdStr = (student.studentId || '').toString().toLowerCase();
    
    const matchesSearch = studentName.includes(searchTerm.toLowerCase()) || 
                          studentIdStr.includes(searchTerm.toLowerCase());
    
    const status = fees[student.studentId]?.[selectedMonth] || 'Not Paid';
    const matchesFilter = statusFilter === 'All' || 
                         (statusFilter === 'Paid' && status === 'Paid') ||
                         (statusFilter === 'Unpaid' && status === 'Not Paid');
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="manager-container">
      <div className="manager-header" style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ minWidth: '200px' }}>
          <label>Select Month</label>
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
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Student Name</th>
              <th>Status for {getMonthName(selectedMonth)}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvedStudents.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>No approved students found.</td></tr>
            ) : filteredStudents.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>No students found matching your search or filter.</td></tr>
            ) : (
              filteredStudents.map(student => {
                const status = fees[student.studentId]?.[selectedMonth] || 'Not Paid';
                
                return (
                  <tr key={student.studentId}>
                    <td>#{student.studentId}</td>
                    <td>{student.studentName || student.name || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${status === 'Paid' ? 'approved' : 'pending'}`} style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        background: status === 'Paid' ? 'rgba(32, 201, 151, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                        color: status === 'Paid' ? '#20C997' : '#FF6B6B',
                        border: `1px solid ${status === 'Paid' ? '#20C997' : '#FF6B6B'}`
                      }}>
                        {status}
                      </span>
                    </td>
                    <td className="action-btns">
                      <button 
                        className="edit-btn"
                        onClick={() => handleFeeChange(student.studentId, 'Paid')}
                        disabled={status === 'Paid'}
                      >
                        Mark as Paid
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleFeeChange(student.studentId, 'Not Paid')}
                        disabled={status === 'Not Paid'}
                      >
                        Mark as Unpaid
                      </button>
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

export default FeesManager;
