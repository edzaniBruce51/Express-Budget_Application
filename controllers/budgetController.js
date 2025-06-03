const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Budget = require('../models/budget');
const Category = require('../models/category');
const Expense = require('../models/expense');

// Display list of all budgets
const budget_list = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  
  try {
    const budgets = await Budget.find({ user: userId })
      .populate('category')
      .sort({ createdAt: -1 });

    // Calculate spending for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const expenses = await Expense.aggregate([
          {
            $match: {
              user: mongoose.Types.ObjectId(userId),
              category: budget.category._id,
              date: {
                $gte: budget.start_date,
                $lte: budget.end_date
              }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        const spent = expenses.length > 0 ? expenses[0].total : 0;
        const remaining = budget.amount - spent;
        const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        return {
          ...budget.toObject(),
          spent: spent.toFixed(2),
          remaining: remaining.toFixed(2),
          progress: Math.min(progress, 100).toFixed(1)
        };
      })
    );

    res.render('budget/list', {
      title: 'Budgets',
      budgets: budgetsWithSpending
    });

  } catch (error) {
    console.error('Budget list error:', error);
    res.render('budget/list', {
      title: 'Budgets',
      budgets: [],
      error: 'Unable to load budgets'
    });
  }
});

// Display budget create form
const budget_create_get = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Category.find({ user: req.user._id }).sort({ name: 1 });

    res.render('budget/form', {
      title: 'Create Budget',
      budget: null,
      categories,
      errors: []
    });

  } catch (error) {
    console.error('Budget create form error:', error);
    res.render('budget/form', {
      title: 'Create Budget',
      budget: null,
      categories: [],
      errors: [{ msg: 'Unable to load categories' }]
    });
  }
});

// Handle budget create form submission
const budget_create_post = [
  // Validate and sanitize fields
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Budget name must be between 1 and 100 characters')
    .escape(),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('period')
    .isIn(['weekly', 'monthly', 'yearly'])
    .withMessage('Invalid period selected'),
  body('start_date')
    .isISO8601()
    .withMessage('Invalid start date'),
  body('end_date')
    .isISO8601()
    .withMessage('Invalid end date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('category')
    .isMongoId()
    .withMessage('Invalid category selected'),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const categories = await Category.find({ user: req.user._id }).sort({ name: 1 });

    if (!errors.isEmpty()) {
      return res.render('budget/form', {
        title: 'Create Budget',
        budget: req.body,
        categories,
        errors: errors.array()
      });
    }

    try {
      // Verify category belongs to user
      const category = await Category.findOne({ 
        _id: req.body.category, 
        user: req.user._id 
      });

      if (!category) {
        return res.render('budget/form', {
          title: 'Create Budget',
          budget: req.body,
          categories,
          errors: [{ msg: 'Invalid category selected' }]
        });
      }

      const budget = new Budget({
        name: req.body.name,
        amount: req.body.amount,
        period: req.body.period,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        category: req.body.category,
        user: req.user._id
      });

      await budget.save();
      res.redirect('/budget');

    } catch (error) {
      console.error('Budget create error:', error);
      res.render('budget/form', {
        title: 'Create Budget',
        budget: req.body,
        categories,
        errors: [{ msg: 'Error creating budget. Please try again.' }]
      });
    }
  })
];

// Display budget detail
const budget_detail = asyncHandler(async (req, res, next) => {
  const budgetId = req.params.id;
  const userId = req.user._id;

  try {
    const budget = await Budget.findOne({ _id: budgetId, user: userId })
      .populate('category');

    if (!budget) {
      return res.status(404).render('error', {
        message: 'Budget not found',
        error: { status: 404 }
      });
    }

    // Get expenses for this budget
    const expenses = await Expense.find({
      user: userId,
      category: budget.category._id,
      date: {
        $gte: budget.start_date,
        $lte: budget.end_date
      }
    }).sort({ date: -1 });

    // Calculate totals
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remaining = budget.amount - totalSpent;
    const progress = budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0;

    res.render('budget/detail', {
      title: `Budget: ${budget.name}`,
      budget,
      expenses,
      stats: {
        totalSpent: totalSpent.toFixed(2),
        remaining: remaining.toFixed(2),
        progress: Math.min(progress, 100).toFixed(1),
        daysRemaining: budget.days_remaining
      }
    });

  } catch (error) {
    console.error('Budget detail error:', error);
    res.status(500).render('error', {
      message: 'Error loading budget details',
      error: { status: 500 }
    });
  }
});

module.exports = {
  budget_list,
  budget_create_get,
  budget_create_post,
  budget_detail
};
