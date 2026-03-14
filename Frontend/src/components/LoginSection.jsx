// src/components/LoginSection.jsx
import React, { useState } from 'react';
import './LoginSection.css';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const APPROVED_KEY = 'chess_academy_approved_students';

const LoginSection = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [portalType, setPortalType] = useState(null); // null | 'admin' | 'student'
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(localStorage.getItem('isAdminLoggedIn') === 'true');

  React.useEffect(() => {
    const handleSetPortal = (e) => {
      setIsLogin(true);
      setPortalType(e.detail);
    };
    window.addEventListener('setPortalType', handleSetPortal);
    return () => window.removeEventListener('setPortalType', handleSetPortal);
  }, []);

  const [isRegistered, setIsRegistered] = useState(false);

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (portalType === 'admin') {
      // Admin login (email + static password)
      const isAdmin =
        (loginId === 'admin@uck.com' && password === 'admin123') ||
        (loginId === 'uncrownedkings2025@gmail.com' && password === 'UCK2025');

      if (isAdmin) {
        localStorage.setItem('isAdminLoggedIn', 'true');
        // Admin token simulation, usually backend returns JWT here
        localStorage.setItem('adminToken', 'simulated_admin_token'); 
        window.dispatchEvent(new Event('adminLogin'));
        navigate('/admin');
        return;
      } else {
        setLoginError('Invalid Admin credentials. Please try again.');
      }
    } else if (portalType === 'student') {
      try {
        const response = await api.post('/students/login', {
          studentId: loginId.trim(),
          dob: password.trim()
        });
        
        if (response.data && response.data.student) {
          const student = response.data.student;
          localStorage.setItem('isStudentLoggedIn', 'true');
          localStorage.setItem('loggedInStudentId', String(student.studentId));
          window.dispatchEvent(new Event('studentLogin'));
          navigate('/student-portal');
        }
      } catch (error) {
         setLoginError('Invalid Student ID or Date of Birth. Please check your credentials.');
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
    setPortalType(null);
    setLoginId('');
    setPassword('');
    setLoginError('');
    setIsRegistered(false);
  };

  // ── REGISTER ───────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const dob = formData.get('dob');
    if (!dob) {
      alert('Please enter your Date of Birth. It will be used as your portal password.');
      return;
    }

    const newStudent = {
      name: `${formData.get('firstName')} ${formData.get('lastName')}`,
      email: formData.get('email'),
      phone: formData.get('phone'),
      dob,
      level: formData.get('course') || 'Beginner'
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
  return (
    <section className="login-section" id="login">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">
            {!isLogin ? 'Join the Academy' :
              !portalType ? 'Select Your Portal' :
                portalType === 'admin' ? 'Admin Login' : 'Student Gateway'}
          </h2>
          <p className="section-subtitle">
            {!isLogin ? 'Begin your royal chess journey today' :
              !portalType ? 'Choose the gateway to access your dashboard' :
                'Secure login for authorized access'}
          </p>
        </div>

        <div className="login-toggle">
          <button
            className={`toggle-btn ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); resetForm(); }}
          >
            Login
          </button>
          <button
            className={`toggle-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); resetForm(); }}
          >
            Register
          </button>
        </div>

        <div className="login-form-container">
          {isLogin ? (
            /* ── LOGIN SECTION ── */
            !portalType ? (
              /* ── PORTAL SELECTION ── */
              <div className="portal-selection-wrapper">
                <button className="back-btn" style={{ marginBottom: '2rem' }} onClick={goToHome}>
                  ← Exit Gateway
                </button>
                <div className="portal-selection" style={{ display: 'flex', justifyContent: 'center' }}>
                  <div className="portal-card student" onClick={() => setPortalType('student')} style={{ maxWidth: '400px', width: '100%' }}>
                    <div className="portal-card-icon">🎓</div>
                    <h3>Student Portal</h3>
                    <p>Access your classes, tournaments and achievements</p>
                    <button className="select-portal-btn">Access Student Login</button>
                  </div>
                </div>
              </div>
            ) : (
              /* ── ACTUAL LOGIN FORM ── */
              <div className="login-form pulse-in">
                <button className="back-btn" onClick={() => setPortalType(null)}>
                  ← Back to Portals
                </button>
                <h3>{portalType === 'admin' ? 'Admin Login' : 'Student Login'}</h3>
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label>
                      {portalType === 'admin' ? 'Email Address' : 'Student ID'}
                    </label>
                    <input
                      type={portalType === 'admin' ? 'email' : 'text'}
                      placeholder={portalType === 'admin' ? 'admin@uck.com' : 'e.g. 1005'}
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      {portalType === 'admin' ? 'Password' : 'Date of Birth'}
                    </label>
                    <input
                      type={portalType === 'admin' ? 'password' : 'text'}
                      placeholder={portalType === 'admin' ? 'Enter password' : 'YYYY-MM-DD'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {loginError && (
                    <div className="login-error-msg">
                      ❌ {loginError}
                    </div>
                  )}

                  <div className="form-options">
                    <label className="remember-me">
                      <input type="checkbox" />
                      Remember me
                    </label>
                    <a href="#contact" className="forgot-password">Need help?</a>
                  </div>

                  <button type="submit" className="submit-btn portal-submit">
                    Login to {portalType === 'admin' ? 'Admin' : 'Student'} Portal
                  </button>
                </form>
              </div>
            )
          ) : (
            /* ── REGISTER FORM ──────────────────────────────── */
            isRegistered ? (
              <div className="registration-success-card pulse-in">
                <div className="success-icon">⏳</div>
                <h3>Registration Submitted</h3>
                <div className="success-details">
                  <p>Your enrollment application has been sent for <strong>Admin Approval</strong>.</p>
                  <p>Once approved, you will be assigned a <strong>Student ID</strong> for login.</p>
                  <div className="credential-reminder">
                    <p><strong>Your Password:</strong> The Date of Birth provided during registration.</p>
                  </div>
                </div>
                <button className="submit-btn" onClick={() => setIsLogin(true)}>
                  Proceed to Login
                </button>
                <button className="back-btn center" onClick={goToHome}>
                  ← Back to Homepage
                </button>
              </div>
            ) : (
              <div className="register-form fade-in">
                <button className="back-btn" onClick={goToHome}>
                  ← Exit Registration
                </button>
                <h3>Create New Account</h3>
                <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '1.5rem' }}>
                  Your <strong style={{ color: '#d4af37' }}>Date of Birth</strong> will be used as your portal password once approved.
                </p>
                <form onSubmit={handleRegister}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input name="firstName" type="text" placeholder="John" required />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input name="lastName" type="text" placeholder="Doe" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input name="email" type="email" placeholder="john@example.com" required />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input name="phone" type="tel" placeholder="+91 98765 43210" />
                  </div>
                  <div className="form-group">
                    <label>
                      Date of Birth
                      <span className="dob-hint">
                        🔑 This will be your password
                      </span>
                    </label>
                    <input name="dob" type="date" required />
                  </div>
                  <div className="form-group">
                    <label>Select Course</label>
                    <select name="course">
                      <option value="">Choose a course</option>
                      <option value="Beginner">Beginner Level</option>
                      <option value="Intermediate">Intermediate Level</option>
                      <option value="Advanced">Advanced Level</option>
                      <option value="Tournament">Tournament Preparation</option>
                    </select>
                  </div>
                  <div className="form-checkbox">
                    <label>
                      <input type="checkbox" required />
                      I agree to the Terms &amp; Conditions
                    </label>
                  </div>
                  <button type="submit" className="submit-btn" style={{ background: '#d4af37', color: '#000' }}>
                    Register &amp; Request Approval
                  </button>
                </form>
              </div>
            )
          )}
        </div>

        <div className="login-info">
          <p>Questions? <a href="#contact">Contact Support</a></p>
        </div>
      </div>
    </section>
  );
};

export default LoginSection;