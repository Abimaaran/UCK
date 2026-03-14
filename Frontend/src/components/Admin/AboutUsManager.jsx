import React, { useState } from 'react';

const AboutUsManager = ({ features, setFeatures }) => {
  const [editingFeature, setEditingFeature] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = (index) => {
    if (window.confirm('Are you sure you want to delete this feature?')) {
      const newFeatures = [...features];
      newFeatures.splice(index, 1);
      setFeatures(newFeatures);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const featureData = {
      icon: formData.get('icon'),
      title: formData.get('title'),
      description: formData.get('description'),
      color: formData.get('color'),
      gradient: `linear-gradient(135deg, ${formData.get('color')}, ${formData.get('color2') || formData.get('color')})`
    };

    if (editingFeature !== null) {
      const newFeatures = [...features];
      newFeatures[editingFeature] = featureData;
      setFeatures(newFeatures);
    } else {
      setFeatures([...features, featureData]);
    }
    setEditingFeature(null);
    setIsAdding(false);
  };

  if (isAdding || editingFeature !== null) {
    const current = editingFeature !== null ? features[editingFeature] : null;
    // Extract base colors from gradient if possible, or use color
    const baseColor = current?.color || '#FFD700';

    return (
      <div className="edit-form-container">
        <h3>{editingFeature !== null ? 'Edit Feature' : 'Add New Feature'}</h3>
        <form onSubmit={handleSave} className="admin-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Icon (Emoji)</label>
              <input name="icon" defaultValue={current?.icon} required placeholder="👑" />
            </div>
            <div className="form-group">
              <label>Title</label>
              <input name="title" defaultValue={current?.title} required />
            </div>
            <div className="form-group">
              <label>Primary Color</label>
              <input type="color" name="color" defaultValue={current?.color || '#FFD700'} required />
            </div>
            <div className="form-group">
              <label>Secondary Color (for Gradient)</label>
              <input type="color" name="color2" defaultValue={current?.color || '#FFED4E'} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" defaultValue={current?.description} rows="3" required></textarea>
          </div>
          <div className="form-actions">
            <button type="submit" className="add-btn">Save Feature</button>
            <button type="button" className="delete-btn" onClick={() => { setEditingFeature(null); setIsAdding(false); }}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="manager-container">
      <div className="manager-actions">
        <button className="add-btn" onClick={() => setIsAdding(true)}>
          <span>+</span> Add Feature
        </button>
      </div>
      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Icon</th>
              <th>Title</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr key={index}>
                <td style={{ fontSize: '1.5rem' }}>{feature.icon}</td>
                <td>{feature.title}</td>
                <td style={{ maxWidth: '300px' }}>{feature.description}</td>
                <td className="action-btns">
                  <button className="edit-btn" onClick={() => setEditingFeature(index)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(index)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AboutUsManager;
