import React, { useState, useEffect } from 'react';
import api, { getCollection, updateItem } from '../../services/api';

const FeesManager = () => {
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [fees, setFees] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  
  // WhatsApp States
  const [waStatus, setWaStatus] = useState('LOADING');
  const [waQr, setWaQr] = useState(null);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [selectedStudentForView, setSelectedStudentForView] = useState(null);
  const [reminderLog, setReminderLog] = useState(null);

  const fetchLatestReminderStatus = async () => {
    try {
      const response = await api.get(`/fees/reminder-status/latest`, {
        params: { month: selectedMonth }
      });
      setReminderLog(response.data);
    } catch (err) {
      console.warn("Failed to fetch latest reminder status:", err.message);
    }
  };

  useEffect(() => {
    fetchLatestReminderStatus();
  }, [selectedMonth]);

  useEffect(() => {
    let timer;
    if (reminderLog && reminderLog.status === 'PROCESSING') {
      timer = setInterval(fetchLatestReminderStatus, 4000);
    }
    return () => clearInterval(timer);
  }, [reminderLog]);

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

  useEffect(() => {
    let interval;
    const checkStatus = async () => {
      try {
        const response = await api.get('/whatsapp/status');
        setWaStatus(response.data.status);
        if (response.data.status === 'QR_READY') {
          const qrResponse = await api.get('/whatsapp/qr');
          setWaQr(qrResponse.data.qr);
        } else {
          setWaQr(null);
        }
      } catch (err) {
        console.warn("Failed to fetch WhatsApp status:", err.message);
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleWaLogout = async () => {
    if (!window.confirm("Are you sure you want to disconnect WhatsApp?")) return;
    try {
      setWaStatus('LOADING');
      await api.post('/whatsapp/logout');
      setWaQr(null);
    } catch (err) {
      alert("Failed to logout WhatsApp session.");
    }
  };

  const handleSendReminders = async () => {
    const unpaidCount = approvedStudents.filter(s => {
      const status = fees[s.studentId]?.[selectedMonth] || 'Not Paid';
      return status !== 'Paid' && !s.isPaused;
    }).length;

    if (unpaidCount === 0) {
      alert("No unpaid approved students found for this month!");
      return;
    }

    if (!window.confirm(`Are you sure you want to send automatic WhatsApp reminders to ${unpaidCount} unpaid students for ${getMonthName(selectedMonth)}?`)) {
      return;
    }

    try {
      setSendingReminders(true);
      const response = await api.post('/fees/send-reminders', { month: selectedMonth });
      alert(response.data.message || `Reminders started in background for ${unpaidCount} students!`);
      fetchLatestReminderStatus();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to trigger reminders. Make sure WhatsApp is connected.");
    } finally {
      setSendingReminders(false);
    }
  };

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
    
    const status = fees[student.studentId]?.[selectedMonth] || 'Not Paid';
    const matchesFilter = statusFilter === 'All' || 
                         (statusFilter === 'Paid' && status === 'Paid') ||
                         (statusFilter === 'Unpaid' && status === 'Not Paid');
    
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
    } else if (sortBy === 'status') {
      const statusA = fees[a.studentId]?.[selectedMonth] || 'Not Paid';
      const statusB = fees[b.studentId]?.[selectedMonth] || 'Not Paid';
      return sortOrder === 'asc' ? statusA.localeCompare(statusB) : statusB.localeCompare(statusA);
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
      {/* WhatsApp Connection Status Panel */}
      <div 
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💬</span> WhatsApp Automation Status
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#888' }}>
              Automatically checks database and triggers reminders to unpaid students on the 6th, 13th, 20th, 27th.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Status Badge */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: 
                waStatus === 'CONNECTED' ? 'rgba(37, 211, 102, 0.12)' :
                waStatus === 'QR_READY' ? 'rgba(255, 193, 7, 0.12)' :
                waStatus === 'INITIALIZING' ? 'rgba(0, 123, 255, 0.12)' :
                'rgba(255, 255, 255, 0.08)',
              color: 
                waStatus === 'CONNECTED' ? '#25D366' :
                waStatus === 'QR_READY' ? '#FFC107' :
                waStatus === 'INITIALIZING' ? '#007BFF' :
                '#aaa',
              border: `1px solid ${
                waStatus === 'CONNECTED' ? '#25D366' :
                waStatus === 'QR_READY' ? '#FFC107' :
                waStatus === 'INITIALIZING' ? '#007BFF' :
                'rgba(255, 255, 255, 0.15)'
              }`
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 
                  waStatus === 'CONNECTED' ? '#25D366' :
                  waStatus === 'QR_READY' ? '#FFC107' :
                  waStatus === 'INITIALIZING' ? '#007BFF' :
                  '#888',
                display: 'inline-block',
                boxShadow: `0 0 8px ${
                  waStatus === 'CONNECTED' ? '#25D366' :
                  waStatus === 'QR_READY' ? '#FFC107' :
                  waStatus === 'INITIALIZING' ? '#007BFF' :
                  'rgba(255,255,255,0.2)'
                }`
              }}></span>
              {waStatus === 'CONNECTED' ? 'Connected' :
               waStatus === 'QR_READY' ? 'Scan QR Code' :
               waStatus === 'INITIALIZING' ? 'Initializing' :
               'Standby (Offline)'}
            </span>

            {waStatus === 'CONNECTED' && (
              <button
                onClick={handleWaLogout}
                style={{
                  background: 'rgba(220, 53, 69, 0.15)',
                  border: '1px solid #DC3545',
                  color: '#DC3545',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(220, 53, 69, 0.25)'}
                onMouseLeave={e => e.target.style.background = 'rgba(220, 53, 69, 0.15)'}
              >
                Disconnect Session
              </button>
            )}
          </div>
        </div>

        {waStatus === 'QR_READY' && waQr && (
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', padding: '1.5rem', borderRadius: '10px', width: 'fit-content', margin: '1.5rem auto 0 auto' }}>
            <img src={waQr} alt="WhatsApp QR Code" style={{ width: '220px', height: '220px' }} />
            <span style={{ color: '#000', fontSize: '0.85rem', marginTop: '0.75rem', fontWeight: 'bold', textAlign: 'center' }}>
              Scan this QR Code with WhatsApp Link Device to connect.
            </span>
          </div>
        )}

        {waStatus === 'LOADING' && (
          <div style={{ marginTop: '1rem', color: '#aaa', fontSize: '0.9rem' }}>
            🤖 Preparing browser context and connecting to WhatsApp Web. This might take up to a minute...
          </div>
        )}
      </div>

      {/* WhatsApp Reminder Logs / Status Feed */}
      {reminderLog && (
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${
              reminderLog.status === 'PROCESSING' ? 'rgba(0, 123, 255, 0.3)' :
              reminderLog.failCount > 0 ? 'rgba(220, 53, 69, 0.3)' :
              'rgba(40, 167, 69, 0.3)'
            }`,
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📢</span> Monthly Fee Reminders Status ({getMonthName(reminderLog.month)})
              </h4>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#888' }}>
                Started at: {new Date(reminderLog.startedAt).toLocaleTimeString()} | Mode: {reminderLog.runType || 'Manual'}
              </p>
            </div>
            
            <span style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              background: 
                reminderLog.status === 'PROCESSING' ? 'rgba(0, 123, 255, 0.15)' :
                'rgba(40, 167, 69, 0.15)',
              color: 
                reminderLog.status === 'PROCESSING' ? '#007BFF' :
                '#28a745',
              border: `1px solid ${
                reminderLog.status === 'PROCESSING' ? '#007BFF' :
                '#28a745'
              }`
            }}>
              {reminderLog.status}
            </span>
          </div>

          {/* Progress Bar / Counters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase' }}>Total Unpaid</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>{reminderLog.totalRecipients}</div>
            </div>
            <div style={{ background: 'rgba(40, 167, 69, 0.05)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(40,167,69,0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>✅ Sent</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#28a745' }}>{reminderLog.successCount}</div>
            </div>
            <div style={{ background: 'rgba(220, 53, 69, 0.05)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(220,53,69,0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>❌ Failed</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#dc3545' }}>{reminderLog.failCount}</div>
            </div>
          </div>

          {/* Processing State */}
          {reminderLog.status === 'PROCESSING' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.4rem' }}>
                <span>Sending in progress...</span>
                <span>{Math.round(((reminderLog.successCount + reminderLog.failCount) / reminderLog.totalRecipients) * 100)}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${((reminderLog.successCount + reminderLog.failCount) / reminderLog.totalRecipients) * 100}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #d4af37, #aa8422)', 
                  transition: 'width 0.3s ease-in-out' 
                }}/>
              </div>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#bbb', fontStyle: 'italic' }}>
                * Delays are applied between reminders to comply with spam filters. Feel free to navigate away; reminders will continue in the background.
              </p>
            </div>
          )}

          {/* Completed State */}
          {reminderLog.status === 'COMPLETED' && (
            <div>
              {reminderLog.failCount === 0 ? (
                <div style={{ background: 'rgba(40, 167, 69, 0.1)', border: '1px solid rgba(40, 167, 69, 0.2)', padding: '0.8rem 1.2rem', borderRadius: '8px', color: '#28a745', fontWeight: '600', fontSize: '0.88rem' }}>
                  🎉 Success! All messages have been sent successfully.
                </div>
              ) : (
                <div>
                  <div style={{ background: 'rgba(220, 53, 69, 0.1)', border: '1px solid rgba(220, 53, 69, 0.2)', padding: '0.8rem 1.2rem', borderRadius: '8px', color: '#ff6b6b', fontWeight: '600', fontSize: '0.88rem', marginBottom: '1rem' }}>
                    ⚠️ Send Complete: {reminderLog.successCount} sent successfully. {reminderLog.failCount} messages failed to send. See details below.
                  </div>

                  {/* Failed Recipients details */}
                  <h5 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Failed Deliveries ({reminderLog.failCount})
                  </h5>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                    <table style={{ minWidth: '100%', tableLayout: 'fixed' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#aaa', width: '25%' }}>Student ID</th>
                          <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#aaa', width: '35%' }}>Student Name</th>
                          <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#aaa', width: '40%' }}>Reason for Failure</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reminderLog.failList.map((fail, fIdx) => (
                          <tr key={fIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#ff6b6b', fontWeight: 'bold' }}>#{fail.studentId}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#ddd' }}>{fail.name}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#aaa', wordBreak: 'break-word' }}>
                              ⚠️ {fail.error || 'Unknown failure'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
            <option value="All" style={{ background: '#15151a', color: '#fff' }}>All Students</option>
            <option value="Paid" style={{ background: '#15151a', color: '#fff' }}>Paid</option>
            <option value="Unpaid" style={{ background: '#15151a', color: '#fff' }}>Unpaid</option>
          </select>
        </div>

        {/* Send Reminders Trigger Button */}
        <div className="form-group" style={{ minWidth: '220px' }}>
          <label>WhatsApp Automation</label>
          <button 
            onClick={handleSendReminders}
            disabled={sendingReminders || waStatus !== 'CONNECTED'}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: waStatus === 'CONNECTED' ? '1px solid #25D366' : '1px solid rgba(255,255,255,0.1)',
              background: waStatus === 'CONNECTED' ? 'rgba(37, 211, 102, 0.15)' : 'rgba(255,255,255,0.03)',
              color: waStatus === 'CONNECTED' ? '#25D366' : '#666',
              fontWeight: 'bold',
              cursor: waStatus === 'CONNECTED' ? 'pointer' : 'not-allowed',
              fontSize: '0.85rem',
              transition: 'all 0.3s ease',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseEnter={e => {
              if (waStatus === 'CONNECTED') {
                e.currentTarget.style.background = 'rgba(37, 211, 102, 0.25)';
              }
            }}
            onMouseLeave={e => {
              if (waStatus === 'CONNECTED') {
                e.currentTarget.style.background = 'rgba(37, 211, 102, 0.15)';
              }
            }}
          >
            {sendingReminders ? '⏳ Sending...' : '🚀 Send Reminders'}
          </button>
        </div>
      </div>

      {/* Sorting Control Bar */}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ color: '#aaa', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort Fees List By:</span>
        {[
          { key: 'studentId', label: '🪪 Student ID' },
          { key: 'name', label: '🔤 Student Name' },
          { key: 'status', label: '💰 Fee Status' }
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
              <th>Status for {getMonthName(selectedMonth)}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvedStudents.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>No approved students found.</td></tr>
            ) : sortedStudents.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>No students found matching your search or filter.</td></tr>
            ) : (
              sortedStudents.map(student => {
                const status = fees[student.studentId]?.[selectedMonth] || 'Not Paid';
                
                return (
                  <tr key={student.studentId} style={{ opacity: student.isPaused ? 0.7 : 1 }}>
                    <td>#{highlightMatch(student.studentId, searchTerm)}</td>
                    <td>
                      {highlightMatch(student.studentName || student.name || 'N/A', searchTerm)}
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
                    </td>
                    <td>
                      {student.isPaused ? (
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          background: 'rgba(255, 107, 107, 0.15)',
                          color: '#ff6b6b',
                          border: '1px solid rgba(255, 107, 107, 0.3)',
                          fontWeight: 'bold'
                        }}>
                          PAUSED
                        </span>
                      ) : (
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
                      )}
                    </td>
                    <td className="action-btns" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button 
                        className="edit-btn"
                        onClick={() => setSelectedStudentForView(student)}
                        style={{
                          background: 'rgba(212, 175, 55, 0.15)',
                          border: '1px solid #d4af37',
                          color: '#d4af37',
                          cursor: 'pointer'
                        }}
                      >
                        View
                      </button>
                      {student.isPaused ? (
                        <span style={{ color: '#ff6b6b', fontSize: '0.85rem', alignSelf: 'center', paddingLeft: '8px', fontWeight: 'bold' }}>
                          ⏸️ Account Paused
                        </span>
                      ) : (
                        <>
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
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Student Details Modal */}
      {selectedStudentForView && (() => {
        const detailRow = (label, value) => (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            <span style={{ color: '#fff', fontWeight: '600' }}>{value || 'N/A'}</span>
          </div>
        );
        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000,
            padding: '1rem'
          }} onClick={() => setSelectedStudentForView(null)}>
            <div style={{
              background: '#15151a', width: '100%', maxWidth: '500px',
              borderRadius: '15px', border: '1px solid rgba(212,175,55,0.3)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)', overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>
              <div style={{
                padding: '1.25rem 1.5rem', background: 'rgba(212,175,55,0.1)',
                borderBottom: '1px solid rgba(212,175,55,0.2)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <h3 style={{ margin: 0, color: '#d4af37', fontSize: '1.25rem' }}>Student Profile Details</h3>
                <button onClick={() => setSelectedStudentForView(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎓</div>
                  <h2 style={{ margin: 0, color: '#fff' }}>{selectedStudentForView.studentName || selectedStudentForView.name}</h2>
                  <span style={{ color: '#d4af37', fontWeight: '700' }}>#{selectedStudentForView.studentId}</span>
                </div>
                
                {detailRow('Full Name', selectedStudentForView.studentName || selectedStudentForView.name)}
                {detailRow('Email Address', selectedStudentForView.email)}
                {detailRow('Phone Number', selectedStudentForView.phoneNumber || selectedStudentForView.phone || selectedStudentForView.whatsappNo)}
                {detailRow('Date of Birth', selectedStudentForView.dateOfBirth || selectedStudentForView.dob)}
                {detailRow('Chess Level', selectedStudentForView.chessExperience || selectedStudentForView.level)}
                {detailRow('Registration Date', selectedStudentForView.approvedDate || (selectedStudentForView.createdAt ? new Date(selectedStudentForView.createdAt).toLocaleDateString() : 'N/A'))}
                {detailRow('School / College', selectedStudentForView.school)}
                {detailRow('Gender', selectedStudentForView.gender)}
                {detailRow('FIDE ID', selectedStudentForView.fideId && String(selectedStudentForView.fideId).trim() ? selectedStudentForView.fideId : 'N/A')}
                {detailRow('FIDE Rating', selectedStudentForView.fideRating && String(selectedStudentForView.fideRating).trim() ? selectedStudentForView.fideRating : 'N/A')}
                {detailRow('Parent Name', selectedStudentForView.parentName)}
                {detailRow('Parent Occupation', selectedStudentForView.parentOccupation)}
                
                <div style={{ marginTop: '1.5rem' }}>
                   <span style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Address</span>
                   <p style={{ color: '#fff', fontSize: '0.95rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', lineHeight: '1.6', border: '1px solid rgba(255,255,255,0.05)' }}>
                     {selectedStudentForView.address || 'No address provided.'}
                   </p>
                </div>
              </div>
              <div style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                <button onClick={() => setSelectedStudentForView(null)} style={{
                  padding: '0.6rem 2rem', background: '#d4af37', color: '#000',
                  border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer'
                }}>Close Details</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default FeesManager;
