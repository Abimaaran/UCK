import React, { useState } from 'react';

const CoachManager = ({ coaches, setCoaches }) => {
  const [editingCoach, setEditingCoach] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this coach?')) {
      setCoaches(coaches.filter(c => c.id !== id));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const coachData = {
      id: editingCoach ? editingCoach.id : Date.now(),
      name: formData.get('name'),
      title: formData.get('title'),
      experience: formData.get('experience'),
      specialization: formData.get('specialization'),
      fideId: formData.get('fideId'),
      rating: formData.get('rating'),
      bio: formData.get('bio'),
      achievements: formData.get('achievements').split(',').map(a => a.trim()),
      chessPiece: '♔',
      colorGradient: editingCoach ? editingCoach.colorGradient : 'linear-gradient(135deg, #00BFFF, #0A74DA)'
    };

    if (editingCoach) {
      setCoaches(coaches.map(c => c.id === editingCoach.id ? coachData : c));
    } else {
      setCoaches([...coaches, coachData]);
    }
    setEditingCoach(null);
    setIsAdding(false);
  };

  if (isAdding || editingCoach) {
    return (
      <div className="edit-form-container">
        <h3>{editingCoach ? 'Edit Coach' : 'Add New Coach'}</h3>
        <form onSubmit={handleSave} className="admin-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Name</label>
              <input name="name" defaultValue={editingCoach?.name} required />
            </div>
            <div className="form-group">
              <label>Title</label>
              <input name="title" defaultValue={editingCoach?.title} required />
            </div>
            <div className="form-group">
              <label>Experience</label>
              <input name="experience" defaultValue={editingCoach?.experience} required />
            </div>
            <div className="form-group">
              <label>Specialization</label>
              <input name="specialization" defaultValue={editingCoach?.specialization} required />
            </div>
            <div className="form-group">
              <label>FIDE ID</label>
              <input name="fideId" defaultValue={editingCoach?.fideId} />
            </div>
            <div className="form-group">
              <label>Rating</label>
              <input name="rating" defaultValue={editingCoach?.rating} />
            </div>
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea name="bio" defaultValue={editingCoach?.bio} rows="3"></textarea>
          </div>
          <div className="form-group">
            <label>Achievements (comma separated)</label>
            <input name="achievements" defaultValue={editingCoach?.achievements.join(', ')} />
          </div>
          <div className="form-actions">
            <button type="submit" className="add-btn">Save Coach</button>
            <button type="button" className="delete-btn" onClick={() => { setEditingCoach(null); setIsAdding(false); }}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="manager-container">
      <div className="manager-actions">
        <button className="add-btn" onClick={() => setIsAdding(true)}>
          <span>+</span> Add Coach
        </button>
      </div>
      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>Specialization</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coaches.map(coach => (
              <tr key={coach.id}>
                <td>{coach.name}</td>
                <td>{coach.title}</td>
                <td>{coach.specialization}</td>
                <td>{coach.rating}</td>
                <td className="action-btns">
                  <button className="edit-btn" onClick={() => setEditingCoach(coach)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(coach.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoachManager;
