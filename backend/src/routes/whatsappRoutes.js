const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Get connection status (Protected to Admin)
router.get('/status', verifyAdmin, (req, res) => {
  res.status(200).json({ status: whatsappService.getStatus() });
});

// Get QR code data URL (Protected to Admin)
router.get('/qr', verifyAdmin, (req, res) => {
  const status = whatsappService.getStatus();
  if (status === 'QR_READY') {
    res.status(200).json({ qr: whatsappService.getQR() });
  } else {
    res.status(200).json({ qr: null, status });
  }
});

// Logout WhatsApp session (Protected to Admin)
router.post('/logout', verifyAdmin, async (req, res) => {
  try {
    await whatsappService.logout();
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
