import React, { useState, useEffect } from 'react';
import { getCollection, createItem, updateItem, deleteItem } from '../../services/api';

/* ═══════════════════════════════════════════════════════════
   API Helpers 
   ═══════════════════════════════════════════════════════════ */
const approveStudentApi = async (studentId, studentData) => {
  // we could move a student from pending to approved by updating their status via API
  return await updateItem('students', studentData.id, { ...studentData, studentId, status: 'Approved', approvedDate: new Date().toISOString().split('T')[0] });
};

const declineStudentApi = async (studentId) => {
  return await updateItem('students', studentId, { status: 'Declined', declinedDate: new Date().toISOString().split('T')[0] });
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const StudentApprovalManager = ({ students, setStudents }) => {
  const [view, setView] = useState('approved'); // 'approved' | 'pending' | 'declined' | 'add'
  const [refresh, setRefresh] = useState(0);
  const [viewingStudent, setViewingStudent] = useState(null);

  const refresh_ = () => setRefresh(r => r + 1);

  return (
    <div className="manager-container">
      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { key: 'approved', label: '✅ Approved Students' },
          { key: 'pending', label: '⏳ Pending Approvals', count: students.length },
          { key: 'declined', label: '❌ Declined Registrations' },
          { key: 'add', label: '➕ Add Student Manually' },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              border: `1px solid ${view === key ? '#d4af37' : 'rgba(255,255,255,0.12)'}`,
              background: view === key ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
              color: view === key ? '#d4af37' : '#aaa',
              fontWeight: view === key ? '700' : '400',
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.2s',
            }}
          >
            {label}{count !== undefined ? ` (${count})` : ''}
          </button>
        ))}
      </div>

      {view === 'pending' && <PendingTab students={students} setStudents={setStudents} onRefresh={refresh_} setViewingStudent={setViewingStudent} />}
      {view === 'add' && <ManualAddTab onRefresh={refresh_} />}
      {view === 'approved' && <ApprovedTab key={refresh} onRefresh={refresh_} setViewingStudent={setViewingStudent} />}
      {view === 'declined' && <DeclinedTab students={students} setStudents={setStudents} onRefresh={refresh_} setViewingStudent={setViewingStudent} />}

      {viewingStudent && (
        <StudentDetailsModal
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   PENDING APPROVALS TAB
═══════════════════════════════════════════════════════════ */
const PendingTab = ({ students, setStudents, onRefresh, setViewingStudent }) => {
  const [customIds, setCustomIds] = useState({});
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
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
    if (level === 'All') return students.length;
    return students.filter(s => getStudentLevel(s) === level).length;
  };

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

  const filteredPending = students.filter(student => {
    const studentName = (student.studentName || student.name || '').toLowerCase();
    const studentIdStr = (student.studentId || '').toString().toLowerCase();

    const matchesSearch = studentName.includes(searchTerm.toLowerCase()) ||
      studentIdStr.includes(searchTerm.toLowerCase());

    const matchesLevel = selectedLevel === 'All' || getStudentLevel(student) === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  const sortedStudents = [...filteredPending].sort((a, b) => {
    let valA = '';
    let valB = '';

    if (sortBy === 'name') {
      valA = a.studentName || a.name || '';
      valB = b.studentName || b.name || '';
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else if (sortBy === 'time') {
      valA = a.createdAt || a.appliedDate || '';
      valB = b.createdAt || b.appliedDate || '';
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return 0;
  });

  const handleApprove = async (student) => {
    const rawId = customIds[student.id] || student.id; // fallback to original id if no custom ID
    if (!rawId || !String(rawId).trim()) {
      alert('⚠️ Required: Please assign a UCK Student ID (e.g. uck01) before approving the registration.');
      return;
    }
    const studentId = String(rawId).trim();

    try {
      await approveStudentApi(studentId, student);
      setStudents(students.filter(s => s.id !== student.id));
      onRefresh();

      alert(
        `✅ Student Approved!\n\n` +
        `Name : ${student.studentName || student.name || 'N/A'}\n` +
        `──────────────────────────────\n` +
        `🪪  USERNAME (Student ID) : ${studentId}\n` +
        `🔑  PASSWORD : (Chosen during registration)\n` +
        `──────────────────────────────\n` +
        `The student can now log in with their custom Student ID.`
      );
    } catch (err) {
      alert("Failed to approve student. The ID might be taken.");
    }
  };

  const handleDecline = async (student) => {
    if (window.confirm(`Decline registration for ${student.name}?`)) {
      try {
        await declineStudentApi(student.id);
        setStudents(students.filter(s => s.id !== student.id));
        onRefresh();
      } catch (err) {
        alert("Failed to decline student.");
      }
    }
  };

  return (
    <>
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
      <InfoBanner text="Enter a custom Student ID for each student before clicking Approve. Ensure they have their chosen password ready for login." />
      
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

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ minWidth: '250px', flex: '1' }}>
          <label>Search Student Name</label>
          <input
            type="text"
            placeholder="Search pending students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Sorting Control Bar */}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ color: '#aaa', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort Pending By:</span>
        {[
          { key: 'name', label: '🔤 Name (A-Z)' },
          { key: 'time', label: '📅 Applied Date' }
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
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Level</th>
              <th>Applied</th>
              <th>Assign ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No pending registrations matching criteria
                </td>
              </tr>
            ) : (
              sortedStudents.map(student => (
                <tr key={student.id}>
                  <td style={{ fontWeight: '600', minWidth: '140px' }}>{highlightMatch(student.studentName || student.name || 'N/A', searchTerm)}</td>
                  <td style={{ minWidth: '180px' }}>{student.email}</td>
                  <td style={{ minWidth: '110px' }}>{student.phoneNumber || student.whatsappNo || student.phone || 'N/A'}</td>
                  <td style={{ fontSize: '0.85rem', minWidth: '220px', whiteSpace: 'normal', lineHeight: '1.4' }}>{student.address || 'N/A'}</td>
                  <td style={{ minWidth: '110px' }}>{getStudentLevel(student)}</td>
                  <td style={{ fontSize: '0.85rem', minWidth: '100px' }}>{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : (student.appliedDate || 'N/A')}</td>
                  <td>
                    <input
                      type="text"
                      placeholder="SID"
                      value={customIds[student.id] || ''}
                      onChange={e => setCustomIds({ ...customIds, [student.id]: e.target.value })}
                      style={{
                        width: '100px',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '5px',
                        border: '2px solid rgba(212,175,55,0.6)',
                        background: 'rgba(212,175,55,0.05)',
                        color: '#fff',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        textAlign: 'center'
                      }}
                    />
                  </td>
                  <td className="action-btns">
                    <button className="view-btn" onClick={() => setViewingStudent(student)}>View</button>
                    <button className="approve-btn" onClick={() => handleApprove(student)}>Approve</button>
                    <button className="delete-btn" onClick={() => handleDecline(student)}>Decline</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   MANUAL ADD TAB
═══════════════════════════════════════════════════════════ */
const ManualAddTab = ({ onRefresh }) => {
  const [form, setForm] = useState({
    studentId: '',
    name: '',
    email: '',
    dob: '',
    level: 'Beginner',
    phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.studentId.trim()) { setError('Student ID is required.'); return; }
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (!form.dob) { setError('Date of Birth is required (used as portal password).'); return; }

    try {
      await createItem('students', {
        studentId: form.studentId.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        dob: form.dob,
        level: form.level,
        phone: form.phone.trim(),
        status: 'Approved',
        approvedDate: new Date().toISOString().split('T')[0],
      });
      onRefresh();
      setSuccess(`Student added! Credentials — Username: ${form.studentId.trim()} | Password: ${form.dob}`);
      setForm({ studentId: '', name: '', email: '', dob: '', level: 'Beginner', phone: '' });
    } catch (err) {
      setError(`Failed to add student. The ID may already be in use.`);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.65rem 0.9rem',
    borderRadius: '7px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: '#e8e8e8',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.78rem',
    color: '#aaa',
    marginBottom: '0.35rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  };

  return (
    <div style={{ maxWidth: '620px' }}>
      <InfoBanner text="Manually add a student with a custom Student ID. They should use their provided password to log in once approved." />

      {error && (
        <div style={{
          background: 'rgba(220,53,69,0.15)', border: '1px solid rgba(220,53,69,0.4)',
          borderRadius: '7px', padding: '0.7rem 1rem', color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.85rem'
        }}>
          ❌ {error}
        </div>
      )}
      {success && (
        <div style={{
          background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.4)',
          borderRadius: '7px', padding: '0.7rem 1rem', color: '#a0e4a0', marginBottom: '1rem', fontSize: '0.85rem'
        }}>
          ✅ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Student ID — full width, admin-defined */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>
            🪪 Student ID <span style={{ color: '#d4af37' }}>(you define this — it becomes the username)</span>
          </label>
          <input name="studentId" value={form.studentId} onChange={handle}
            placeholder="e.g. 1005" style={{ ...inputStyle, borderColor: 'rgba(212,175,55,0.45)', fontWeight: '700', fontSize: '1rem' }} required />
        </div>

        {/* Name */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Full Name</label>
          <input name="name" value={form.name} onChange={handle}
            placeholder="Student full name" style={inputStyle} required />
        </div>

        {/* Email */}
        <div>
          <label style={labelStyle}>Email Address</label>
          <input name="email" type="email" value={form.email} onChange={handle}
            placeholder="student@example.com" style={inputStyle} />
        </div>

        {/* Phone */}
        <div>
          <label style={labelStyle}>Phone Number</label>
          <input name="phone" value={form.phone} onChange={handle}
            placeholder="+94" style={inputStyle} />
        </div>

        {/* DOB — password */}
        <div>
          <label style={labelStyle}>
            🔑 Date of Birth <span style={{ color: '#d4af37' }}>(becomes portal password)</span>
          </label>
          <input name="dob" type="date" value={form.dob} onChange={handle} style={inputStyle} required />
        </div>

        {/* Level */}
        <div>
          <label style={labelStyle}>Level</label>
          <select name="level" value={form.level} onChange={handle}
            style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="Beginner" style={{ background: '#15151a', color: '#fff' }}>Beginner</option>
            <option value="Intermediate" style={{ background: '#15151a', color: '#fff' }}>Intermediate</option>
            <option value="Advanced" style={{ background: '#15151a', color: '#fff' }}>Advanced</option>
          </select>
        </div>

        {/* Submit */}
        <div style={{ gridColumn: '1 / -1' }}>
          <button type="submit" style={{
            width: '100%',
            padding: '0.75rem',
            background: 'linear-gradient(135deg, #d4af37, #b8960c)',
            color: '#0a0a0a',
            fontWeight: '700',
            fontSize: '0.95rem',
            borderRadius: '7px',
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}>
            ➕ Add Student &amp; Generate Credentials
          </button>
        </div>
      </form>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   APPROVED STUDENTS TABLE
═══════════════════════════════════════════════════════════ */
const ApprovedTab = ({ onRefresh, setViewingStudent }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [approved, setApproved] = useState([]);
  const [sortBy, setSortBy] = useState('studentId');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');

  useEffect(() => {
    const fetchApproved = async () => {
      try {
        const allStudents = await getCollection('students');
        setApproved(allStudents.filter(s => s.status === 'Approved'));
      } catch (err) {
        console.error(err);
      }
    };
    fetchApproved();
  }, [onRefresh]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
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
    if (level === 'All') return approved.length;
    return approved.filter(s => getStudentLevel(s) === level).length;
  };

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

  const filteredApproved = approved.filter(student => {
    const studentName = (student.studentName || student.name || '').toLowerCase();
    const studentIdStr = (student.studentId || '').toString().toLowerCase();

    const matchesSearch = studentName.includes(searchTerm.toLowerCase()) ||
      studentIdStr.includes(searchTerm.toLowerCase());

    const matchesLevel = selectedLevel === 'All' || getStudentLevel(student) === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  const sortedApproved = [...filteredApproved].sort((a, b) => {
    let valA = '';
    let valB = '';

    if (sortBy === 'studentId') {
      valA = a.studentId || '';
      valB = b.studentId || '';
      // Natural sorting for ID prefixes (e.g. UCK10 vs UCK2)
      const numA = parseInt(valA.replace(/\D/g, ''), 10);
      const numB = parseInt(valB.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else if (sortBy === 'name') {
      valA = a.studentName || a.name || '';
      valB = b.studentName || b.name || '';
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else if (sortBy === 'time') {
      valA = a.approvedDate || a.createdAt || '';
      valB = b.approvedDate || b.createdAt || '';
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return 0;
  });

  const handleTogglePause = async (student) => {
    const confirmMsg = student.isPaused 
      ? `Are you sure you want to resume ${student.studentName || student.name || 'this student'}?`
      : `Are you sure you want to pause ${student.studentName || student.name || 'this student'}?`;
      
    if (window.confirm(confirmMsg)) {
      try {
        await updateItem('students', student.id || student._id, {
          ...student,
          isPaused: !student.isPaused
        });
        onRefresh();
      } catch (err) {
        console.error("Failed to toggle pause status:", err);
        alert("Could not update student status.");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete student #${id}? This action cannot be undone.`)) {
      try {
        // Here id might be db id or custom studentId depending on backend mapping.
        // Assuming your backend uses the MongoDB ID for actual document deletion (`student.id` typically maps to `_id`).
        // We will need the actual DB document _id, let's assume `id` here is the `_id`/`id` field of the user document.
        const stud = approved.find(s => s.studentId === id || s.id === id);
        if (stud) await deleteItem('students', stud.id || stud._id);
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const startEdit = (student) => {
    const targetId = student.id || student._id || student.studentId;
    setEditingId(targetId);
    setEditForm({ 
      ...student,
      studentName: student.studentName || student.name || '',
      phoneNumber: student.phoneNumber || student.phone || student.whatsappNo || '',
      dateOfBirth: student.dateOfBirth || student.dob || '',
      chessExperience: student.chessExperience || student.level || 'Beginner level',
      school: student.school || '',
      parentName: student.parentName || '',
      parentOccupation: student.parentOccupation || '',
      address: student.address || '',
      fideId: student.fideId || '',
      fideRating: student.fideRating || ''
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber' || name === 'phone') {
      setEditForm({ ...editForm, phoneNumber: value, phone: value });
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const saveEdit = async () => {
    try {
      const id = editingId;
      if (!id) {
        alert("Cannot update student: Student ID is missing.");
        return;
      }
      await updateItem('students', id, editForm);
      
      const newPhone = editForm.phoneNumber || editForm.phone;

      // Instantly update local UI state
      setApproved(prev => prev.map(s => {
        if ((s.id || s._id || s.studentId) === id) {
          return { 
            ...s, 
            ...editForm,
            phone_number: newPhone,
            phone: newPhone,
            phoneNumber: newPhone 
          };
        }
        return s;
      }));

      setEditingId(null);
      alert("✅ Student details updated successfully!");
      onRefresh();
    } catch (err) {
      console.error("Failed to save edit:", err);
      alert(err.response?.data?.error || err.message || "Failed to update student details.");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <>
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
      <InfoBanner text="All approved / manually added students with their portal credentials. You can edit their details or remove them from the system." />
      
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

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ minWidth: '250px', flex: '1' }}>
          <label>Search Student Name or ID</label>
          <input
            type="text"
            placeholder="Search approved students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Sorting Control Bar */}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ color: '#aaa', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort Approved Students By:</span>
        {[
          { key: 'studentId', label: '🪪 Student ID' },
          { key: 'name', label: '🔤 Name (A-Z)' },
          { key: 'time', label: '📅 Approved Date' }
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
              <th>Student ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>DOB</th>
              <th>Level</th>
              <th>Approved</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedApproved.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No approved students matching criteria
                </td>
              </tr>
            ) : (
              sortedApproved.map(s => {
                const sId = s.id || s._id || s.studentId;
                const isEditing = editingId === sId;
                return (
                  <tr key={sId}>
                    <td>
                      {isEditing ? (
                        <input name="studentId" value={editForm.studentId} onChange={handleEditChange} style={{ ...miniInput, fontWeight: '700', color: '#d4af37' }} />
                      ) : (
                        <strong style={{ color: '#d4af37' }}>#{highlightMatch(s.studentId, searchTerm)}</strong>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input name="studentName" value={editForm.studentName || editForm.name} onChange={handleEditChange} style={miniInput} />
                      ) : (
                        <span>
                          {highlightMatch(s.studentName || s.name || 'N/A', searchTerm)}
                          {s.isPaused && (
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
                              ⏸️ Paused
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input name="email" value={editForm.email} onChange={handleEditChange} style={miniInput} />
                      ) : s.email}
                    </td>
                    <td>
                      {isEditing ? (
                        <input name="phoneNumber" value={editForm.phoneNumber || editForm.phone} onChange={handleEditChange} style={{ ...miniInput, color: '#FFC107', fontWeight: 'bold' }} />
                      ) : <span style={{ color: '#FFC107', fontWeight: '600' }}>{s.phoneNumber || s.phone || s.whatsappNo || 'N/A'}</span>}
                    </td>
                    <td>
                      {isEditing ? (
                        <input name="dob" value={editForm.dateOfBirth || editForm.dob} onChange={handleEditChange} style={miniInput} />
                      ) : <span style={{ fontFamily: 'monospace', color: '#a0e4a0' }}>{s.dateOfBirth || s.dob || 'N/A'}</span>}
                    </td>
                    <td>
                      {isEditing ? (
                        <select name="chessExperience" value={editForm.chessExperience || editForm.level} onChange={handleEditChange} style={miniInput}>
                          <option value="Beginner level" style={{ background: '#15151a', color: '#fff' }}>Beginner</option>
                          <option value="Intermediate level" style={{ background: '#15151a', color: '#fff' }}>Intermediate</option>
                          <option value="Advanced level" style={{ background: '#15151a', color: '#fff' }}>Advanced</option>
                        </select>
                      ) : (s.chessExperience || s.level || 'N/A')}
                    </td>
                    <td>{s.approvedDate || (s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : 'N/A')}</td>
                    <td className="action-btns">
                      {isEditing ? (
                        <>
                          <button className="approve-btn" onClick={saveEdit}>Save</button>
                          <button className="delete-btn" onClick={cancelEdit}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="view-btn" onClick={() => setViewingStudent(s)}>View</button>
                          <button className="edit-btn" onClick={() => startEdit(s)}>Edit</button>
                          <button 
                            className={s.isPaused ? "approve-btn" : "delete-btn"} 
                            style={{ 
                              background: s.isPaused ? 'rgba(76,175,80,0.15)' : 'rgba(255,107,107,0.15)',
                              color: s.isPaused ? '#a0e4a0' : '#ff6b6b',
                              border: s.isPaused ? '1px solid rgba(76,175,80,0.4)' : '1px solid rgba(255,107,107,0.4)',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleTogglePause(s)}
                          >
                            {s.isPaused ? "▶️ Resume" : "⏸️ Pause"}
                          </button>
                          <button className="delete-btn" onClick={() => handleDelete(s.id || s._id || s.studentId)}>Delete</button>
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
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   DECLINED REGISTRATIONS TAB
═══════════════════════════════════════════════════════════ */
const DeclinedTab = ({ students, setStudents, onRefresh, setViewingStudent }) => {
  const [declined, setDeclined] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');

  useEffect(() => {
    const fetchDeclined = async () => {
      try {
        const allStudents = await getCollection('students');
        setDeclined(allStudents.filter(s => s.status === 'Declined'));
      } catch (err) {
        console.error(err);
      }
    };
    fetchDeclined();
  }, [onRefresh]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
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
    if (level === 'All') return declined.length;
    return declined.filter(s => getStudentLevel(s) === level).length;
  };

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

  const filteredDeclined = declined.filter(student => {
    const studentName = (student.studentName || student.name || '').toLowerCase();
    const studentIdStr = (student.studentId || '').toString().toLowerCase();

    const matchesSearch = studentName.includes(searchTerm.toLowerCase()) ||
      studentIdStr.includes(searchTerm.toLowerCase());

    const matchesLevel = selectedLevel === 'All' || getStudentLevel(student) === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  const sortedDeclined = [...filteredDeclined].sort((a, b) => {
    let valA = '';
    let valB = '';

    if (sortBy === 'name') {
      valA = a.studentName || a.name || '';
      valB = b.studentName || b.name || '';
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else if (sortBy === 'time') {
      valA = a.declinedDate || a.updatedAt || '';
      valB = b.declinedDate || b.updatedAt || '';
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return 0;
  });

  const handleRestore = async (student) => {
    if (window.confirm(`Restore registration for ${student.name} to Pending?`)) {
      try {
        await updateItem('students', student.id, { ...student, status: 'Pending' });
        onRefresh();
      } catch (err) { console.error(err); }
    }
  };

  const handleDeletePermanent = async (id) => {
    if (window.confirm('Permanently delete this declined registration history?')) {
      try {
        await deleteItem('students', id);
        onRefresh();
      } catch (err) { console.error(err); }
    }
  };

  return (
    <>
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
      <InfoBanner text="History of declined registration requests. You can restore them to pending or delete them permanently." />
      
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

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ minWidth: '250px', flex: '1' }}>
          <label>Search Student Name</label>
          <input
            type="text"
            placeholder="Search declined students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Sorting Control Bar */}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ color: '#aaa', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort Declined By:</span>
        {[
          { key: 'name', label: '🔤 Name (A-Z)' },
          { key: 'time', label: '📅 Declined Date' }
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
              <th>Name</th>
              <th>Email</th>
              <th>Date of Birth</th>
              <th>Level</th>
              <th>Declined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedDeclined.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No declined registrations matching criteria
                </td>
              </tr>
            ) : (
              sortedDeclined.map(student => (
                <tr key={student.id}>
                  <td>{highlightMatch(student.studentName || student.name || 'N/A', searchTerm)}</td>
                  <td>{student.email}</td>
                  <td>{student.dateOfBirth || student.dob || 'N/A'}</td>
                  <td>{getStudentLevel(student)}</td>
                  <td>{student.declinedDate || (student.updatedAt ? new Date(student.updatedAt).toLocaleDateString() : 'N/A')}</td>
                  <td className="action-btns">
                    <button className="view-btn" onClick={() => setViewingStudent(student)}>View</button>
                    <button className="edit-btn" onClick={() => handleRestore(student)}>Restore</button>
                    <button className="delete-btn" onClick={() => handleDeletePermanent(student.id)}>Purge</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

/* ── Mini styles ── */
const miniInput = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(212,175,55,0.3)',
  color: '#fff',
  padding: '0.2rem 0.4rem',
  borderRadius: '4px',
  width: '100%',
  fontSize: '0.85rem'
};

/* ── Shared banner ───────────────────────────────────────── */
const InfoBanner = ({ text }) => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))',
    border: '1px solid rgba(212,175,55,0.25)',
    borderRadius: '7px',
    padding: '0.65rem 1rem',
    marginBottom: '1rem',
    fontSize: '0.82rem',
    color: '#c9a227',
  }}>
    ℹ️ {text}
  </div>
);

/* ── Student Details Modal ── */
const StudentDetailsModal = ({ student, onClose }) => {
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
    }} onClick={onClose}>
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
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎓</div>
            <h2 style={{ margin: 0, color: '#fff' }}>{student.studentName || student.name}</h2>
            <span style={{ color: '#d4af37', fontWeight: '700' }}>#{student.studentId}</span>
          </div>
          
          {detailRow('Full Name', student.studentName || student.name)}
          {detailRow('Email Address', student.email)}
          {detailRow('Phone Number', student.phoneNumber || student.phone || student.whatsappNo)}
          {detailRow('Date of Birth', student.dateOfBirth || student.dob)}
          {detailRow('Chess Level', student.chessExperience || student.level)}
          {detailRow('Registration Date', student.approvedDate || (student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'))}
          {detailRow('School / College', student.school)}
          {detailRow('Gender', student.gender)}
          {detailRow('FIDE ID', student.fideId && String(student.fideId).trim() ? student.fideId : 'N/A')}
          {detailRow('FIDE Rating', student.fideRating && String(student.fideRating).trim() ? student.fideRating : 'N/A')}
          {detailRow('Parent Name', student.parentName)}
          {detailRow('Parent Occupation', student.parentOccupation)}
          
          <div style={{ marginTop: '1.5rem' }}>
             <span style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Address</span>
             <p style={{ color: '#fff', fontSize: '0.95rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', lineHeight: '1.6', border: '1px solid rgba(255,255,255,0.05)' }}>
               {student.address || 'No address provided.'}
             </p>
          </div>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
          <button onClick={onClose} style={{
            padding: '0.6rem 2rem', background: '#d4af37', color: '#000',
            border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer'
          }}>Close Details</button>
        </div>
      </div>
    </div>
  );
};

export default StudentApprovalManager;
