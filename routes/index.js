const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');

// Import middleware
const { requireAuth } = require('../middleware/auth');

// Import controllers
const dashboardController = require('../controllers/dashboardController');

// Home page - redirect to dashboard if authenticated, otherwise show landing page
router.get('/', asyncHandler(async (req, res, next) => {
  if (req.user) {
    res.redirect('/dashboard');
  } else {
    res.render('index', { 
      title: 'Budget Tracker',
      description: 'Take control of your finances with our easy-to-use budget tracking application.'
    });
  }
}));

// Dashboard route
router.get('/dashboard', requireAuth, dashboardController.dashboard_get);

module.exports = router;
