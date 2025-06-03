const express = require('express');
const router = express.Router();

// Import middleware
const { requireAuth } = require('../middleware/auth');

// Import controllers
const budgetController = require('../controllers/budgetController');
const categoryController = require('../controllers/categoryController');
const expenseController = require('../controllers/expenseController');

// All budget routes require authentication
router.use(requireAuth);

// Budget routes
router.get('/', budgetController.budget_list);
router.get('/create', budgetController.budget_create_get);
router.post('/create', budgetController.budget_create_post);
router.get('/budget/:id', budgetController.budget_detail);

// Category routes
router.get('/categories', categoryController.category_list);
router.get('/category/create', categoryController.category_create_get);
router.post('/category/create', categoryController.category_create_post);
router.get('/category/:id', categoryController.category_detail);
router.get('/category/:id/edit', categoryController.category_update_get);
router.post('/category/:id/edit', categoryController.category_update_post);
router.post('/category/:id/delete', categoryController.category_delete_post);

// Expense routes
router.get('/expenses', expenseController.expense_list);
router.get('/expense/create', expenseController.expense_create_get);
router.post('/expense/create', expenseController.expense_create_post);
router.get('/expense/:id', expenseController.expense_detail);
router.get('/expense/:id/edit', expenseController.expense_update_get);
router.post('/expense/:id/edit', expenseController.expense_update_post);
router.post('/expense/:id/delete', expenseController.expense_delete_post);

module.exports = router;
