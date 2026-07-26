const supabase = require('../config/supabaseClient');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const ADMIN_JWT_SECRET = process.env.JWT_SECRET || 'uck_academy_secret_key_2025';

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !admin) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const isMatched = await bcrypt.compare(password, admin.password);

    if (isMatched) {
      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: 'admin' },
        ADMIN_JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.status(200).json({
        message: 'Admin login successful',
        token,
        email: admin.email
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
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    if (decoded.role === 'admin') {
      return res.status(200).json({ valid: true, admin: decoded });
    }
    return res.status(401).json({ valid: false, error: 'Invalid role' });
  } catch (error) {
    return res.status(401).json({ valid: false, error: 'Invalid token' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user?.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('id', adminId)
      .single();

    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    const isMatched = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatched) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHashed = await bcrypt.hash(newPassword, salt);

    await supabase
      .from('admins')
      .update({ password: newHashed })
      .eq('id', adminId);

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
