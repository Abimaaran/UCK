import React, { useState, useEffect } from 'react';
import api, { getCollection, updateItem } from '../../services/api';

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

const formatDOB = (dobStr) => {
  if (!dobStr) return 'N/A';
  const str = String(dobStr).trim();
  if (str.includes('-')) {
    const parts = str.split('T')[0].split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
  }
  return str;
};

const formatSentTime = (item, reminderLog) => {
  if (!item) return 'N/A';

  // 1. If explicit ISO timestamp exists
  if (item.sentAt) {
    const d = new Date(item.sentAt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    }
  }

  // 2. If item.time is already a full ISO date string
  if (item.time && (item.time.includes('T') || item.time.includes('-'))) {
    const d = new Date(item.time);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    }
  }

  // 3. If item.time is a time string like "06:02:54 AM" or "06:02 AM"
  if (item.time && reminderLog?.startedAt) {
    try {
      const startedDate = new Date(reminderLog.startedAt);
      if (!isNaN(startedDate.getTime())) {
        const timeMatch = item.time.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
          const ampm = timeMatch[4] ? timeMatch[4].toUpperCase() : null;

          if (ampm === 'PM' && hours < 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;

          // If the hour closely matches startedDate.getUTCHours() (within 2 hours),
          // it was recorded in UTC server-side without timezone offset.
          const utcHours = startedDate.getUTCHours();
          if (Math.abs(hours - utcHours) <= 2) {
            const utcDate = new Date(Date.UTC(
              startedDate.getUTCFullYear(),
              startedDate.getUTCMonth(),
              startedDate.getUTCDate(),
              hours,
              minutes,
              seconds
            ));
            return utcDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
          }
        }
      }
    } catch (e) {
      console.warn('formatSentTime fallback error:', e);
    }
    return item.time;
  }

  if (reminderLog?.startedAt) {
    const d = new Date(reminderLog.startedAt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    }
  }

  return item.time || 'N/A';
};

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
  const [waErrorMsg, setWaErrorMsg] = useState(null);
  const [waSeconds, setWaSeconds] = useState(0);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [selectedStudentForView, setSelectedStudentForView] = useState(null);
  const [reminderLog, setReminderLog] = useState(null);
  const [logModalType, setLogModalType] = useState(null); // 'SUCCESS' | 'FAILED' | 'ALL' | null
  const [logModalSearch, setLogModalSearch] = useState('');
  const [embeddedFilter, setEmbeddedFilter] = useState('ALL'); // 'ALL' | 'SUCCESS' | 'FAILED'
  const [embeddedSearch, setEmbeddedSearch] = useState('');
  const [showReportTable, setShowReportTable] = useState(false);

  // Lock background page scroll when modal is open
  useEffect(() => {
    if (logModalType || selectedStudentForView) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [logModalType, selectedStudentForView]);

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
        setApprovedStudents(Array.isArray(studentData) ? studentData.filter(s => s.status === 'Approved' && !s.isPaused) : []);
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

  const handleMarkAllPaid = async () => {
    if (!window.confirm(`Are you sure you want to mark ALL active students as PAID for ${getMonthName(selectedMonth)}?`)) {
      return;
    }

    try {
      const response = await api.post('/fees/mark-all-paid', { month: selectedMonth });
      alert(response.data.message || "All active students marked as Paid successfully!");

      // Local state bulk update
      const newFees = { ...fees };
      approvedStudents.forEach(s => {
        if (!s.isPaused) {
          if (!newFees[s.studentId]) newFees[s.studentId] = {};
          newFees[s.studentId][selectedMonth] = 'Paid';
        }
      });
      setFees(newFees);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to mark all as paid.");
    }
  };

  const handleClearAllForMonth = async () => {
    const monthName = getMonthName(selectedMonth);
    if (!window.confirm(`Are you sure you want to CLEAR ALL recorded fees for ${monthName}? This will reset all students to Not Paid for ${monthName} only.`)) {
      return;
    }

    try {
      const response = await api.post('/fees/clear-all', { month: selectedMonth });
      alert(response.data.message || `All recorded fees for ${monthName} have been cleared successfully!`);

      // Local state update: remove this month's fee record for all students
      const newFees = { ...fees };
      Object.keys(newFees).forEach(sid => {
        if (newFees[sid] && newFees[sid][selectedMonth]) {
          delete newFees[sid][selectedMonth];
        }
      });
      setFees(newFees);

      // If active reminderLog is for this month, reset it too
      if (reminderLog && reminderLog.month === selectedMonth) {
        setReminderLog(null);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to clear fees for the selected month.");
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
              <span>💬</span> WhatsApp Reminder Service
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#888' }}>
              Send instant WhatsApp fee reminders to unpaid students for the selected month by clicking the Send button.
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
              border: `1px solid ${waStatus === 'CONNECTED' ? '#25D366' :
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
                boxShadow: `0 0 8px ${waStatus === 'CONNECTED' ? '#25D366' :
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

            {waStatus !== 'CONNECTED' && waStatus !== 'QR_READY' && (
              <button
                onClick={async () => {
                  try {
                    setWaStatus('LOADING');
                    setWaErrorMsg(null);
                    setWaSeconds(0);

                    // Start live 1-second timer
                    const secTimer = setInterval(() => {
                      setWaSeconds(prev => prev + 1);
                    }, 1000);

                    await api.post('/whatsapp/connect').catch(err => {
                      if (err.response?.data?.error) {
                        setWaErrorMsg(err.response.data.error);
                      }
                      return null;
                    });

                    let attempts = 0;
                    const pollQr = async () => {
                      try {
                        const res = await api.get('/whatsapp/status');
                        setWaStatus(res.data.status);
                        if (res.data.error) {
                          setWaErrorMsg(res.data.error);
                        }
                        if (res.data.status === 'QR_READY') {
                          const qrData = res.data.qr || (await api.get('/whatsapp/qr').catch(() => ({})))?.data?.qr;
                          if (qrData) {
                            setWaQr(qrData);
                            setWaErrorMsg(null);
                            clearInterval(secTimer);
                            return true;
                          }
                        }
                        return false;
                      } catch (e) {
                        setWaErrorMsg(e.response?.data?.error || e.message);
                        return false;
                      }
                    };

                    const isReady = await pollQr();
                    if (!isReady) {
                      const interval = setInterval(async () => {
                        attempts++;
                        const ready = await pollQr();
                        if (ready || attempts > 30) {
                          clearInterval(interval);
                          clearInterval(secTimer);
                          if (!ready) {
                            setWaStatus('DISCONNECTED');
                            setWaErrorMsg('QR Code generation timed out (90s). Click Connect WhatsApp QR to try again.');
                          }
                        }
                      }, 3000);
                    }
                  } catch (e) {
                    setWaStatus('DISCONNECTED');
                    setWaErrorMsg(e.message || 'Failed to connect to WhatsApp service');
                  }
                }}
                style={{
                  background: 'rgba(255, 193, 7, 0.15)',
                  border: '1px solid #FFC107',
                  color: '#FFC107',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📲 Connect WhatsApp QR
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

        {(waStatus === 'LOADING' || waStatus === 'INITIALIZING') && (
          <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'rgba(0, 123, 255, 0.08)', border: '1px solid rgba(0, 123, 255, 0.25)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ color: '#64B5F6', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', animation: 'spin 1.5s linear infinite' }}>🤖</span>
                Starting WhatsApp Web Chromium...
              </span>
              <span style={{ background: '#007BFF', color: '#fff', padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {waSeconds}s / 90s
              </span>
            </div>

            {/* Live Progress Bar */}
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round((waSeconds / 90) * 100))}%`,
                  background: 'linear-gradient(90deg, #007BFF, #00E5FF)',
                  transition: 'width 0.3s ease-in-out'
                }}
              />
            </div>
          </div>
        )}

        {waErrorMsg && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(220, 53, 69, 0.15)', border: '1px solid #DC3545', color: '#FF6B6B', borderRadius: '8px', fontSize: '0.85rem' }}>
            ⚠️ <strong>WhatsApp Alert:</strong> {waErrorMsg}
          </div>
        )}
      </div>

      {/* WhatsApp Reminder Logs / Full Live Status Report Feed */}
      {reminderLog && (
        <div
          style={{
            background: 'rgba(18, 19, 24, 0.95)',
            border: `1px solid ${reminderLog.status === 'PROCESSING' ? 'rgba(0, 123, 255, 0.4)' :
                reminderLog.failCount > 0 ? 'rgba(220, 53, 69, 0.4)' :
                  'rgba(40, 167, 69, 0.4)'
              }`,
            borderRadius: '16px',
            padding: '1.75rem',
            marginBottom: '2.5rem',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Top Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📢</span> Monthly Fee Reminders Report ({getMonthName(reminderLog.month)})
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span>Started: <strong style={{ color: '#fff' }}>{new Date(reminderLog.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</strong></span>
                <span>|</span>
                <span>Mode: <strong style={{ color: '#d4af37' }}>{reminderLog.runType || 'Manual'}</strong></span>
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setShowReportTable(prev => !prev)}
                style={{
                  background: showReportTable ? 'rgba(212, 175, 55, 0.15)' : 'linear-gradient(135deg, #1877F2, #0d65d9)',
                  border: showReportTable ? '1px solid rgba(212, 175, 55, 0.5)' : '1px solid rgba(24, 119, 242, 0.4)',
                  color: showReportTable ? '#d4af37' : '#fff',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: showReportTable ? 'none' : '0 2px 10px rgba(24, 119, 242, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{showReportTable ? '▲' : '📋'}</span>
                <span>{showReportTable ? 'Hide Details' : 'Show Details'}</span>
              </button>

              <span style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                background:
                  reminderLog.status === 'PROCESSING' ? 'rgba(0, 123, 255, 0.15)' :
                    'rgba(40, 167, 69, 0.15)',
                color:
                  reminderLog.status === 'PROCESSING' ? '#007BFF' :
                    '#25D366',
                border: `1px solid ${reminderLog.status === 'PROCESSING' ? '#007BFF' :
                    '#25D366'
                  }`
              }}>
                ● {reminderLog.status}
              </span>

              {/* Close ✕ Button */}
              <button
                onClick={() => setReminderLog(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,53,69,0.3)'; e.currentTarget.style.borderColor = '#dc3545'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                title="Close Report"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Summary Filter Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: showReportTable ? '1.5rem' : '0.5rem' }}>
            <div
              onClick={() => {
                setEmbeddedFilter('ALL');
                setShowReportTable(true);
              }}
              style={{
                background: embeddedFilter === 'ALL' && showReportTable ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.02)',
                padding: '1rem',
                borderRadius: '12px',
                textAlign: 'center',
                cursor: 'pointer',
                border: `1px solid ${embeddedFilter === 'ALL' && showReportTable ? '#d4af37' : 'rgba(255,255,255,0.08)'}`,
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Targeted</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', margin: '2px 0' }}>{reminderLog.totalRecipients}</div>
              <span style={{ fontSize: '0.72rem', color: embeddedFilter === 'ALL' && showReportTable ? '#d4af37' : '#888', fontWeight: '600' }}>
                {showReportTable && embeddedFilter === 'ALL' ? 'Showing All List' : 'Show All List'}
              </span>
            </div>

            <div
              onClick={() => {
                setEmbeddedFilter('SUCCESS');
                setShowReportTable(true);
              }}
              style={{
                background: embeddedFilter === 'SUCCESS' && showReportTable ? 'rgba(37,211,102,0.18)' : 'rgba(40, 167, 69, 0.08)',
                padding: '1rem',
                borderRadius: '12px',
                textAlign: 'center',
                cursor: 'pointer',
                border: `1px solid ${embeddedFilter === 'SUCCESS' && showReportTable ? '#25D366' : 'rgba(40,167,69,0.3)'}`,
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#25D366', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>✅ Delivered</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#25D366', margin: '2px 0' }}>{reminderLog.successCount}</div>
              <span style={{ fontSize: '0.72rem', color: '#25D366', fontWeight: '600' }}>
                {showReportTable && embeddedFilter === 'SUCCESS' ? `Showing (${reminderLog.successCount})` : `Show Delivered (${reminderLog.successCount})`}
              </span>
            </div>

            <div
              onClick={() => {
                setEmbeddedFilter('FAILED');
                setShowReportTable(true);
              }}
              style={{
                background: embeddedFilter === 'FAILED' && showReportTable ? 'rgba(220,53,69,0.18)' : 'rgba(220, 53, 69, 0.08)',
                padding: '1rem',
                borderRadius: '12px',
                textAlign: 'center',
                cursor: 'pointer',
                border: `1px solid ${embeddedFilter === 'FAILED' && showReportTable ? '#dc3545' : 'rgba(220,53,69,0.3)'}`,
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#dc3545', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>❌ Failed</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#dc3545', margin: '2px 0' }}>{reminderLog.failCount}</div>
              <span style={{ fontSize: '0.72rem', color: '#dc3545', fontWeight: '600' }}>
                {showReportTable && embeddedFilter === 'FAILED' ? `Showing (${reminderLog.failCount})` : `Show Failed (${reminderLog.failCount})`}
              </span>
            </div>
          </div>

          {/* Processing Progress Indicator */}
          {reminderLog.status === 'PROCESSING' && (
            <div style={{ marginBottom: '1.5rem', background: 'rgba(0, 123, 255, 0.08)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(0, 123, 255, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64B5F6', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                <span>🚀 Live Progress: Sending WhatsApp Messages...</span>
                <span>{Math.round(((reminderLog.successCount + reminderLog.failCount) / reminderLog.totalRecipients) * 100)}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${((reminderLog.successCount + reminderLog.failCount) / reminderLog.totalRecipients) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #007BFF, #25D366)',
                  transition: 'width 0.3s ease-in-out'
                }} />
              </div>
            </div>
          )}

          {/* Collapsed State Bar when details table is hidden */}
          {!showReportTable && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => setShowReportTable(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#d4af37',
                  padding: '9px 24px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(212, 175, 55, 0.12)';
                  e.currentTarget.style.borderColor = '#d4af37';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                }}
              >
                <span>📋</span> Show Details
              </button>
            </div>
          )}

          {/* Detailed Table Section (Only shown when expanded) */}
          {showReportTable && (
            <>
              {/* Table Header Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <h5 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📋</span> Delivery Details ({embeddedFilter === 'ALL' ? 'All Students' : embeddedFilter})
                </h5>

                <div style={{ position: 'relative', minWidth: '260px' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search student name or phone..."
                    value={embeddedSearch}
                    onChange={e => setEmbeddedSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 2rem 0.5rem 0.85rem',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                  {embeddedSearch && (
                    <button
                      onClick={() => setEmbeddedSearch('')}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                    >✕</button>
                  )}
                </div>
              </div>

              {/* Embedded Full Table (No Height Restrictions, Clean Display) */}
              <div style={{ overflowX: 'auto' }}>
                {(() => {
                  let list = [];
                  if (embeddedFilter === 'SUCCESS') list = reminderLog.successList || [];
                  else if (embeddedFilter === 'FAILED') list = reminderLog.failList || [];
                  else {
                    list = [
                      ...(reminderLog.successList || []).map(item => ({ ...item, isSuccess: true })),
                      ...(reminderLog.failList || []).map(item => ({ ...item, isSuccess: false }))
                    ];
                  }

                  if (embeddedSearch.trim()) {
                    const query = embeddedSearch.toLowerCase();
                    list = list.filter(item =>
                      (item.name || '').toLowerCase().includes(query) ||
                      (item.studentId || '').toString().toLowerCase().includes(query) ||
                      (item.phone || '').includes(query)
                    );
                  }

                  if (list.length === 0) {
                    return (
                      <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#777' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                        <p style={{ margin: 0 }}>No delivery records match your selection.</p>
                      </div>
                    );
                  }

                  return (
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student ID</th>
                          <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Name</th>
                          <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</th>
                          <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sent Time</th>
                          <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((item, idx) => {
                          const isSuccess = embeddedFilter === 'SUCCESS' || (embeddedFilter === 'ALL' && item.isSuccess);
                          const sentTimestamp = formatSentTime(item, reminderLog);

                          return (
                            <tr
                              key={idx}
                              style={{
                                background: 'rgba(255,255,255,0.025)',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                            >
                              <td style={{ padding: '0.85rem 1rem', fontSize: '0.88rem', color: '#d4af37', fontWeight: 'bold', borderRadius: '8px 0 0 8px' }}>
                                #{item.studentId}
                              </td>
                              <td style={{ padding: '0.85rem 1rem', fontSize: '0.9rem', color: '#fff', fontWeight: '600' }}>
                                {item.name}
                              </td>
                              <td style={{ padding: '0.85rem 1rem', fontSize: '0.88rem', color: '#ccc' }}>
                                {formatDisplayPhone(item.phone)}
                              </td>
                              <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#25D366', fontWeight: '600', fontFamily: 'monospace' }}>
                                ⏰ {sentTimestamp}
                              </td>
                              <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', borderRadius: '0 8px 8px 0' }}>
                                {isSuccess ? (
                                  <span style={{ color: '#25D366', background: 'rgba(37,211,102,0.12)', padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(37,211,102,0.3)', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    ✅ Sent Successfully
                                  </span>
                                ) : (
                                  <span style={{ color: '#ff6b6b', background: 'rgba(220,53,69,0.12)', padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(220,53,69,0.3)', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    ❌ Failed: {item.error || 'Failed'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </>
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

        {/* Bulk Mark All Paid Button */}
        <div className="form-group" style={{ minWidth: '170px' }}>
          <label>Bulk Actions</label>
          <button
            onClick={handleMarkAllPaid}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid #d4af37',
              background: 'rgba(212, 175, 55, 0.15)',
              color: '#d4af37',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.3s ease',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(212, 175, 55, 0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)';
            }}
          >
            ✅ Mark All as Paid
          </button>
        </div>

        {/* Clear All for Selected Month */}
        <div className="form-group" style={{ minWidth: '150px' }}>
          <label>Clear Month</label>
          <button
            onClick={handleClearAllForMonth}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(220, 53, 69, 0.4)',
              background: 'rgba(220, 53, 69, 0.12)',
              color: '#ff6b6b',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.3s ease',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(220, 53, 69, 0.25)';
              e.currentTarget.style.borderColor = '#dc3545';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(220, 53, 69, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(220, 53, 69, 0.4)';
            }}
            title={`Clear all recorded fees for ${getMonthName(selectedMonth)} only`}
          >
            🗑️ Clear All
          </button>
        </div>

        {/* Send Reminders Trigger Button */}
        <div className="form-group" style={{ minWidth: '220px' }}>
          <label>WhatsApp Automation</label>
          <button
            onClick={handleSendReminders}
            disabled={sendingReminders}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid #25D366',
              background: 'rgba(37, 211, 102, 0.15)',
              color: '#25D366',
              fontWeight: 'bold',
              cursor: sendingReminders ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.3s ease',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(37, 211, 102, 0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(37, 211, 102, 0.15)';
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
                {detailRow('Phone Number', formatDisplayPhone(selectedStudentForView.phoneNumber || selectedStudentForView.phone || selectedStudentForView.whatsappNo))}
                {detailRow('Date of Birth', formatDOB(selectedStudentForView.dateOfBirth || selectedStudentForView.dob))}
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

      {/* WhatsApp Reminder Log Modal Popup */}
      {logModalType && reminderLog && (
        <div
          onClick={() => setLogModalType(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '1.25rem'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#121318',
              border: `1px solid ${logModalType === 'SUCCESS' ? 'rgba(37, 211, 102, 0.4)' :
                  logModalType === 'FAILED' ? 'rgba(220, 53, 69, 0.4)' :
                    'rgba(212, 175, 55, 0.4)'
                }`,
              borderRadius: '18px',
              width: '92%',
              maxWidth: '920px',
              height: '86vh',
              maxHeight: '750px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.75rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              background:
                logModalType === 'SUCCESS' ? 'linear-gradient(135deg, rgba(37,211,102,0.12), rgba(0,0,0,0))' :
                  logModalType === 'FAILED' ? 'linear-gradient(135deg, rgba(220,53,69,0.12), rgba(0,0,0,0))' :
                    'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(0,0,0,0))'
            }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {logModalType === 'SUCCESS' && <span>✅ Sent WhatsApp Reminders ({reminderLog.successCount})</span>}
                  {logModalType === 'FAILED' && <span>❌ Failed WhatsApp Deliveries ({reminderLog.failCount})</span>}
                  {logModalType === 'ALL' && <span>📢 All Targeted Recipients ({reminderLog.totalRecipients})</span>}
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>Month: <strong style={{ color: '#d4af37' }}>{getMonthName(reminderLog.month)}</strong></span>
                  <span>|</span>
                  <span>Started: <strong style={{ color: '#fff' }}>{new Date(reminderLog.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</strong></span>
                  <span>|</span>
                  <span>Status: <strong style={{ color: reminderLog.status === 'PROCESSING' ? '#007BFF' : '#25D366' }}>{reminderLog.status}</strong></span>
                </p>
              </div>

              <button
                onClick={() => setLogModalType(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,53,69,0.3)'; e.currentTarget.style.borderColor = '#dc3545'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              >
                ✕
              </button>
            </div>

            {/* Sub-filter Tabs & Search Bar Header */}
            <div style={{ padding: '1rem 1.75rem 0.5rem 1.75rem', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Inner Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { key: 'ALL', label: 'All Recipients', count: reminderLog.totalRecipients },
                  { key: 'SUCCESS', label: '✅ Sent', count: reminderLog.successCount },
                  { key: 'FAILED', label: '❌ Failed', count: reminderLog.failCount }
                ].map(tab => {
                  const isActive = logModalType === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setLogModalType(tab.key)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: isActive ? '700' : '500',
                        border: `1px solid ${isActive ? '#d4af37' : 'rgba(255,255,255,0.1)'}`,
                        background: isActive ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.03)',
                        color: isActive ? '#d4af37' : '#aaa',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div style={{ position: 'relative', width: '280px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search student name, ID or phone..."
                  value={logModalSearch}
                  onChange={e => setLogModalSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 2rem 0.45rem 0.85rem',
                    borderRadius: '7px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    fontSize: '0.82rem'
                  }}
                />
                {logModalSearch && (
                  <button
                    onClick={() => setLogModalSearch('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#aaa',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Modal Scrollable Content Container */}
            <div
              style={{
                padding: '1rem 1.75rem 1.5rem 1.75rem',
                overflowY: 'auto',
                flex: 1
              }}
            >
              {(() => {
                let list = [];
                if (logModalType === 'SUCCESS') list = reminderLog.successList || [];
                else if (logModalType === 'FAILED') list = reminderLog.failList || [];
                else if (logModalType === 'ALL') {
                  list = [
                    ...(reminderLog.successList || []).map(item => ({ ...item, isSuccess: true })),
                    ...(reminderLog.failList || []).map(item => ({ ...item, isSuccess: false }))
                  ];
                }

                if (logModalSearch.trim()) {
                  const query = logModalSearch.toLowerCase();
                  list = list.filter(item =>
                    (item.name || '').toLowerCase().includes(query) ||
                    (item.studentId || '').toString().toLowerCase().includes(query) ||
                    (item.phone || '').includes(query)
                  );
                }

                if (list.length === 0) {
                  return (
                    <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#777' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: '#aaa' }}>No Records Found</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>No student delivery records match the current filter criteria.</p>
                    </div>
                  );
                }

                return (
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <th style={{ padding: '0.75rem 0.85rem', fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID</th>
                        <th style={{ padding: '0.75rem 0.85rem', fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Name</th>
                        <th style={{ padding: '0.75rem 0.85rem', fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</th>
                        <th style={{ padding: '0.75rem 0.85rem', fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sent Time</th>
                        <th style={{ padding: '0.75rem 0.85rem', fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((item, idx) => {
                        const isSuccess = logModalType === 'SUCCESS' || (logModalType === 'ALL' && item.isSuccess);
                        const sentTimestamp = formatSentTime(item, reminderLog);

                        return (
                          <tr
                            key={idx}
                            style={{
                              background: 'rgba(255,255,255,0.02)',
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          >
                            <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.85rem', color: '#d4af37', fontWeight: 'bold', borderRadius: '8px 0 0 8px' }}>
                              #{item.studentId}
                            </td>
                            <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.88rem', color: '#fff', fontWeight: '600' }}>
                              {item.name}
                            </td>
                            <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.85rem', color: '#bbb' }}>
                              {formatDisplayPhone(item.phone)}
                            </td>
                            <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.82rem', color: '#25D366', fontWeight: '500', fontFamily: 'monospace' }}>
                              ⏰ {sentTimestamp}
                            </td>
                            <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.8rem', borderRadius: '0 8px 8px 0' }}>
                              {isSuccess ? (
                                <span style={{ color: '#25D366', background: 'rgba(37,211,102,0.12)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(37,211,102,0.3)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  ✅ Sent Successfully
                                </span>
                              ) : (
                                <span style={{ color: '#ff6b6b', background: 'rgba(220,53,69,0.12)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(220,53,69,0.3)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  ❌ Failed: {item.error || 'Failed'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesManager;
