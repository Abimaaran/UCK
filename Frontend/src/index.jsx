// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import RegistrationForm from './components/RegistrationForm';
import AdminDashboard from './components/Admin/AdminDashboard';
import StudentPortal from './components/StudentPortal';

import { ThemeProvider } from './context/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/register" element={<RegistrationForm />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/student-portal" element={<StudentPortal />} />
        </Routes>
      </Router>
    </ThemeProvider>
  </React.StrictMode>
);