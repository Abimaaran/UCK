const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', coachController.getAll);
router.post('/', verifyAdmin, coachController.create);
router.put('/:id', verifyAdmin, coachController.update);
router.delete('/:id', verifyAdmin, coachController.remove);

module.exports = router;
