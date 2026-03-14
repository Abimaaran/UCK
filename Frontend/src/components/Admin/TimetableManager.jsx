import React, { useState } from 'react';

const TimetableManager = ({ timetable, setTimetable }) => {
  const [editingEntry, setEditingEntry] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      setTimetable(timetable.filter(t => t.id !== id));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const entryData = {
      id: editingEntry ? editingEntry.id : Date.now(),
      day: formData.get('day'),
      time: formData.get('time'),
      level: formData.get('level'),
      coach: formData.get('coach')
    };

    if (editingEntry) {
      setTimetable(timetable.map(t => t.id === editingEntry.id ? entryData : t));
    } else {
      setTimetable([...timetable, entryData]);
    }
    setEditingEntry(null);
    setIsAdding(false);
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
                  <option key={day} value={day}>{day}</option>
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
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
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

  return (
    <div className="manager-container">
      <div className="manager-actions">
        <button className="add-btn" onClick={() => setIsAdding(true)}>
          <span>+</span> Add Class
        </button>
      </div>
      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Time</th>
              <th>Level</th>
              <th>Coach</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {timetable.map(entry => (
              <tr key={entry.id}>
                <td>{entry.day}</td>
                <td>{entry.time}</td>
                <td>{entry.level}</td>
                <td>{entry.coach}</td>
                <td className="action-btns">
                  <button className="edit-btn" onClick={() => setEditingEntry(entry)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(entry.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimetableManager;
