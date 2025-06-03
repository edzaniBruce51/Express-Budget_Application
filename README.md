# Express Budget Tracker

A personal budget tracking application built with Express.js, migrated from Flask following Express.js best practices.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and session secret
   ```

3. **Initialize database with sample data:**
   ```bash
   npm run initdb
   ```

4. **Start the application:**
   ```bash
   npm run devstart
   ```

5. **Access the app:**
   Open http://localhost:3000 and login with:
   - Username: `demo`
   - Password: `password123`

## ✨ Features

- **User Authentication**: Secure registration and login
- **Expense Tracking**: Add, edit, delete expenses with categories
- **Budget Management**: Create budgets with progress monitoring
- **Dashboard Analytics**: Visual charts and spending summaries
- **Responsive Design**: Mobile-friendly Bootstrap interface

## 🏗️ Architecture

Built following Express.js MVC pattern:
- **Models**: Mongoose schemas for MongoDB
- **Views**: Pug templates with Bootstrap
- **Controllers**: Business logic separated by feature
- **Routes**: Modular Express routers
- **Middleware**: Authentication and validation

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, Mongoose
- **Database**: MongoDB
- **Frontend**: Pug, Bootstrap 5, Chart.js
- **Authentication**: Express sessions with bcryptjs
- **Validation**: express-validator

## 📁 Project Structure

```
express-budget-tracker/
├── controllers/     # Business logic
├── models/         # Database schemas
├── routes/         # Express routes
├── views/          # Pug templates
├── middleware/     # Custom middleware
├── public/         # Static assets
└── scripts/        # Utility scripts
```

## 🔧 Development

- `npm run devstart` - Development with auto-restart
- `npm start` - Production mode
- `npm run initdb` - Initialize sample data

## 📝 Migration Notes

Successfully migrated from Flask to Express.js:
- ✅ SQLite → MongoDB
- ✅ SQLAlchemy → Mongoose
- ✅ Flask-Login → Express sessions
- ✅ WTForms → express-validator
- ✅ Jinja2 → Pug templates
- ✅ Enhanced security and performance
