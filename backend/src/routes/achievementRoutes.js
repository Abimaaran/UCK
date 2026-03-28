const express = require('express');
const router = express.Router();
const controller = require('../controllers/achievementController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', controller.getAll);
router.post('/', verifyAdmin, controller.create);
router.put('/:id', verifyAdmin, controller.update);
router.delete('/:id', verifyAdmin, controller.remove);

module.exports = router;
