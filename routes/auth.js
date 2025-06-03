const express = require('express');
const router = express.Router();

// Import middleware
const { requireGuest } = require('../middleware/auth');

// Import controllers
const authController = require('../controllers/authController');

// Login routes
router.get('/login', requireGuest, authController.login_get);
router.post('/login', requireGuest, authController.login_post);

// Register routes
router.get('/register', requireGuest, authController.register_get);
router.post('/register', requireGuest, authController.register_post);

// Logout route
router.post('/logout', authController.logout_post);

module.exports = router;
