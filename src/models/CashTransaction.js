const mongoose = require('mongoose');

const CashTransactionSchema = new mongoose.Schema(
  {
    drawer: { type: mongoose.Schema.Types.ObjectId, ref: 'CashDrawer', required: true, index: true },
    type: { 
      type: String, 
      enum: ['sale', 'expense', 'safe_drop', 'cash_in', 'cash_out'], 
      required: true 
    },
    amount: { type: Number, required: true }, // store SIGNED (+ inflow, - outflow)
    description: { type: String, trim: true, default: '' },
    createdBy: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

// Normalize sign before validating
CashTransactionSchema.pre('validate', function (next) {
  const abs = Math.abs(this.amount || 0);
  if (['sale', 'cash_in'].includes(this.type)) this.amount = +abs;
  else if (['expense', 'cash_out', 'safe_drop'].includes(this.type)) this.amount = -abs;
  next();
});

module.exports = mongoose.model('CashTransaction', CashTransactionSchema);
