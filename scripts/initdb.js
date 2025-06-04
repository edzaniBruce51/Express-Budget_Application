#!/usr/bin/env node

/**
 * Database initialization script
 * Creates sample data for the budget tracker application
 */

// Load environment variables.
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/user');
const Category = require('../models/category');
const Budget = require('../models/budget');
const Expense = require('../models/expense');

// MongoDB connection
const mongoDB = process.env.MONGODB_URI || 'mongodb://localhost:27017/budget_tracker';

async function initializeDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoDB);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Budget.deleteMany({});
    await Expense.deleteMany({});
    console.log('Existing data cleared');

    // Create demo user
    console.log('Creating demo user...');
    const demoUser = new User({
      username: 'demo',
      password_hash: 'password123' // Will be hashed by pre-save middleware
    });
    await demoUser.save();
    console.log('Demo user created (username: demo, password: password123)');

    // Create categories
    console.log('Creating categories...');
    const categories = [
      { name: 'Food & Dining', description: 'Groceries, restaurants, takeout', color: '#FF6B6B', user: demoUser._id },
      { name: 'Transportation', description: 'Gas, public transport, car maintenance', color: '#4ECDC4', user: demoUser._id },
      { name: 'Shopping', description: 'Clothing, electronics, household items', color: '#45B7D1', user: demoUser._id },
      { name: 'Entertainment', description: 'Movies, games, subscriptions', color: '#96CEB4', user: demoUser._id },
      { name: 'Bills & Utilities', description: 'Rent, electricity, internet, phone', color: '#FFEAA7', user: demoUser._id },
      { name: 'Healthcare', description: 'Medical expenses, pharmacy, insurance', color: '#DDA0DD', user: demoUser._id },
      { name: 'Education', description: 'Books, courses, training', color: '#98D8C8', user: demoUser._id },
      { name: 'Travel', description: 'Vacation, business trips, hotels', color: '#F7DC6F', user: demoUser._id }
    ];

    const createdCategories = await Category.insertMany(categories);
    console.log(`Created ${createdCategories.length} categories`);

    // Create budgets
    console.log('Creating budgets...');
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const budgets = [
      {
        name: 'Monthly Food Budget',
        amount: 500,
        period: 'monthly',
        start_date: startOfMonth,
        end_date: endOfMonth,
        category: createdCategories[0]._id, // Food & Dining
        user: demoUser._id
      },
      {
        name: 'Transportation Budget',
        amount: 200,
        period: 'monthly',
        start_date: startOfMonth,
        end_date: endOfMonth,
        category: createdCategories[1]._id, // Transportation
        user: demoUser._id
      },
      {
        name: 'Entertainment Budget',
        amount: 150,
        period: 'monthly',
        start_date: startOfMonth,
        end_date: endOfMonth,
        category: createdCategories[3]._id, // Entertainment
        user: demoUser._id
      }
    ];

    const createdBudgets = await Budget.insertMany(budgets);
    console.log(`Created ${createdBudgets.length} budgets`);

    // Create sample expenses
    console.log('Creating sample expenses...');
    const expenses = [];
    
    // Generate expenses for the current month
    for (let i = 0; i < 20; i++) {
      const randomDay = Math.floor(Math.random() * currentDate.getDate()) + 1;
      const expenseDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), randomDay);
      const randomCategory = createdCategories[Math.floor(Math.random() * createdCategories.length)];
      
      const expenseData = {
        description: getRandomExpenseDescription(randomCategory.name),
        amount: Math.round((Math.random() * 100 + 10) * 100) / 100, // Random amount between $10-$110
        date: expenseDate,
        category: randomCategory._id,
        user: demoUser._id,
        payment_method: ['cash', 'credit_card', 'debit_card'][Math.floor(Math.random() * 3)]
      };
      
      expenses.push(expenseData);
    }

    const createdExpenses = await Expense.insertMany(expenses);
    console.log(`Created ${createdExpenses.length} sample expenses`);

    console.log('\n Database initialization complete!');
    console.log('\n Summary:');
    console.log(` Users: 1 (demo user)`);
    console.log(` Categories: ${createdCategories.length}`);
    console.log(` Budgets: ${createdBudgets.length}`);
    console.log(` Expenses: ${createdExpenses.length}`);
    console.log('\n You can now start the application with: npm run devstart');
    console.log(' Login with: username "demo", password "password123"');

  } catch (error) {
    console.error(' Error initializing database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log(' Database connection closed');
    process.exit(0);
  }
}

function getRandomExpenseDescription(categoryName) {
  const descriptions = {
    'Food & Dining': ['Grocery shopping', 'Lunch at cafe', 'Pizza delivery', 'Coffee shop', 'Restaurant dinner'],
    'Transportation': ['Gas station', 'Bus fare', 'Uber ride', 'Car maintenance', 'Parking fee'],
    'Shopping': ['Online purchase', 'Clothing store', 'Electronics', 'Home supplies', 'Gift purchase'],
    'Entertainment': ['Movie tickets', 'Streaming service', 'Concert tickets', 'Video game', 'Book purchase'],
    'Bills & Utilities': ['Electricity bill', 'Internet bill', 'Phone bill', 'Water bill', 'Rent payment'],
    'Healthcare': ['Pharmacy', 'Doctor visit', 'Dental checkup', 'Health insurance', 'Vitamins'],
    'Education': ['Online course', 'Textbook', 'Workshop fee', 'Certification', 'Training materials'],
    'Travel': ['Hotel booking', 'Flight ticket', 'Travel insurance', 'Vacation expense', 'Business trip']
  };
  
  const categoryDescriptions = descriptions[categoryName] || ['General expense'];
  return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
}

// Run the initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
