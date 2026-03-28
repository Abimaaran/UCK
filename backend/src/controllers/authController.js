const { db, auth } = require('../config/firebaseAdmin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Secret for signing admin JWT - in production, move this to .env
const ADMIN_JWT_SECRET = process.env.JWT_SECRET || 'uck_academy_secret_key_2025';

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Look up in Firestore 'admins' collection
    const adminSnapshot = await db.collection('admins')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (adminSnapshot.empty) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const adminDoc = adminSnapshot.docs[0];
    const adminData = adminDoc.data();

    // Verify password with Bcrypt
    const isMatched = await bcrypt.compare(password, adminData.password);

    if (isMatched) {
      // Issue a real JWT to protect routes
      const token = jwt.sign(
        { id: adminDoc.id, email: adminData.email, role: 'admin' }, 
        ADMIN_JWT_SECRET, 
        { expiresIn: '8h' }
      );

      res.status(200).json({ 
        message: 'Admin login successful', 
        token,
        email: adminData.email 
      });
    } else {
      res.status(401).json({ error: 'Invalid admin credentials.' });
    }
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

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminEmail = req.user.email; // From verifyAdmin middleware

    if (!adminEmail || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Fetch current admin record
    const adminSnapshot = await db.collection('admins')
      .where('email', '==', adminEmail.toLowerCase().trim())
      .limit(1)
      .get();

    if (adminSnapshot.empty) {
      return res.status(404).json({ error: 'Admin account not found' });
    }

    const adminDocRef = adminSnapshot.docs[0].ref;
    const adminData = adminSnapshot.docs[0].data();

    // 2. Verify current password
    const isMatched = await bcrypt.compare(currentPassword, adminData.password);
    if (!isMatched) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    // 3. Hash the new password and update
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    await adminDocRef.update({
      password: hashedNewPassword,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
};
