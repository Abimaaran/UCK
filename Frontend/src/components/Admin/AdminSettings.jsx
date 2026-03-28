import React, { useState } from 'react';
import { FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import api from '../../services/api';
import './AdminSettings.css';

const AdminSettings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'New password must be at least 6 characters long' });
      return;
    }

    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (response.status === 200) {
        setStatus({ type: 'success', message: 'Password successfully updated!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Optional: Hide the success message after some seconds
        setTimeout(() => setStatus({ type: '', message: '' }), 5000);
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.error || 'Failed to update security settings.';
      setStatus({ type: 'error', message: errorMessage });
    }
  };

  const toggleVisibility = (setter, currentVal) => {
    setter(!currentVal);
  };

  return (
    <div className="settings-wrapper">
      <div className="settings-header">
        <h2>Security Settings</h2>
        <p>Manage your administrative access and credentials</p>
      </div>

      <div className="settings-card">
        <div className="settings-title">
          <div className="settings-icon-wrapper">
            <FaShieldAlt className="settings-icon" />
          </div>
          <h3>Change Admin Password</h3>
        </div>
        
        {status.message && (
          <div className={`settings-alert ${status.type}`}>
            {status.type === 'error' ? (
              <FaExclamationCircle className="alert-icon" />
            ) : (
              <FaCheckCircle className="alert-icon" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div className="settings-form-group">
            <label>Current Password</label>
            <div className="input-with-icon">
              <FaLock className="input-icon" />
              <input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="settings-input with-toggle"
                required
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => toggleVisibility(setShowCurrentPassword, showCurrentPassword)}
                tabIndex="-1"
              >
                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <div className="settings-form-group">
            <label>New Password</label>
            <div className="input-with-icon">
              <FaLock className="input-icon" />
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Secure new password (min. 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="settings-input with-toggle"
                required
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => toggleVisibility(setShowNewPassword, showNewPassword)}
                tabIndex="-1"
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="settings-form-group">
            <label>Confirm New Password</label>
            <div className="input-with-icon">
              <FaLock className="input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="settings-input with-toggle"
                required
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => toggleVisibility(setShowConfirmPassword, showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="settings-submit-btn">
            Update Security Credentials
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
