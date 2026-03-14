const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', coachController.getAll);
router.post('/', coachController.create);
router.put('/:id', coachController.update);
router.delete('/:id', coachController.remove);

module.exports = router;
