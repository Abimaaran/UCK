const express = require('express');
const router = express.Router();
const controller = require('../controllers/reviewController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', controller.getAll);
router.get('/:studentId', controller.getByStudent);
router.post('/', controller.create);
router.put('/:studentId', controller.update);

module.exports = router;
