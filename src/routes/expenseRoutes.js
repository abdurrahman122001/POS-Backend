// routes/expenseRoutes.js
const express = require('express');
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');

const router = express.Router();

router.get('/', getExpenses);          // GET /api/expenses
router.get('/:id', getExpenseById);    // GET /api/expenses/:id
router.post('/', createExpense);       // POST /api/expenses
router.put('/:id', updateExpense);     // PUT /api/expenses/:id
router.delete('/:id', deleteExpense);  // DELETE /api/expenses/:id

module.exports = router;
