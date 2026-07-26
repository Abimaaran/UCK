const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');

router.post('/approve/:id', approvalController.approveStudent);
router.post('/reject/:id', approvalController.declineStudent);

module.exports = router;
