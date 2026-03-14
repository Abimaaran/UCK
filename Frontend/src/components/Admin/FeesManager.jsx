import React, { useState, useEffect } from 'react';
import { getCollection, updateItem } from '../../services/api';

const FeesManager = () => {
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [fees, setFees] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [students, allFees] = await Promise.all([
          getCollection('students'),
          getCollection('fees')
        ]);
        
        setApprovedStudents(Array.isArray(students) ? students.filter(s => s.status === 'Approved') : []);
        
        // Transform array to { studentId: { month: status } }
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
        console.error("Failed to fetch students or fees", err);
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

  return (
    <div className="manager-container">
      <div className="manager-header" style={{ marginBottom: '2rem' }}>
        <div className="form-group" style={{ maxWidth: '300px' }}>
          <label>Select Month to Manage Fees</label>
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
              <th>Status for {getMonthName(selectedMonth)}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvedStudents.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>No approved students found.</td></tr>
            ) : (
              approvedStudents.map(student => {
                const status = fees[student.studentId]?.[selectedMonth] || 'Not Paid';
                
                return (
                  <tr key={student.studentId}>
                    <td>#{student.studentId}</td>
                    <td>{student.name}</td>
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
