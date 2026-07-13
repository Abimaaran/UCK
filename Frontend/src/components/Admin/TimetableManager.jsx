import React, { useState } from 'react';
import { createItem, updateItem, deleteItem } from '../../services/api';

const TimetableManager = ({ timetable, setTimetable }) => {
  const [editingEntry, setEditingEntry] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await deleteItem('timetable', id);
        setTimetable(timetable.filter(t => (t.id !== id && t._id !== id)));
      } catch (err) {
        alert("Failed to delete timetable entry.");
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const entryData = {
      day: formData.get('day'),
      time: formData.get('time'),
      level: formData.get('level'),
      coach: formData.get('coach')
    };

    try {
      if (editingEntry) {
        const entryId = editingEntry.id || editingEntry._id;
        console.log("Updating entry:", entryId, entryData);
        const response = await updateItem('timetable', entryId, entryData);
        
        // Defensive merge: prioritize backend response, but fallback to local entryData and keep ID
        const finalUpdated = { 
          ...editingEntry, 
          ...entryData, 
          ...(typeof response === 'object' ? response : {}), 
          id: entryId 
        };
        
        console.log("Final updated state object:", finalUpdated);
        setTimetable(timetable.map(t => (t.id === entryId || t._id === entryId) ? finalUpdated : t));
      } else {
        const created = await createItem('timetable', entryData);
        setTimetable([...timetable, created]);
      }
      setEditingEntry(null);
      setIsAdding(false);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save timetable entry.");
    }
  };

  if (isAdding || editingEntry) {
    return (
      <div className="edit-form-container">
        <h3>{editingEntry ? 'Edit Class' : 'Add New Class'}</h3>
        <form onSubmit={handleSave} className="admin-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Day</label>
              <select name="day" defaultValue={editingEntry?.day || 'Monday'}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <option key={day} value={day} style={{ background: '#15151a', color: '#fff' }}>{day}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Time</label>
              <input name="time" defaultValue={editingEntry?.time} placeholder="e.g. 5:00 PM - 6:30 PM" required />
            </div>
            <div className="form-group">
              <label>Level</label>
              <select name="level" defaultValue={editingEntry?.level || 'Beginner'}>
                <option value="Beginner" style={{ background: '#15151a', color: '#fff' }}>Beginner</option>
                <option value="Intermediate" style={{ background: '#15151a', color: '#fff' }}>Intermediate</option>
                <option value="Advanced" style={{ background: '#15151a', color: '#fff' }}>Advanced</option>
              </select>
            </div>
            <div className="form-group">
              <label>Coach</label>
              <input name="coach" defaultValue={editingEntry?.coach} required />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="add-btn">Save Class</button>
            <button type="button" className="delete-btn" onClick={() => { setEditingEntry(null); setIsAdding(false); }}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const groupedTimetable = timetable.reduce((acc, entry) => {
    const day = entry.day || 'Other';
    if (!acc[day]) acc[day] = [];
    acc[day].push(entry);
    return acc;
  }, {});

  const sortedDays = Object.keys(groupedTimetable).sort((a, b) => {
    return dayOrder.indexOf(a) - dayOrder.indexOf(b);
  });

  return (
    <div className="manager-container">
      <div className="manager-actions">
        <button className="add-btn" onClick={() => setIsAdding(true)}>
          <span>+</span> Add Class
        </button>
      </div>
      
      {sortedDays.length > 0 ? (
        sortedDays.map(day => (
          <div key={day} className="day-management-section" style={{ marginBottom: '3rem' }}>
            <h3 style={{ 
              color: '#d4af37', 
              borderBottom: '1px solid rgba(212, 175, 55, 0.3)', 
              paddingBottom: '0.5rem',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              fontSize: '1.2rem'
            }}>{day}</h3>
            <div className="data-table-container">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Level</th>
                    <th>Coach</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedTimetable[day].map((entry, idx) => (
                    <tr key={entry.id || entry._id || `entry-${day}-${idx}`}>
                      <td>{entry.time}</td>
                      <td>{entry.level}</td>
                      <td>{entry.coach}</td>
                      <td className="action-btns">
                        <button className="edit-btn" onClick={() => setEditingEntry(entry)}>Edit</button>
                        <button className="delete-btn" onClick={() => handleDelete(entry.id || entry._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
          No classes scheduled yet.
        </div>
      )}
    </div>
  );
};

export default TimetableManager;
