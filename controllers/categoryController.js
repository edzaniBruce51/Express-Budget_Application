const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const Category = require('../models/category');
const Expense = require('../models/expense');
const Budget = require('../models/budget');

// Display list of all categories.
const category_list = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Category.find({ user: req.user._id })
      .sort({ name: 1 });

    // Get expense count for each category
    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        const expenseCount = await Expense.countDocuments({ 
          category: category._id, 
          user: req.user._id 
        });
        const budgetCount = await Budget.countDocuments({ 
          category: category._id, 
          user: req.user._id 
        });

        return {
          ...category.toObject(),
          expenseCount,
          budgetCount
        };
      })
    );

    res.render('category/list', {
      title: 'Categories',
      categories: categoriesWithStats
    });

  } catch (error) {
    console.error('Category list error:', error);
    res.render('category/list', {
      title: 'Categories',
      categories: [],
      error: 'Unable to load categories'
    });
  }
});

// Display category create form
const category_create_get = asyncHandler(async (req, res, next) => {
  res.render('category/form', {
    title: 'Create Category',
    category: null,
    errors: []
  });
});

// Handle category create form submission
const category_create_post = [
  // Validate and sanitize fields
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category name must be between 1 and 50 characters')
    .escape(),
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters')
    .escape(),
  body('color')
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code'),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render('category/form', {
        title: 'Create Category',
        category: req.body,
        errors: errors.array()
      });
    }

    try {
      // Check if category name already exists for this user
      const existingCategory = await Category.findOne({
        name: req.body.name,
        user: req.user._id
      });

      if (existingCategory) {
        return res.render('category/form', {
          title: 'Create Category',
          category: req.body,
          errors: [{ msg: 'Category name already exists' }]
        });
      }

      const category = new Category({
        name: req.body.name,
        description: req.body.description,
        color: req.body.color,
        user: req.user._id
      });

      await category.save();
      res.redirect('/budget/categories');

    } catch (error) {
      console.error('Category create error:', error);
      res.render('category/form', {
        title: 'Create Category',
        category: req.body,
        errors: [{ msg: 'Error creating category. Please try again.' }]
      });
    }
  })
];

// Display category detail
const category_detail = asyncHandler(async (req, res, next) => {
  const categoryId = req.params.id;

  try {
    const category = await Category.findOne({ 
      _id: categoryId, 
      user: req.user._id 
    });

    if (!category) {
      return res.status(404).render('error', {
        message: 'Category not found',
        error: { status: 404 }
      });
    }

    // Get recent expenses for this category
    const expenses = await Expense.find({ 
      category: categoryId, 
      user: req.user._id 
    })
    .sort({ date: -1 })
    .limit(10);

    // Get budgets for this category
    const budgets = await Budget.find({ 
      category: categoryId, 
      user: req.user._id 
    })
    .sort({ createdAt: -1 });

    // Calculate total spent
    const totalSpent = await Expense.aggregate([
      {
        $match: {
          category: category._id,
          user: req.user._id
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalAmount = totalSpent.length > 0 ? totalSpent[0].total : 0;

    res.render('category/detail', {
      title: `Category: ${category.name}`,
      category,
      expenses,
      budgets,
      totalSpent: totalAmount.toFixed(2)
    });

  } catch (error) {
    console.error('Category detail error:', error);
    res.status(500).render('error', {
      message: 'Error loading category details',
      error: { status: 500 }
    });
  }
});

// Display category update form
const category_update_get = asyncHandler(async (req, res, next) => {
  const categoryId = req.params.id;

  try {
    const category = await Category.findOne({ 
      _id: categoryId, 
      user: req.user._id 
    });

    if (!category) {
      return res.status(404).render('error', {
        message: 'Category not found',
        error: { status: 404 }
      });
    }

    res.render('category/form', {
      title: 'Edit Category',
      category,
      errors: []
    });

  } catch (error) {
    console.error('Category update form error:', error);
    res.status(500).render('error', {
      message: 'Error loading category',
      error: { status: 500 }
    });
  }
});

// Handle category update form submission
const category_update_post = [
  // Validate and sanitize fields (same as create)
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category name must be between 1 and 50 characters')
    .escape(),
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters')
    .escape(),
  body('color')
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code'),

  asyncHandler(async (req, res, next) => {
    const categoryId = req.params.id;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const category = { ...req.body, _id: categoryId };
      return res.render('category/form', {
        title: 'Edit Category',
        category,
        errors: errors.array()
      });
    }

    try {
      const category = await Category.findOne({ 
        _id: categoryId, 
        user: req.user._id 
      });

      if (!category) {
        return res.status(404).render('error', {
          message: 'Category not found',
          error: { status: 404 }
        });
      }

      // Check if new name conflicts with existing category
      if (req.body.name !== category.name) {
        const existingCategory = await Category.findOne({
          name: req.body.name,
          user: req.user._id,
          _id: { $ne: categoryId }
        });

        if (existingCategory) {
          return res.render('category/form', {
            title: 'Edit Category',
            category: { ...req.body, _id: categoryId },
            errors: [{ msg: 'Category name already exists' }]
          });
        }
      }

      // Update category
      category.name = req.body.name;
      category.description = req.body.description;
      category.color = req.body.color;

      await category.save();
      res.redirect(`/budget/category/${categoryId}`);

    } catch (error) {
      console.error('Category update error:', error);
      res.render('category/form', {
        title: 'Edit Category',
        category: { ...req.body, _id: categoryId },
        errors: [{ msg: 'Error updating category. Please try again.' }]
      });
    }
  })
];

// Handle category delete
const category_delete_post = asyncHandler(async (req, res, next) => {
  const categoryId = req.params.id;

  try {
    const category = await Category.findOne({ 
      _id: categoryId, 
      user: req.user._id 
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has expenses or budgets
    const expenseCount = await Expense.countDocuments({ 
      category: categoryId, 
      user: req.user._id 
    });
    const budgetCount = await Budget.countDocuments({ 
      category: categoryId, 
      user: req.user._id 
    });

    if (expenseCount > 0 || budgetCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with existing expenses or budgets' 
      });
    }

    await Category.findByIdAndDelete(categoryId);
    res.redirect('/budget/categories');

  } catch (error) {
    console.error('Category delete error:', error);
    res.status(500).json({ error: 'Error deleting category' });
  }
});

module.exports = {
  category_list,
  category_create_get,
  category_create_post,
  category_detail,
  category_update_get,
  category_update_post,
  category_delete_post
};
