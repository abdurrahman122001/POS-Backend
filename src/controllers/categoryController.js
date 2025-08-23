// controllers/categoryController.js
const Category = require('../models/Category');

// Create
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description?.trim() || ''
    });

    return res.status(201).json(category);
  } catch (err) {
    // Duplicate key (unique name)
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Category name must be unique' });
    }
    return res.status(500).json({ message: 'Server error', error: err?.message });
  }
};

// Read (All) with optional search & sort
exports.getCategories = async (req, res) => {
  try {
    const { q, sort = 'createdAt', order = 'desc' } = req.query;

    const filter = q
      ? { name: { $regex: q, $options: 'i' } }
      : {};

    const categories = await Category.find(filter)
      .sort({ [sort]: order === 'asc' ? 1 : -1 });

    return res.status(200).json(categories);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err?.message });
  }
};

// Read (Single)
exports.getCategoryById = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    return res.status(200).json(cat);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err?.message });
  }
};

// Update
exports.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const updates = {};
    if (typeof name === 'string') updates.name = name.trim();
    if (typeof description === 'string') updates.description = description.trim();

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: 'Category not found' });
    return res.status(200).json(updated);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Category name must be unique' });
    }
    return res.status(500).json({ message: 'Server error', error: err?.message });
  }
};

// Delete
exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Category not found' });
    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err?.message });
  }
};
