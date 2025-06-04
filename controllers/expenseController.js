const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/expense');
const Category = require('../models/category');

// Display list of all expenses.
const expense_list = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  try {
    const totalExpenses = await Expense.countDocuments({ user: req.user._id });
    const expenses = await Expense.find({ user: req.user._id })
      .populate('category')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalExpenses / limit);

    res.render('expense/list', {
      title: 'Expenses',
      expenses,
      pagination: {
        currentPage: page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page + 1,
        prevPage: page - 1
      },
      totalExpenses
    });

  } catch (error) {
    console.error('Expense list error:', error);
    res.render('expense/list', {
      title: 'Expenses',
      expenses: [],
      pagination: { currentPage: 1, totalPages: 1, hasNext: false, hasPrev: false },
      totalExpenses: 0,
      error: 'Unable to load expenses'
    });
  }
});

// Display expense create form
const expense_create_get = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Category.find({ user: req.user._id }).sort({ name: 1 });

    res.render('expense/form', {
      title: 'Add Expense',
      expense: null,
      categories,
      errors: []
    });

  } catch (error) {
    console.error('Expense create form error:', error);
    res.render('expense/form', {
      title: 'Add Expense',
      expense: null,
      categories: [],
      errors: [{ msg: 'Unable to load categories' }]
    });
  }
});

// Handle expense create form submission
const expense_create_post = [
  // Validate and sanitize fields
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters')
    .escape(),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('date')
    .isISO8601()
    .withMessage('Invalid date'),
  body('category')
    .isMongoId()
    .withMessage('Invalid category selected'),
  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
    .escape(),
  body('payment_method')
    .isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'other'])
    .withMessage('Invalid payment method'),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const categories = await Category.find({ user: req.user._id }).sort({ name: 1 });

    if (!errors.isEmpty()) {
      return res.render('expense/form', {
        title: 'Add Expense',
        expense: req.body,
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
        return res.render('expense/form', {
          title: 'Add Expense',
          expense: req.body,
          categories,
          errors: [{ msg: 'Invalid category selected' }]
        });
      }

      const expense = new Expense({
        description: req.body.description,
        amount: req.body.amount,
        date: req.body.date,
        category: req.body.category,
        user: req.user._id,
        notes: req.body.notes,
        payment_method: req.body.payment_method
      });

      await expense.save();
      res.redirect('/budget/expenses');

    } catch (error) {
      console.error('Expense create error:', error);
      res.render('expense/form', {
        title: 'Add Expense',
        expense: req.body,
        categories,
        errors: [{ msg: 'Error creating expense. Please try again.' }]
      });
    }
  })
];

// Display expense detail
const expense_detail = asyncHandler(async (req, res, next) => {
  const expenseId = req.params.id;

  try {
    const expense = await Expense.findOne({ 
      _id: expenseId, 
      user: req.user._id 
    }).populate('category');

    if (!expense) {
      return res.status(404).render('error', {
        message: 'Expense not found',
        error: { status: 404 }
      });
    }

    res.render('expense/detail', {
      title: `Expense: ${expense.description}`,
      expense
    });

  } catch (error) {
    console.error('Expense detail error:', error);
    res.status(500).render('error', {
      message: 'Error loading expense details',
      error: { status: 500 }
    });
  }
});

// Display expense update form
const expense_update_get = asyncHandler(async (req, res, next) => {
  const expenseId = req.params.id;

  try {
    const expense = await Expense.findOne({ 
      _id: expenseId, 
      user: req.user._id 
    });
    const categories = await Category.find({ user: req.user._id }).sort({ name: 1 });

    if (!expense) {
      return res.status(404).render('error', {
        message: 'Expense not found',
        error: { status: 404 }
      });
    }

    // Format date for HTML input
    const formattedExpense = {
      ...expense.toObject(),
      date: expense.date.toISOString().split('T')[0]
    };

    res.render('expense/form', {
      title: 'Edit Expense',
      expense: formattedExpense,
      categories,
      errors: []
    });

  } catch (error) {
    console.error('Expense update form error:', error);
    res.status(500).render('error', {
      message: 'Error loading expense',
      error: { status: 500 }
    });
  }
});

// Handle expense update form submission
const expense_update_post = [
  // Validate and sanitize fields (same as create)
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters')
    .escape(),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('date')
    .isISO8601()
    .withMessage('Invalid date'),
  body('category')
    .isMongoId()
    .withMessage('Invalid category selected'),
  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
    .escape(),
  body('payment_method')
    .isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'other'])
    .withMessage('Invalid payment method'),

  asyncHandler(async (req, res, next) => {
    const expenseId = req.params.id;
    const errors = validationResult(req);
    const categories = await Category.find({ user: req.user._id }).sort({ name: 1 });

    if (!errors.isEmpty()) {
      const expense = { ...req.body, _id: expenseId };
      return res.render('expense/form', {
        title: 'Edit Expense',
        expense,
        categories,
        errors: errors.array()
      });
    }

    try {
      const expense = await Expense.findOne({ 
        _id: expenseId, 
        user: req.user._id 
      });

      if (!expense) {
        return res.status(404).render('error', {
          message: 'Expense not found',
          error: { status: 404 }
        });
      }

      // Verify category belongs to user
      const category = await Category.findOne({ 
        _id: req.body.category, 
        user: req.user._id 
      });

      if (!category) {
        return res.render('expense/form', {
          title: 'Edit Expense',
          expense: { ...req.body, _id: expenseId },
          categories,
          errors: [{ msg: 'Invalid category selected' }]
        });
      }

      // Update expense
      expense.description = req.body.description;
      expense.amount = req.body.amount;
      expense.date = req.body.date;
      expense.category = req.body.category;
      expense.notes = req.body.notes;
      expense.payment_method = req.body.payment_method;

      await expense.save();
      res.redirect(`/budget/expense/${expenseId}`);

    } catch (error) {
      console.error('Expense update error:', error);
      res.render('expense/form', {
        title: 'Edit Expense',
        expense: { ...req.body, _id: expenseId },
        categories,
        errors: [{ msg: 'Error updating expense. Please try again.' }]
      });
    }
  })
];

// Handle expense delete
const expense_delete_post = asyncHandler(async (req, res, next) => {
  const expenseId = req.params.id;

  try {
    const expense = await Expense.findOne({ 
      _id: expenseId, 
      user: req.user._id 
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await Expense.findByIdAndDelete(expenseId);
    res.redirect('/budget/expenses');

  } catch (error) {
    console.error('Expense delete error:', error);
    res.status(500).json({ error: 'Error deleting expense' });
  }
});

module.exports = {
  expense_list,
  expense_create_get,
  expense_create_post,
  expense_detail,
  expense_update_get,
  expense_update_post,
  expense_delete_post
};
