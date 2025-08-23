const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema({
  expenseNo: { type: String, required: true },
  voucherType: { type: String, required: true }, // e.g. Electricity, Rent, Salary
  paidToWhom: { type: String, required: true },
  paidFor: { type: String },
  transactionDetails: { type: String },
  date: { type: Date, default: Date.now },
  paymentAmount: { type: Number, required: true },
  paymentMode: { type: String, enum: ["Cash", "Cheque", "Credit Card"], required: true },
}, { timestamps: true });

module.exports = mongoose.model("Expense", ExpenseSchema);
