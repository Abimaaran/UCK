const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.post('/approve/:id', approvalController.approveStudent);
router.post('/reject/:id', approvalController.rejectStudent);

module.exports = router;
