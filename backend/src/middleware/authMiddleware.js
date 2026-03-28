const { auth } = require('../config/firebaseAdmin');
const jwt = require('jsonwebtoken');

// Matching the secret used in authController
const ADMIN_JWT_SECRET = process.env.JWT_SECRET || 'uck_academy_secret_key_2025';

exports.verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // 1. Try to verify it as a Local Admin JWT
    try {
      const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
      if (decoded.role === 'admin') {
        req.user = decoded;
        return next();
      }
    } catch (jwtError) {
      // Not a valid local JWT, move to Firebase check
    }

    // 2. Try to verify it as a Firebase ID Token (Fallback)
    try {
      const decodedToken = await auth.verifyIdToken(token);
      req.user = decodedToken;
      
      // If student token is used, but student has admin custom claims, allow it.
      if (decodedToken.admin === true || decodedToken.role === 'admin') {
         return next();
      }
    } catch (fbError) {
      // Fail both checks
    }

    res.status(401).json({ error: 'Unauthorized: Invalid Admin Token' });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Access Denied' });
  }
};
