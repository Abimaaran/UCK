import React, { useState, useEffect } from 'react';
import { getCollection, createItem, updateItem, deleteItem } from '../../services/api';

/* ═══════════════════════════════════════════════════════════
   API Helpers 
   ═══════════════════════════════════════════════════════════ */
const approveStudentApi = async (studentId, studentData) => {
  // we could move a student from pending to approved by updating their status via API
  return await updateItem('students', studentData.id, { ...studentData, studentId, status: 'Approved', approvedDate: new Date().toISOString() });
};

const declineStudentApi = async (studentId) => {
  return await updateItem('students', studentId, { status: 'Declined', declinedDate: new Date().toISOString() });
};

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

const formatDOB = (dobStr) => {
  return formatDate(dobStr);
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const StudentApprovalManager = ({ students, setStudents, targetItem }) => {
  const [view, setView] = useState('approved'); // 'approved' | 'pending' | 'declined' | 'add'
  const [refresh, setRefresh] = useState(0);
  const [viewingStudent, setViewingStudent] = useState(null);

  useEffect(() => {
    if (targetItem) {
      if (targetItem.status === 'Pending') {
        setView('pending');
      } else if (targetItem.status === 'Declined') {
        setView('declined');
      } else {
        setView('approved');
      }
      setViewingStudent(targetItem);
    }
  }, [targetItem]);

  const refresh_ = () => setRefresh(r => r + 1);

  return (
    <div className="manager-container">
      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { key: 'approved', label: 'Approved Students' },
          { key: 'pending', label: 'Pending Approvals', count: students.length },
          { key: 'declined', label: 'Declined Registrations' },
          { key: 'add', label: 'Add Student Manually' },
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
      {view === 'approved' && <ApprovedTab onRefresh={refresh_} setViewingStudent={setViewingStudent} />}
      {view === 'declined' && <DeclinedTab students={students} setStudents={setStudents} onRefresh={refresh_} setViewingStudent={setViewingStudent} />}

      {viewingStudent && (
        <StudentDetailsModal
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
          onStudentUpdated={(updatedStudent) => {
            setViewingStudent(updatedStudent);
            refresh_();
          }}
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
      alert('⚠️ Required: Please assign a UCK Student ID (e.g. UCK01) before approving the registration.');
      return;
    }
    const studentId = String(rawId).trim().toUpperCase();

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
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No pending registrations matching criteria
                </td>
              </tr>
            ) : (
              sortedStudents.map(student => (
                <tr key={student.id}>
                  <td style={{ fontWeight: '600', minWidth: '140px' }}>{highlightMatch(student.studentName || student.name || 'N/A', searchTerm)}</td>
                  <td style={{ minWidth: '110px' }}>{formatDisplayPhone(student.phoneNumber || student.whatsappNo || student.phone)}</td>
                  <td style={{ fontSize: '0.85rem', minWidth: '220px', whiteSpace: 'normal', lineHeight: '1.4' }}>{student.address || 'N/A'}</td>
                  <td style={{ minWidth: '110px' }}>{getStudentLevel(student)}</td>
                  <td style={{ fontSize: '0.85rem', minWidth: '100px' }}>{formatDate(student.appliedDate || student.createdAt)}</td>
                  <td>
                    <input
                      type="text"
                      placeholder="e.g. UCK01"
                      value={customIds[student.id] || ''}
                      onChange={e => setCustomIds({ ...customIds, [student.id]: e.target.value.toUpperCase() })}
                      style={{
                        width: '100px',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '5px',
                        border: '2px solid rgba(212,175,55,0.6)',
                        background: 'rgba(212,175,55,0.05)',
                        color: '#fff',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        textTransform: 'uppercase'
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
    phone: '',
    email: '',
    school: '',
    level: 'Beginner',
    dob: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handle = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === 'studentId' ? value.toUpperCase() : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formattedId = form.studentId.trim().toUpperCase();
    if (!formattedId) { setError('Student ID is required.'); return; }
    if (!form.name.trim()) { setError('Full Name is required.'); return; }
    if (!form.phone.trim()) { setError('Phone Number is required.'); return; }
    if (!form.dob.trim()) { setError('Date of Birth is required (used as portal password).'); return; }

    try {
      const res = await createItem('students', {
        studentId: formattedId,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        school: form.school.trim(),
        level: form.level,
        dob: form.dob.trim(),
        status: 'Approved',
        approvedDate: new Date().toISOString(),
      });
      onRefresh();
      setSuccess(`Student added successfully! Credentials — Student ID: ${formattedId} | Password: ${form.dob}`);
      setForm({ studentId: '', name: '', phone: '', email: '', school: '', level: 'Beginner', dob: '' });
    } catch (err) {
      setError(`Failed to add student. The Student ID may already be in use.`);
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
        {/* Student ID — full width, mandatory, auto uppercase */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>
            🪪 Student ID <span style={{ color: '#d4af37' }}>* (you define this — automatically converts to uppercase)</span>
          </label>
          <input
            name="studentId"
            value={form.studentId}
            onChange={handle}
            placeholder="e.g. UCK01"
            style={{
              ...inputStyle,
              borderColor: 'rgba(212,175,55,0.45)',
              fontWeight: '700',
              fontSize: '1rem',
              textTransform: 'uppercase'
            }}
            required
          />
        </div>

        {/* Name */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>
            Full Name <span style={{ color: '#d4af37' }}>*</span>
          </label>
          <input name="name" value={form.name} onChange={handle}
            placeholder="Student full name" style={inputStyle} required />
        </div>

        {/* Phone */}
        <div>
          <label style={labelStyle}>
            Phone Number <span style={{ color: '#d4af37' }}>*</span>
          </label>
          <input name="phone" value={form.phone} onChange={handle}
            placeholder="e.g. 0771234567" style={{ ...inputStyle, borderColor: 'rgba(212,175,55,0.45)' }} required />
        </div>

        {/* Email */}
        <div>
          <label style={labelStyle}>Email Address</label>
          <input name="email" type="email" value={form.email} onChange={handle}
            placeholder="student@example.com" style={inputStyle} />
        </div>

        {/* School / College */}
        <div>
          <label style={labelStyle}>School / College</label>
          <input name="school" value={form.school} onChange={handle}
            placeholder="School or College name" style={inputStyle} />
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

        {/* DOB — password */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>
            🔑 Date of Birth (DD/MM/YYYY) <span style={{ color: '#d4af37' }}>* (becomes portal password)</span>
          </label>
          <input name="dob" type="text" value={form.dob} onChange={handle} placeholder="DD/MM/YYYY" style={inputStyle} required />
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

  const fetchApproved = async () => {
    try {
      const allStudents = await getCollection('students');
      setApproved(allStudents.filter(s => s.status === 'Approved'));
    } catch (err) {
      console.error("Failed to fetch approved students:", err);
    }
  };

  useEffect(() => {
    fetchApproved();
  }, []);

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
    const isPaused = !student.isPaused;
    const targetDbId = student.id || student._id || student.studentId;
    const nameText = student.studentName || student.name || '';
    const idText = student.studentId ? `(ID: ${student.studentId})` : '';
    const displayInfo = [nameText, idText].filter(Boolean).join(' ') || 'this student';

    const confirmMsg = isPaused 
      ? `Are you sure you want to pause student ${displayInfo}?`
      : `Are you sure you want to resume student ${displayInfo}?`;

    if (!window.confirm(confirmMsg)) return;

    // Instantly update UI state in-place (ZERO page reload)
    setApproved(prev => prev.map(s => {
      if ((s.id && s.id === targetDbId) || (s._id && s._id === targetDbId) || s.studentId === student.studentId) {
        return { ...s, isPaused };
      }
      return s;
    }));

    try {
      await updateItem('students', targetDbId, {
        isPaused
      });
    } catch (err) {
      console.error("Failed to toggle pause status:", err);
      alert(`Could not update pause status for student ${displayInfo} in database.`);
      fetchApproved();
    }
  };

  const handleDelete = async (studentOrId) => {
    let stud = null;
    let targetDbId = null;
    let studentId = '';
    let studentName = '';

    if (typeof studentOrId === 'object' && studentOrId !== null) {
      stud = studentOrId;
      targetDbId = stud.id || stud._id;
      studentId = stud.studentId || '';
      studentName = stud.studentName || stud.name || '';
    } else {
      const id = studentOrId;
      stud = approved.find(s => s.studentId === id || s.id === id || s._id === id);
      targetDbId = stud?.id || stud?._id || id;
      studentId = stud?.studentId || '';
      studentName = stud?.studentName || stud?.name || '';
    }

    const nameText = studentName ? studentName : '';
    const idText = studentId ? `(ID: ${studentId})` : '';
    const displayInfo = [nameText, idText].filter(Boolean).join(' ') || 'this student';

    if (!window.confirm(`Are you sure you want to delete student ${displayInfo}? This action cannot be undone.`)) {
      return;
    }

    // Instantly remove student from UI table in-place (ZERO page reload)
    setApproved(prev => prev.filter(s => (
      s.id !== targetDbId && 
      s._id !== targetDbId && 
      (!studentId || s.studentId !== studentId)
    )));

    try {
      await deleteItem('students', targetDbId);
    } catch (err) {
      console.error("Failed to delete student:", err);
      alert("Failed to delete student from database: " + (err.response?.data?.error || err.message));
      fetchApproved();
    }
  };

  const startEdit = (student) => {
    const targetId = student.id || student._id || student.studentId;
    setEditingId(targetId);
    setEditForm({ 
      ...student,
      studentId: student.studentId || '',
      studentName: student.studentName || student.name || '',
      name: student.studentName || student.name || '',
      phoneNumber: student.phoneNumber || student.phone || student.whatsappNo || '',
      phone: student.phoneNumber || student.phone || student.whatsappNo || '',
      dob: student.dob || student.dateOfBirth || '',
      dateOfBirth: student.dob || student.dateOfBirth || '',
      chessExperience: student.chessExperience || student.level || 'Beginner level',
      level: student.chessExperience || student.level || 'Beginner level',
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
    if (name === 'studentId') {
      setEditForm(prev => ({ ...prev, studentId: value.toUpperCase() }));
    } else if (name === 'studentName' || name === 'name') {
      setEditForm(prev => ({ ...prev, studentName: value, name: value }));
    } else if (name === 'phoneNumber' || name === 'phone') {
      setEditForm(prev => ({ ...prev, phoneNumber: value, phone: value }));
    } else if (name === 'dob' || name === 'dateOfBirth') {
      setEditForm(prev => ({ ...prev, dob: value, dateOfBirth: value }));
    } else if (name === 'chessExperience' || name === 'level') {
      setEditForm(prev => ({ ...prev, chessExperience: value, level: value }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const saveEdit = async () => {
    try {
      const id = editingId;
      if (!id) return;

      const stud = approved.find(s => s.id === id || s._id === id || s.studentId === id);
      const targetDbId = stud?.id || stud?._id || id;

      const payload = { ...editForm };
      if (payload.studentId) {
        payload.studentId = String(payload.studentId).trim().toUpperCase();
      }

      const newSid = payload.studentId || stud?.studentId;
      const newName = payload.studentName || payload.name || stud?.studentName || stud?.name;
      const newPhone = payload.phoneNumber || payload.phone || stud?.phone;
      const newDob = payload.dob || payload.dateOfBirth || stud?.dob;
      const newLevel = payload.chessExperience || payload.level || stud?.level;

      const updatedRecord = {
        ...stud,
        ...payload,
        studentId: newSid,
        studentName: newName,
        name: newName,
        phone_number: newPhone,
        phoneNumber: newPhone,
        phone: newPhone,
        dob: newDob,
        dateOfBirth: newDob,
        chessExperience: newLevel,
        level: newLevel
      };

      // 1. Immediately update UI state in-place (ZERO page refresh, instant seamless feedback!)
      setApproved(prev => prev.map(s => {
        if ((s.id && s.id === targetDbId) || (s._id && s._id === targetDbId) || s.studentId === id) {
          return updatedRecord;
        }
        return s;
      }));
      setEditingId(null);

      // 2. Persist directly to database
      await updateItem('students', targetDbId, {
        studentId: newSid,
        studentName: newName,
        name: newName,
        email: payload.email,
        phone: newPhone,
        phoneNumber: newPhone,
        dob: newDob,
        dateOfBirth: newDob,
        level: newLevel,
        chessExperience: newLevel,
        address: payload.address,
        school: payload.school,
        parentName: payload.parentName,
        parentOccupation: payload.parentOccupation,
        fideId: payload.fideId,
        fideRating: payload.fideRating
      });

      const nameText = newName ? newName : '';
      const idText = newSid ? `(ID: ${newSid})` : '';
      const displayInfo = [nameText, idText].filter(Boolean).join(' ') || 'this student';

      alert(`✅ Details updated successfully for student ${displayInfo}!`);
    } catch (err) {
      console.error("Failed to save edit:", err);
      const nameText = editForm.studentName || editForm.name || '';
      const idText = editForm.studentId ? `(ID: ${editForm.studentId})` : '';
      const displayInfo = [nameText, idText].filter(Boolean).join(' ') || 'this student';
      alert(`Failed to update student ${displayInfo} in database: ` + (err.response?.data?.error || err.message));
      fetchApproved();
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
              <th>Phone Number</th>
              <th>DOB</th>
              <th>Level</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedApproved.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
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
                        <input name="studentId" value={editForm.studentId} onChange={handleEditChange} style={{ ...miniInput, fontWeight: '700', color: '#d4af37', textTransform: 'uppercase' }} />
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
                        <input name="phoneNumber" value={editForm.phoneNumber || editForm.phone} onChange={handleEditChange} style={{ ...miniInput, color: '#FFC107', fontWeight: 'bold' }} />
                      ) : <span style={{ color: '#FFC107', fontWeight: '600' }}>{formatDisplayPhone(s.phoneNumber || s.phone || s.whatsappNo)}</span>}
                    </td>
                    <td>
                      {isEditing ? (
                        <input name="dob" value={editForm.dateOfBirth || editForm.dob} onChange={handleEditChange} style={miniInput} />
                      ) : <span style={{ fontFamily: 'monospace', color: '#a0e4a0' }}>{formatDOB(s.dateOfBirth || s.dob)}</span>}
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
                          <button className="delete-btn" onClick={() => handleDelete(s)}>Delete</button>
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

  const handleDeletePermanent = async (student) => {
    const studentName = student?.studentName || student?.name || 'this registration';
    if (window.confirm(`Permanently delete declined registration for "${studentName}"?`)) {
      try {
        setDeclined(prev => prev.filter(s => s.id !== student.id));
        await deleteItem('students', student.id);
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
              <th>Date of Birth</th>
              <th>Level</th>
              <th>Declined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedDeclined.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No declined registrations matching criteria
                </td>
              </tr>
            ) : (
              sortedDeclined.map(student => (
                <tr key={student.id}>
                  <td>{highlightMatch(student.studentName || student.name || 'N/A', searchTerm)}</td>
                  <td>{formatDate(student.dateOfBirth || student.dob)}</td>
                  <td>{getStudentLevel(student)}</td>
                  <td>{formatDate(student.declinedDate || student.updatedAt || student.createdAt)}</td>
                  <td className="action-btns">
                    <button className="view-btn" onClick={() => setViewingStudent(student)}>View</button>
                    <button className="edit-btn" onClick={() => handleRestore(student)}>Restore</button>
                    <button className="delete-btn" onClick={() => handleDeletePermanent(student)}>Purge</button>
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
const StudentDetailsModal = ({ student, onClose, onStudentUpdated }) => {
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

export default StudentApprovalManager;
