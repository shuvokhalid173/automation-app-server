const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Public auth endpoints
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

// Protected profile endpoint
router.get('/me', authenticateToken, authController.me.bind(authController));

module.exports = router;
