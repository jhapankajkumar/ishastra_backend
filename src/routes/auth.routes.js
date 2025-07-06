const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateAuth } = require('../middleware/validation.middleware');

router.post('/register', validateAuth, authController.register);
router.post('/login', validateAuth, authController.login);

module.exports = router;