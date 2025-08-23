// controllers/expenseController.js
const Expense = require('../models/Expense');

// CREATE
exports.createExpense = async (req, res) => {
  try {
    const {
      expenseNo,
      voucherType,
      paidToWhom,
      paidFor,
      transactionDetails,
      date,
      paymentAmount,
      paymentMode,
    } = req.body;

    if (!expenseNo || !voucherType || !paidToWhom || !paymentAmount || !paymentMode) {
      return res.status(400).json({ message: 'Required fields: expenseNo, voucherType, paidToWhom, paymentAmount, paymentMode' });
    }

    const expense = await Expense.create({
      expenseNo,
      voucherType,
      paidToWhom,
      paidFor: paidFor || '',
      transactionDetails: transactionDetails || '',
      date: date ? new Date(date) : new Date(),
      paymentAmount,
      paymentMode,
    });

    return res.status(201).json(expense);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err?.message });
  }
};

// READ (ALL) with optional filters
exports.getExpenses = async (req, res) => {
  try {
    const { q, voucherType, paymentMode, from, to, sort = 'createdAt', order = 'desc' } = req.query;

    const filter = {};

    if (q) {
      filter.$or = [
        { expenseNo: { $regex: q, $options: 'i' } },
        { voucherType: { $regex: q, $options: 'i' } },
        { paidToWhom: { $regex: q, $options: 'i' } },
        { paidFor: { $regex: q, $options: 'i' } },
        { transactionDetails: { $regex: q, $options: 'i' } },
      ];
    }

    if (voucherType) filter.voucherType = voucherType;
    if (paymentMode) filter.paymentMode = paymentMode;

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const expenses = await Expense.find(filter)
      .sort({ [sort]: order === 'asc' ? 1 : -1 });

    return res.status(200).json(expenses);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err?.message });
  }
};

// READ (ONE)
exports.getExpenseById = async (req, res) => {
  try {
    const exp = await Expense.findById(req.params.id);
    if (!exp) return res.status(404).json({ message: 'Expense not found' });
    return res.status(200).json(exp);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err?.message });
  }
};

// UPDATE
exports.updateExpense = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.date) updates.date = new Date(updates.date);

    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: 'Expense not found' });
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err?.message });
  }
};

// DELETE
exports.deleteExpense = async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Expense not found' });
    return res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err?.message });
  }
};
