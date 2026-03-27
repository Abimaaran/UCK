import React, { useState, useRef } from 'react';
import { createItem, updateItem, deleteItem } from '../../services/api';

const TournamentManager = ({ tournaments, setTournaments }) => {
  const [editingTournament, setEditingTournament] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const descriptionRef = useRef(null);
  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const clearImage = () => {
    setImagePreview(null);
    if (editingTournament) {
      setEditingTournament(prev => ({ ...prev, canvaImage: '' }));
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const clearPdf = () => {
    setPdfData(null);
    if (editingTournament) {
      setEditingTournament(prev => ({ ...prev, pdfUrl: '' }));
    }
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tournament?')) {
      try {
        await deleteItem('tournaments', id);
        setTournaments(tournaments.filter(t => (t.id !== id && t._id !== id)));
      } catch (err) {
        alert("Failed to delete tournament.");
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const canvaImage = imagePreview || editingTournament?.canvaImage || '';

    if (!canvaImage) {
      alert("Error: A tournament photo is required. Please upload an image.");
      return;
    }

    const tournamentData = {
      name: formData.get('name'),
      description: formData.get('description'),
      canvaImage: canvaImage,
      pdfUrl: pdfData || editingTournament?.pdfUrl || '',
      gradient: editingTournament ? editingTournament.gradient : 'linear-gradient(135deg, #FF6B6B, #FF5252)'
    };

    try {
      if (editingTournament) {
        const tournamentId = editingTournament.id || editingTournament._id;
        const response = await updateItem('tournaments', tournamentId, tournamentData);

        const finalUpdated = {
          ...editingTournament,
          ...tournamentData,
          ...(typeof response === 'object' ? response : {}),
          id: tournamentId
        };

        setTournaments(tournaments.map(t => (t.id === tournamentId || t._id === tournamentId) ? finalUpdated : t));
      } else {
        const created = await createItem('tournaments', tournamentData);
        setTournaments([...tournaments, created]);
      }
      setEditingTournament(null);
      setIsAdding(false);
      setImagePreview(null);
      setPdfData(null);
    } catch (err) {
      alert("Failed to save tournament.");
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'image') setImagePreview(reader.result);
        if (type === 'pdf') setPdfData(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInsertLink = () => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    if (!selected) {
      alert("Please select some text first to turn into a link.");
      return;
    }

    const url = prompt("Enter the URL (e.g., https://example.com):");
    if (!url) {
      textarea.focus();
      return;
    }

    const finalUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
    const newText = text.substring(0, start) + `[${selected}](${finalUrl})` + text.substring(end);
    
    textarea.value = newText;
    textarea.focus();
    
    // Reselect the new link part
    const linkLength = `[${selected}](${finalUrl})`.length;
    textarea.setSelectionRange(start, start + linkLength);
  };

  if (isAdding || editingTournament) {
    return (
      <div className="edit-form-container">
        <h3>{editingTournament ? 'Edit Tournament' : 'Add New Tournament'}</h3>
        <form onSubmit={handleSave} className="admin-form">
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Tournament Name</label>
              <input name="name" defaultValue={editingTournament?.name} required />
            </div>
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ margin: 0 }}>Description</label>
              <button 
                type="button" 
                onClick={handleInsertLink}
                style={{ background: '#d4af37', color: '#000', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🔗 Add Link
              </button>
            </div>
            <textarea 
              ref={descriptionRef} 
              name="description" 
              defaultValue={editingTournament?.description} 
              rows="4"
              placeholder="Tip: Select text and click 'Add Link' above to make it a link"
            ></textarea>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ margin: 0 }}>Tournament Image (Photo) <span style={{ color: '#FF6B6B' }}>*</span></label>
                {(imagePreview || editingTournament?.canvaImage) && (
                  <button 
                    type="button" 
                    onClick={clearImage}
                    style={{ background: '#FF4757', color: '#fff', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    Clear Photo
                  </button>
                )}
              </div>
              <input 
                type="file" 
                ref={imageInputRef}
                accept="image/*" 
                onChange={(e) => handleFileChange(e, 'image')} 
              />
              {(imagePreview || editingTournament?.canvaImage) && (
                <div style={{ marginTop: '0.5rem' }}>
                  <img src={imagePreview || editingTournament.canvaImage} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #333' }} />
                </div>
              )}
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ margin: 0 }}>Details Attachment (PDF) <small style={{ fontWeight: 'normal', opacity: 0.7 }}>(Optional)</small></label>
                {(pdfData || editingTournament?.pdfUrl) && (
                  <button 
                    type="button" 
                    onClick={clearPdf}
                    style={{ background: '#FF4757', color: '#fff', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    Clear PDF
                  </button>
                )}
              </div>
              <input 
                type="file" 
                ref={pdfInputRef}
                accept="application/pdf" 
                onChange={(e) => handleFileChange(e, 'pdf')} 
              />
              {(pdfData || editingTournament?.pdfUrl) && (
                <div style={{ marginTop: '0.5rem' }}>
                  <small style={{ color: '#20C997', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '1.2rem' }}>✓</span> PDF Document Attached
                  </small>
                </div>
              )}
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
              <th>Image</th>
              <th>Name</th>
              <th>Description Snippet</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map(tournament => (
              <tr key={tournament.id || tournament._id}>
                <td>
                  {tournament.canvaImage ? (
                    <img src={tournament.canvaImage} alt="Thumb" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                  ) : 'No Image'}
                </td>
                <td>{tournament.name}</td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tournament.description || 'No description'}
                </td>
                <td className="action-btns">
                  <button className="edit-btn" onClick={() => { setEditingTournament(tournament); setImagePreview(null); setPdfData(null); }}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(tournament.id || tournament._id)}>Delete</button>
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
