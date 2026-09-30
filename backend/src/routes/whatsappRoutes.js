const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Force Connect / Re-initialize WhatsApp (Protected to Admin)
router.post('/connect', verifyAdmin, async (req, res) => {
  try {
    await whatsappService.initialize(true);
    res.status(200).json({ status: whatsappService.getStatus(), error: whatsappService.getError() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get connection status (Protected to Admin)
router.get('/status', verifyAdmin, (req, res) => {
  const currentStatus = whatsappService.getStatus();
  if (currentStatus === 'DISCONNECTED') {
    whatsappService.initialize();
  }
  res.status(200).json({ 
    status: whatsappService.getStatus(), 
    qr: whatsappService.getQR(), 
    error: whatsappService.getError() 
  });
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

// Logout / Disconnect WhatsApp session (Protected to Admin)
const handleLogout = async (req, res) => {
  try {
    await whatsappService.logout();
    res.status(200).json({ message: 'Disconnected successfully', status: 'DISCONNECTED' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

router.post('/logout', verifyAdmin, handleLogout);
router.post('/disconnect', verifyAdmin, handleLogout);

module.exports = router;
