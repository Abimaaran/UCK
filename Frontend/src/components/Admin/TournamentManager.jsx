import React, { useState } from 'react';

const TournamentManager = ({ tournaments, setTournaments }) => {
  const [editingTournament, setEditingTournament] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this tournament?')) {
      setTournaments(tournaments.filter(t => t.id !== id));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const tournamentData = {
      id: editingTournament ? editingTournament.id : Date.now(),
      name: formData.get('name'),
      status: formData.get('status'),
      date: formData.get('date'),
      participants: formData.get('participants'),
      icon: formData.get('icon'),
      gradient: editingTournament ? editingTournament.gradient : 'linear-gradient(135deg, #FF6B6B, #FF5252)'
    };

    if (editingTournament) {
      setTournaments(tournaments.map(t => t.id === editingTournament.id ? tournamentData : t));
    } else {
      setTournaments([...tournaments, tournamentData]);
    }
    setEditingTournament(null);
    setIsAdding(false);
  };

  if (isAdding || editingTournament) {
    return (
      <div className="edit-form-container">
        <h3>{editingTournament ? 'Edit Tournament' : 'Add New Tournament'}</h3>
        <form onSubmit={handleSave} className="admin-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Tournament Name</label>
              <input name="name" defaultValue={editingTournament?.name} required />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" defaultValue={editingTournament?.status || 'Upcoming'}>
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input name="date" defaultValue={editingTournament?.date} required />
            </div>
            <div className="form-group">
              <label>Participants Info</label>
              <input name="participants" defaultValue={editingTournament?.participants} />
            </div>
            <div className="form-group">
              <label>Icon (Emoji)</label>
              <input name="icon" defaultValue={editingTournament?.icon || '🏆'} />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="add-btn">Save Tournament</button>
            <button type="button" className="delete-btn" onClick={() => { setEditingTournament(null); setIsAdding(false); }}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="manager-container">
      <div className="manager-actions">
        <button className="add-btn" onClick={() => setIsAdding(true)}>
          <span>+</span> Add Tournament
        </button>
      </div>
      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Icon</th>
              <th>Name</th>
              <th>Status</th>
              <th>Date</th>
              <th>Participants</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map(tournament => (
              <tr key={tournament.id}>
                <td style={{ fontSize: '1.2rem' }}>{tournament.icon}</td>
                <td>{tournament.name}</td>
                <td>
                  <span className={`status-badge ${tournament.status.toLowerCase()}`}>
                    {tournament.status}
                  </span>
                </td>
                <td>{tournament.date}</td>
                <td>{tournament.participants}</td>
                <td className="action-btns">
                  <button className="edit-btn" onClick={() => setEditingTournament(tournament)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(tournament.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TournamentManager;
