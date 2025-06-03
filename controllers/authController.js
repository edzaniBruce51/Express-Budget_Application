const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const User = require('../models/user');

// Display login form
const login_get = asyncHandler(async (req, res, next) => {
  res.render('auth/login', { 
    title: 'Login',
    errors: [],
    username: ''
  });
});

// Handle login form submission
const login_post = [
  // Validate and sanitize fields
  body('username')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Username is required')
    .escape(),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),

  asyncHandler(async (req, res, next) => {
    // Extract validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render('auth/login', {
        title: 'Login',
        errors: errors.array(),
        username: req.body.username
      });
    }

    const { username, password } = req.body;

    try {
      // Find user by username
      const user = await User.findOne({ username: username });

      if (!user) {
        return res.render('auth/login', {
          title: 'Login',
          errors: [{ msg: 'Invalid username or password' }],
          username: username
        });
      }

      // Check password
      const isValidPassword = await user.checkPassword(password);

      if (!isValidPassword) {
        return res.render('auth/login', {
          title: 'Login',
          errors: [{ msg: 'Invalid username or password' }],
          username: username
        });
      }

      // Login successful - create session
      req.session.userId = user._id;
      
      // Redirect to intended page or dashboard
      const redirectTo = req.session.returnTo || '/dashboard';
      delete req.session.returnTo;
      
      res.redirect(redirectTo);

    } catch (error) {
      console.error('Login error:', error);
      return res.render('auth/login', {
        title: 'Login',
        errors: [{ msg: 'An error occurred during login. Please try again.' }],
        username: username
      });
    }
  })
];

// Display registration form
const register_get = asyncHandler(async (req, res, next) => {
  res.render('auth/register', { 
    title: 'Register',
    errors: [],
    username: ''
  });
});

// Handle registration form submission
const register_post = [
  // Validate and sanitize fields
  body('username')
    .trim()
    .isLength({ min: 3, max: 80 })
    .withMessage('Username must be between 3 and 80 characters')
    .isAlphanumeric()
    .withMessage('Username must contain only letters and numbers')
    .escape(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirm_password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  asyncHandler(async (req, res, next) => {
    // Extract validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render('auth/register', {
        title: 'Register',
        errors: errors.array(),
        username: req.body.username
      });
    }

    const { username, password } = req.body;

    try {
      // Check if username already exists
      const existingUser = await User.findOne({ username: username });

      if (existingUser) {
        return res.render('auth/register', {
          title: 'Register',
          errors: [{ msg: 'Username already exists' }],
          username: username
        });
      }

      // Create new user
      const user = new User({
        username: username,
        password_hash: password // Will be hashed by pre-save middleware
      });

      await user.save();

      // Auto-login after registration
      req.session.userId = user._id;
      
      res.redirect('/dashboard');

    } catch (error) {
      console.error('Registration error:', error);
      return res.render('auth/register', {
        title: 'Register',
        errors: [{ msg: 'An error occurred during registration. Please try again.' }],
        username: username
      });
    }
  })
];

// Handle logout
const logout_post = asyncHandler(async (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/dashboard');
    }
    res.clearCookie('connect.sid'); // Clear session cookie
    res.redirect('/');
  });
});

module.exports = {
  login_get,
  login_post,
  register_get,
  register_post,
  logout_post
};
