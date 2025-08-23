// routes/categoryRoutes.js
const express = require('express');
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const router = express.Router();

router.get('/', getCategories);         // GET /api/categories
router.get('/:id', getCategoryById);    // GET /api/categories/:id
router.post('/', createCategory);       // POST /api/categories
router.put('/:id', updateCategory);     // PUT /api/categories/:id
router.delete('/:id', deleteCategory);  // DELETE /api/categories/:id

module.exports = router;
