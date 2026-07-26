const express = require('express');
const router = express.Router();
const controller = require('../controllers/feeController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', controller.getAll);
router.get('/:studentId', controller.getByStudent);
router.post('/', controller.create);
router.put('/:studentId', controller.update);

// Bulk Fee Updates & Automated WhatsApp reminders
router.post('/mark-all-paid', verifyAdmin, controller.markAllAsPaid);
router.post('/send-reminders', verifyAdmin, controller.sendWhatsAppReminders);
router.get('/reminder-status/latest', verifyAdmin, controller.getReminderStatus);
router.post('/cron-send-reminders', controller.cronSendWhatsAppReminders);

module.exports = router;
