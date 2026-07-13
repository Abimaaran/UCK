// src/components/LoginSection.jsx
import React, { useState } from 'react';
import './LoginSection.css';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const APPROVED_KEY = 'chess_academy_approved_students';

const LoginSection = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(localStorage.getItem('isAdminLoggedIn') === 'true');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  React.useEffect(() => {
    const handleOpenModal = () => {
      console.log("LoginSection: Received showLoginModal event");
      setIsLogin(true);
      setIsOpen(true);
    };
    const handleOpenRegisterModal = () => {
      console.log("LoginSection: Received showRegisterModal event");
      setIsLogin(false);
      setIsOpen(true);
    };
    window.addEventListener('setPortalType', handleOpenModal);
    window.addEventListener('showLoginModal', handleOpenModal);
    window.addEventListener('showRegisterModal', handleOpenRegisterModal);
    return () => {
      window.removeEventListener('setPortalType', handleOpenModal);
      window.removeEventListener('showLoginModal', handleOpenModal);
      window.removeEventListener('showRegisterModal', handleOpenRegisterModal);
    };
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const [isRegistered, setIsRegistered] = useState(false);

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    const inputVal = loginId.trim();

    if (inputVal.includes('@')) {
      try {
        const response = await api.post('/auth/admin-login', {
          email: inputVal,
          password: password.trim()
        });
        
        if (response.data && response.data.token) {
          localStorage.setItem('isAdminLoggedIn', 'true');
          localStorage.setItem('adminToken', response.data.token);
          window.dispatchEvent(new Event('adminLogin'));
          navigate('/admin');
          return;
        }
      } catch (error) {
        setLoginError('Invalid Admin credentials. Check your database settings.');
      }
    } else {
      try {
        const response = await api.post('/students/login', {
          studentId: inputVal,
          password: password.trim()
        });

        if (response.data && response.data.student) {
          const student = response.data.student;
          localStorage.setItem('isStudentLoggedIn', 'true');
          localStorage.setItem('loggedInStudentId', String(student.studentId));
          window.dispatchEvent(new Event('studentLogin'));
          navigate('/student-portal');
        }
      } catch (error) {
        setLoginError('Invalid Student ID or Password. Please check your credentials.');
      }
    }
  };

  // ── NAVIGATION ─────────────────────────────────────────────────────────────
  const goToHome = () => {
    const homeSection = document.getElementById('home');
    if (homeSection) {
      homeSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const resetForm = () => {
    setLoginId('');
    setPassword('');
    setLoginError('');
    setIsRegistered(false);
  };

  // ── REGISTER ───────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    const newStudent = {
      name: `${formData.get('firstName')} ${formData.get('lastName')}`,
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      dob: formData.get('dob'),
      password: password,
      level: formData.get('level') || 'Beginner'
    };

    try {
      await api.post('/students/register', newStudent);
      setIsRegistered(true);
      e.target.reset();
    } catch (error) {
      console.error("Failed to register:", error);
      alert("Registration failed. Please try again.");
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay" onClick={() => setIsOpen(false)}>
      <div className="login-modal-content" onClick={e => e.stopPropagation()}>
        {/* Close Button "X" */}
        <button className="login-modal-close" onClick={() => setIsOpen(false)}>
          &times;
        </button>

        <div className="section-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h2 className="section-title" style={{ fontSize: '2rem', margin: 0, background: 'linear-gradient(45deg, var(--text-primary, #fff), var(--accent-gold, #d4af37))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {!isLogin ? 'Join the Academy' : 'Academy Portal'}
          </h2>
          <p className="section-subtitle" style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #aaa)', marginTop: '0.5rem' }}>
            {!isLogin ? 'Begin your royal chess journey today' : 'Secure login for authorized access'}
          </p>
        </div>

        <div>
          {isLogin ? (
            /* ── DUAL LOGIN FORM ── */
            <div className="login-form pulse-in">
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Student ID</label>
                  <input
                    type="text"
                    placeholder="Enter Student ID"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ width: '100%', paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.85rem',
                        background: 'none',
                        border: 'none',
                        color: showPassword ? 'var(--accent-gold, #d4af37)' : '#888',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="login-error-msg">
                    ❌ {loginError}
                  </div>
                )}

                <button type="submit" className="submit-btn portal-submit">
                  Login to Portal
                </button>
              </form>

              <div className="login-footer" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: '#aaa' }}>Don't have an account? </span>
                <button 
                  type="button" 
                  onClick={() => setIsLogin(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-gold, #d4af37)',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  Register Here
                </button>
              </div>
            </div>
          ) : (
            /* ── REGISTER FORM ──────────────────────────────── */
            isRegistered ? (
              <div className="registration-success-card pulse-in" style={{ textAlign: 'center' }}>
                <div className="success-icon">⏳</div>
                <h3>Registration Submitted</h3>
                <div className="success-details" style={{ fontSize: '0.9rem', color: '#ccc', margin: '1rem 0' }}>
                  <p>Your enrollment application has been sent for <strong>Admin Approval</strong>.</p>
                  <p>Once approved, you will be assigned a <strong>Student ID</strong> for login.</p>
                  <div className="credential-reminder" style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                    <p style={{ margin: 0 }}><strong>Your credentials:</strong> You can log in using your newly created password once approved.</p>
                  </div>
                </div>
                <button className="submit-btn" onClick={() => setIsLogin(true)}>
                  Proceed to Login
                </button>
                <button className="back-btn center" onClick={() => setIsOpen(false)}>
                  ← Close Gateway
                </button>
              </div>
            ) : (
              <div className="register-form fade-in">
                <button className="back-btn" onClick={() => setIsOpen(false)}>
                  ← Exit Registration
                </button>
                <h3>Create New Account</h3>
                <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '1.5rem' }}>
                  Please fill out the details below to request admission.
                </p>
                <form onSubmit={handleRegister}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input name="firstName" type="text" placeholder="First Name" required />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input name="lastName" type="text" placeholder="Last Name" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input name="email" type="email" placeholder="john@example.com" required />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input name="phone" type="tel" placeholder="Phone Number" />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input name="address" type="text" placeholder="Your full address" required />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth (DD/MM/YYYY)</label>
                    <input name="dob" type="date" placeholder="DD/MM/YYYY" required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Password</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input 
                          name="password" 
                          type={showRegisterPassword ? "text" : "password"} 
                          placeholder="Create a password" 
                          required 
                          style={{ width: '100%', paddingRight: '2.5rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          style={{
                            position: 'absolute',
                            right: '0.85rem',
                            background: 'none',
                            border: 'none',
                            color: showRegisterPassword ? 'var(--accent-gold, #d4af37)' : '#888',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {showRegisterPassword ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                              <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Confirm Password</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input 
                          name="confirmPassword" 
                          type={showRegisterPassword ? "text" : "password"} 
                          placeholder="Confirm password" 
                          required 
                          style={{ width: '100%', paddingRight: '2.5rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          style={{
                            position: 'absolute',
                            right: '0.85rem',
                            background: 'none',
                            border: 'none',
                            color: showRegisterPassword ? 'var(--accent-gold, #d4af37)' : '#888',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {showRegisterPassword ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                              <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Select Level</label>
                    <select name="level" required style={{ background: '#15151a', color: '#fff' }}>
                      <option value="" style={{ background: '#15151a', color: '#fff' }}>Choose a level</option>
                      <option value="Beginner" style={{ background: '#15151a', color: '#fff' }}>Beginner Level</option>
                      <option value="Intermediate" style={{ background: '#15151a', color: '#fff' }}>Intermediate Level</option>
                      <option value="Advanced" style={{ background: '#15151a', color: '#fff' }}>Advanced Level</option>
                    </select>
                  </div>
                  <div className="form-checkbox">
                    <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" required />
                      I agree to the Terms &amp; Conditions
                    </label>
                  </div>
                  <button type="submit" className="submit-btn" style={{ background: '#d4af37', color: '#000', marginTop: '1rem' }}>
                    Register &amp; Request Approval
                  </button>
                </form>

                <div className="register-footer" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: '#aaa' }}>Already have an account? </span>
                  <button 
                    type="button" 
                    onClick={() => setIsLogin(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-gold, #d4af37)',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    Login Here
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginSection;