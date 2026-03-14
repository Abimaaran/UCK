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
  const [view, setView] = useState('pending'); // 'pending' | 'add' | 'approved' | 'declined'
  const [refresh, setRefresh] = useState(0);

  const refresh_ = () => setRefresh(r => r + 1);

  return (
    <div className="manager-container">
      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { key: 'pending', label: '⏳ Pending Approvals', count: students.length },
          { key: 'add',     label: '➕ Add Student Manually' },
          { key: 'approved', label: '✅ Approved Students' },
          { key: 'declined', label: '❌ Declined Registrations' },
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

      {view === 'pending'  && <PendingTab students={students} setStudents={setStudents} onRefresh={refresh_} />}
      {view === 'add'      && <ManualAddTab onRefresh={refresh_} />}
      {view === 'approved' && <ApprovedTab key={refresh} onRefresh={refresh_} />}
      {view === 'declined' && <DeclinedTab students={students} setStudents={setStudents} onRefresh={refresh_} />}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   PENDING APPROVALS TAB
═══════════════════════════════════════════════════════════ */
const PendingTab = ({ students, setStudents, onRefresh }) => {
  const [customIds, setCustomIds] = useState({});

  const handleApprove = async (student) => {
    const rawId = customIds[student.id] || student.id; // fallback to original id if no custom ID
    if (!rawId || !String(rawId).trim()) {
      alert('Please enter a Student ID before approving.');
      return;
    }
    const studentId = String(rawId).trim();

    try {
      await approveStudentApi(studentId, student);
      setStudents(students.filter(s => s.id !== student.id));
      onRefresh();

      alert(
        `✅ Student Approved!\n\n` +
        `Name : ${student.name}\n` +
        `──────────────────────────────\n` +
        `🪪  USERNAME (Student ID) : ${studentId}\n` +
        `🔑  PASSWORD (Date of Birth) : ${student.dob || 'N/A'}\n` +
        `──────────────────────────────\n` +
        `Share these credentials with the student.`
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
      <InfoBanner text="Enter a custom Student ID for each student before clicking Approve. Their Date of Birth will be their portal password." />
      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Date of Birth</th>
              <th>Level</th>
              <th>Applied</th>
              <th>Assign Student ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No pending registrations
                </td>
              </tr>
            ) : (
              students.map(student => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>
                    {student.dob
                      ? <span style={{ color: '#d4af37', fontWeight: 600 }}>{student.dob}</span>
                      : <span style={{ color: '#888', fontStyle: 'italic' }}>Not provided</span>}
                  </td>
                  <td>{student.level}</td>
                  <td>{student.appliedDate}</td>
                  <td>
                    <input
                      type="text"
                      placeholder="e.g. 1005"
                      value={customIds[student.id] || ''}
                      onChange={e => setCustomIds({ ...customIds, [student.id]: e.target.value })}
                      style={{
                        width: '90px',
                        padding: '0.3rem 0.5rem',
                        borderRadius: '5px',
                        border: '1px solid rgba(212,175,55,0.4)',
                        background: 'rgba(0,0,0,0.3)',
                        color: '#fff',
                        fontSize: '0.85rem',
                      }}
                    />
                  </td>
                  <td className="action-btns">
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
    if (!form.name.trim())      { setError('Name is required.'); return; }
    if (!form.dob)               { setError('Date of Birth is required (used as portal password).'); return; }

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
      <InfoBanner text="Manually add a student with a custom Student ID you define. Their Date of Birth becomes their portal password." />

      {error && (
        <div style={{ background: 'rgba(220,53,69,0.15)', border: '1px solid rgba(220,53,69,0.4)',
          borderRadius: '7px', padding: '0.7rem 1rem', color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.85rem' }}>
          ❌ {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.4)',
          borderRadius: '7px', padding: '0.7rem 1rem', color: '#a0e4a0', marginBottom: '1rem', fontSize: '0.85rem' }}>
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
            placeholder="+91 98765 43210" style={inputStyle} />
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
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Tournament">Tournament Prep</option>
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
const ApprovedTab = ({ onRefresh }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [approved, setApproved] = useState([]);

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

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete student #${id}? This action cannot be undone.`)) {
      try {
        // Here id might be db id or custom studentId depending on backend mapping.
        // Assuming your backend uses the MongoDB ID for actual document deletion (`student.id` typically maps to `_id`).
        // We will need the actual DB document _id, let's assume `id` here is the `_id`/`id` field of the user document.
        const stud = approved.find(s => s.studentId === id || s.id === id);
        if(stud) await deleteItem('students', stud.id || stud._id);
        onRefresh();
      } catch (err) {
         console.error(err);
      }
    }
  };

  const startEdit = (student) => {
    setEditingId(student.studentId);
    setEditForm({ ...student });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    try {
      const stud = approved.find(s => s.studentId === editingId);
      await updateItem('students', stud.id || stud._id, editForm);
      setEditingId(null);
      onRefresh();
    } catch(err) {
      console.error(err);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <>
      <InfoBanner text="All approved / manually added students with their portal credentials. You can edit their details or remove them from the system." />
      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Password (DOB)</th>
              <th>Level</th>
              <th>Approved</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {approved.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No approved students yet
                </td>
              </tr>
            ) : (
              approved.map(s => (
                <tr key={s.studentId}>
                  <td><strong style={{ color: '#d4af37' }}>#{s.studentId}</strong></td>
                  <td>
                    {editingId === s.studentId ? (
                      <input name="name" value={editForm.name} onChange={handleEditChange} style={miniInput} />
                    ) : s.name}
                  </td>
                  <td>
                    {editingId === s.studentId ? (
                      <input name="email" value={editForm.email} onChange={handleEditChange} style={miniInput} />
                    ) : s.email}
                  </td>
                  <td>
                    {editingId === s.studentId ? (
                      <input name="dob" value={editForm.dob} onChange={handleEditChange} style={miniInput} />
                    ) : <span style={{ fontFamily: 'monospace', color: '#a0e4a0' }}>{s.dob}</span>}
                  </td>
                  <td>
                    {editingId === s.studentId ? (
                      <select name="level" value={editForm.level} onChange={handleEditChange} style={miniInput}>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Tournament">Tournament Prep</option>
                      </select>
                    ) : s.level}
                  </td>
                  <td>{s.approvedDate}</td>
                  <td className="action-btns">
                    {editingId === s.studentId ? (
                      <>
                        <button className="approve-btn" onClick={saveEdit}>Save</button>
                        <button className="delete-btn" onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="edit-btn" onClick={() => startEdit(s)}>Edit</button>
                        <button className="delete-btn" onClick={() => handleDelete(s.studentId)}>Delete</button>
                      </>
                    )}
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
   DECLINED REGISTRATIONS TAB
═══════════════════════════════════════════════════════════ */
const DeclinedTab = ({ students, setStudents, onRefresh }) => {
  const [declined, setDeclined] = useState([]);

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
      <InfoBanner text="History of declined registration requests. You can restore them to pending or delete them permanently." />
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
            {declined.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No declined registrations
                </td>
              </tr>
            ) : (
              declined.map(student => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.dob}</td>
                  <td>{student.level}</td>
                  <td>{student.declinedDate}</td>
                  <td className="action-btns">
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

export default StudentApprovalManager;
