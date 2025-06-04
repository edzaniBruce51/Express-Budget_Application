const User = require('../models/user');

// Middleware to get current user from session
const getCurrentUser = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.user = user;
        res.locals.user = user;
        res.locals.isAuthenticated = true;
      } else {
        // User not found, clear session
        req.session.userId = null;
        res.locals.isAuthenticated = false;
      }
    } else {
      res.locals.isAuthenticated = false;
    }
    next();
  } catch (error) {
    console.error('Error in getCurrentUser middleware:', error);
    res.locals.isAuthenticated = false;
    next();
  }
};

// Middleware to require authentication.
const requireAuth = (req, res, next) => {
  if (!req.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/auth/login');
  }
  next();
};

// Middleware to redirect authenticated users
const requireGuest = (req, res, next) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }
  next();
};

// Middleware to check if user owns resource
const requireOwnership = (resourceUserField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect('/auth/login');
    }
    
    // This middleware should be used after the resource is loaded
    // The resource should be available in req.resource or similar
    const resource = req.resource || req.category || req.budget || req.expense;
    
    if (!resource) {
      return res.status(404).render('error', { 
        message: 'Resource not found',
        error: { status: 404 }
      });
    }
    
    const resourceUserId = resource[resourceUserField];
    if (!resourceUserId || !resourceUserId.equals(req.user._id)) {
      return res.status(403).render('error', { 
        message: 'Access denied',
        error: { status: 403 }
      });
    }
    
    next();
  };
};

module.exports = {
  getCurrentUser,
  requireAuth,
  requireGuest,
  requireOwnership
};
