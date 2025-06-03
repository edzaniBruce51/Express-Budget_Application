const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/user');
const Category = require('../models/category');
const Budget = require('../models/budget');
const Expense = require('../models/expense');

// Display dashboard
const dashboard_get = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const currentDate = new Date();
  
  // Get current month date range
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  try {
    // Get total expenses for current month
    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalMonthlyExpenses = monthlyExpenses.length > 0 ? monthlyExpenses[0].total : 0;
    const expenseCount = monthlyExpenses.length > 0 ? monthlyExpenses[0].count : 0;

    // Get expenses by category for current month
    const expensesByCategory = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Get active budgets with spending
    const budgets = await Budget.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          is_active: true,
          start_date: { $lte: currentDate },
          end_date: { $gte: currentDate }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $lookup: {
          from: 'expenses',
          let: { categoryId: '$category._id', startDate: '$start_date', endDate: '$end_date' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$category', '$$categoryId'] },
                    { $eq: ['$user', new mongoose.Types.ObjectId(userId)] },
                    { $gte: ['$date', '$$startDate'] },
                    { $lte: ['$date', '$$endDate'] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                spent: { $sum: '$amount' }
              }
            }
          ],
          as: 'spending'
        }
      },
      {
        $addFields: {
          spent: { $ifNull: [{ $arrayElemAt: ['$spending.spent', 0] }, 0] },
          remaining: { $subtract: ['$amount', { $ifNull: [{ $arrayElemAt: ['$spending.spent', 0] }, 0] }] },
          progress: {
            $multiply: [
              { $divide: [{ $ifNull: [{ $arrayElemAt: ['$spending.spent', 0] }, 0] }, '$amount'] },
              100
            ]
          }
        }
      },
      {
        $sort: { progress: -1 }
      }
    ]);

    // Get recent expenses
    const recentExpenses = await Expense.find({ user: userId })
      .populate('category')
      .sort({ date: -1 })
      .limit(5);

    // Get total categories and budgets count
    const categoryCount = await Category.countDocuments({ user: userId });
    const budgetCount = await Budget.countDocuments({ user: userId, is_active: true });

    // Calculate total budget amount
    const totalBudgetAmount = budgets.reduce((sum, budget) => sum + budget.amount, 0);

    // Prepare chart data for expenses by category
    const chartData = {
      labels: expensesByCategory.map(item => item.category.name),
      data: expensesByCategory.map(item => item.total),
      colors: expensesByCategory.map(item => item.category.color)
    };

    res.render('dashboard/index', {
      title: 'Dashboard',
      user: req.user,
      stats: {
        totalMonthlyExpenses: totalMonthlyExpenses.toFixed(2),
        expenseCount,
        categoryCount,
        budgetCount,
        totalBudgetAmount: totalBudgetAmount.toFixed(2),
        remainingBudget: (totalBudgetAmount - totalMonthlyExpenses).toFixed(2)
      },
      budgets,
      recentExpenses,
      expensesByCategory,
      chartData: JSON.stringify(chartData),
      currentMonth: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('dashboard/index', {
      title: 'Dashboard',
      user: req.user,
      stats: {
        totalMonthlyExpenses: '0.00',
        expenseCount: 0,
        categoryCount: 0,
        budgetCount: 0,
        totalBudgetAmount: '0.00',
        remainingBudget: '0.00'
      },
      budgets: [],
      recentExpenses: [],
      expensesByCategory: [],
      chartData: JSON.stringify({ labels: [], data: [], colors: [] }),
      currentMonth: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      error: 'Unable to load dashboard data'
    });
  }
});

module.exports = {
  dashboard_get
};

