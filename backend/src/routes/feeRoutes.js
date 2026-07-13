const express = require('express');
const router = express.Router();
const controller = require('../controllers/feeController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', controller.getAll);
router.get('/:studentId', controller.getByStudent);
router.post('/', controller.create);
router.put('/:studentId', controller.update);

// Automated WhatsApp reminders
router.post('/send-reminders', verifyAdmin, controller.sendWhatsAppReminders);
router.post('/cron-send-reminders', controller.cronSendWhatsAppReminders);

module.exports = router;
