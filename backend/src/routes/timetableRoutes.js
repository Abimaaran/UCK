const express = require('express');
const router = express.Router();
const controller = require('../controllers/timetableController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
