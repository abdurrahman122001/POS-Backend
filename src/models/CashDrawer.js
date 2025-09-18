const mongoose = require('mongoose');

const CashDrawerSchema = new mongoose.Schema(
  {
    openingBalance: { type: Number, required: true, min: 0 },
    openedAt: { type: Date, default: () => new Date(), required: true },
    closedAt: { type: Date, default: null },
    isOpen: { type: Boolean, default: true, index: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CashDrawer', CashDrawerSchema);
