const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const approvalRoutes = require('./src/routes/approvalRoutes');
const coachRoutes = require('./src/routes/coachRoutes');
const tournamentRoutes = require('./src/routes/tournamentRoutes');
const achievementRoutes = require('./src/routes/achievementRoutes');
const timetableRoutes = require('./src/routes/timetableRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');
const feeRoutes = require('./src/routes/feeRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const aboutRoutes = require('./src/routes/aboutRoutes');
const userRoutes = require('./src/routes/userRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes); // also used for attendance, fees, reviews routes where required
app.use('/api/approval', approvalRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/users', userRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

module.exports = app;
