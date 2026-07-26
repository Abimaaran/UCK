const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.post('/register', studentController.register);
router.post('/', studentController.register);
router.get('/', studentController.getAll);
router.get('/pending', studentController.getPending);
router.put('/:id', studentController.update);
router.delete('/:id', studentController.delete);
router.post('/login', studentController.login);
router.get('/:studentId/profile', studentController.getProfile);

module.exports = router;
