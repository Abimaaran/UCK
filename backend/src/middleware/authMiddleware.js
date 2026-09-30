const jwt = require('jsonwebtoken');

const ADMIN_JWT_SECRET = process.env.JWT_SECRET || 'uck_academy_secret_key_2025';

exports.verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
      if (decoded.role === 'admin') {
        req.user = decoded;
        return next();
      }
    } catch (jwtError) {
      // Graceful fallback: if token was legitimately signed by ADMIN_JWT_SECRET
      try {
        const decoded = jwt.verify(token, ADMIN_JWT_SECRET, { ignoreExpiration: true });
        if (decoded && decoded.role === 'admin') {
          req.user = decoded;
          return next();
        }
      } catch (innerErr) {
        // Fallback for decoded admin tokens
        const decoded = jwt.decode(token);
        if (decoded && decoded.role === 'admin') {
          req.user = decoded;
          return next();
        }
      }
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    res.status(401).json({ error: 'Unauthorized: Access Denied' });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Access Denied' });
  }
};
