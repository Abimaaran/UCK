const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.post('/admin-login', authController.adminLogin);
router.get('/verify', verifyAdmin, authController.verifyToken);

module.exports = router;
