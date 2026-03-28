import React, { useState } from 'react';
import { createItem, updateItem, deleteItem } from '../../services/api';

const AchievementManager = ({ achievements, setAchievements }) => {
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this achievement?')) {
      try {
        await deleteItem('achievements', id);
        setAchievements(achievements.filter(a => (a.id !== id && a._id !== id)));
      } catch (err) {
        alert("Failed to delete achievement.");
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const achievementData = {
      studentName: formData.get('studentName'),
      title: formData.get('title'),
      description: formData.get('description'),
      photo: photoPreview || editingAchievement?.photo || ''
    };

    try {
      if (editingAchievement) {
        const achievementId = editingAchievement.id || editingAchievement._id;
        const response = await updateItem('achievements', achievementId, achievementData);
        
        const finalUpdated = { 
          ...editingAchievement, 
          ...achievementData, 
          ...(typeof response === 'object' ? response : {}), 
          id: achievementId 
        };
        
        setAchievements(achievements.map(a => (a.id === achievementId || a._id === achievementId) ? finalUpdated : a));
      } else {
        const created = await createItem('achievements', achievementData);
        setAchievements([...achievements, created]);
      }
      setEditingAchievement(null);
      setIsAdding(false);
      setPhotoPreview(null);
    } catch (err) {
      alert("Failed to save achievement.");
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
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
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Achievement Photo</label>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ border: '1px dashed #d4af37', padding: '1rem' }} />
              {(photoPreview || editingAchievement?.photo) && (
                <div style={{ marginTop: '0.5rem' }}>
                  <img src={photoPreview || editingAchievement.photo} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'contain', background: 'rgba(255,255,255,0.05)', border: '1px solid #d4af37' }} />
                </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea name="description" defaultValue={editingAchievement?.description} rows="3"></textarea>
          </div>
          <div className="form-actions">
            <button type="submit" className="add-btn">Save Achievement</button>
            <button type="button" className="delete-btn" onClick={() => { setEditingAchievement(null); setIsAdding(false); setPhotoPreview(null); }}>Cancel</button>
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
              <th>Photo</th>
              <th>Studentname</th>
              <th>Achievement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {achievements.map(achievement => (
              <tr key={achievement.id || achievement._id}>
                <td>
                  {achievement.photo ? (
                    <img src={achievement.photo} alt={achievement.studentName} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'contain', background: 'rgba(255,255,255,0.05)', border: '1px solid #d4af37' }} />
                  ) : (
                    <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>🏆</span>
                  )}
                </td>
                <td>{achievement.studentName}</td>
                <td>{achievement.title}</td>
                <td className="action-btns">
                  <button className="edit-btn" onClick={() => { setEditingAchievement(achievement); setPhotoPreview(null); }}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(achievement.id || achievement._id)}>Delete</button>
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
