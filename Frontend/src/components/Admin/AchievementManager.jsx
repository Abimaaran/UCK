import React, { useState } from 'react';

const AchievementManager = ({ achievements, setAchievements }) => {
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this achievement?')) {
      setAchievements(achievements.filter(a => a.id !== id));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const achievementData = {
      id: editingAchievement ? editingAchievement.id : Date.now(),
      studentName: formData.get('studentName'),
      title: formData.get('title'),
      position: formData.get('position'),
      date: formData.get('date'),
      description: formData.get('description')
    };

    if (editingAchievement) {
      setAchievements(achievements.map(a => a.id === editingAchievement.id ? achievementData : a));
    } else {
      setAchievements([...achievements, achievementData]);
    }
    setEditingAchievement(null);
    setIsAdding(false);
  };

  if (isAdding || editingAchievement) {
    return (
      <div className="edit-form-container">
        <h3>{editingAchievement ? 'Edit Achievement' : 'Add New Achievement'}</h3>
        <form onSubmit={handleSave} className="admin-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Student Name</label>
              <input name="studentName" defaultValue={editingAchievement?.studentName} required />
            </div>
            <div className="form-group">
              <label>Achievement Title</label>
              <input name="title" defaultValue={editingAchievement?.title} required />
            </div>
            <div className="form-group">
              <label>Position / Rank</label>
              <input name="position" defaultValue={editingAchievement?.position} required />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" name="date" defaultValue={editingAchievement?.date} required />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" defaultValue={editingAchievement?.description} rows="3"></textarea>
          </div>
          <div className="form-actions">
            <button type="submit" className="add-btn">Save Achievement</button>
            <button type="button" className="delete-btn" onClick={() => { setEditingAchievement(null); setIsAdding(false); }}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="manager-container">
      <div className="manager-actions">
        <button className="add-btn" onClick={() => setIsAdding(true)}>
          <span>+</span> Add Achievement
        </button>
      </div>
      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Achievement</th>
              <th>Position</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {achievements.map(achievement => (
              <tr key={achievement.id}>
                <td>{achievement.studentName}</td>
                <td>{achievement.title}</td>
                <td>{achievement.position}</td>
                <td>{achievement.date}</td>
                <td className="action-btns">
                  <button className="edit-btn" onClick={() => setEditingAchievement(achievement)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(achievement.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AchievementManager;
