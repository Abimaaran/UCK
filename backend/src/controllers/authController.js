const { db, auth } = require('../config/firebaseAdmin');

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Note: Firebase Admin SDK doesn't support password verification directly. 
    // Usually, the frontend authenticates with Firebase Client SDK and sends an ID token to the backend.
    // However, if you want REST API login, you'd verify the token here using auth.verifyIdToken(token)
    res.status(200).json({ message: 'Admin login endpoint. Handle authentication via Client SDK and verify token here.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    // Verified by authMiddleware
    res.status(200).json({ message: 'Token is valid', user: req.user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
