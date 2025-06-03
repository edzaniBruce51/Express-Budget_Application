const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');

// Load environment variables
require('dotenv').config();

// Import routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const budgetRouter = require('./routes/budget');

const app = express();

// Set up mongoose connection
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

// Use environment variable for MongoDB connection string
const mongoDB = process.env.MONGODB_URI || 'mongodb://localhost:27017/budget_tracker';

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
  console.log('Connected to MongoDB');
}

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware.
const { getCurrentUser } = require('./middleware/auth');
app.use(getCurrentUser);

// Routes
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/budget', budgetRouter);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
