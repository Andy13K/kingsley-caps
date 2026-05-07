const express = require('express');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
