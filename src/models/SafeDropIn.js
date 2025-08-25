// models/SafeDropIn.js
const mongoose = require("mongoose");

const DenomSchema = new mongoose.Schema(
  {
    "2000": { type: Number, default: 0, min: 0 },
    "500": { type: Number, default: 0, min: 0 },
    "200": { type: Number, default: 0, min: 0 },
    "100": { type: Number, default: 0, min: 0 },
    "50": { type: Number, default: 0, min: 0 },
    "20": { type: Number, default: 0, min: 0 },
    "10": { type: Number, default: 0, min: 0 },
    "5": { type: Number, default: 0, min: 0 },
    "2": { type: Number, default: 0, min: 0 },
    "1": { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const SafeDropInSchema = new mongoose.Schema(
  {
    dropNo: { type: String, required: true, index: true, trim: true },
    userName: { type: String, required: true, trim: true },
    details: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    dropInAmount: { type: Number, required: true, min: 0 }, // auto-calculated
    denominations: { type: DenomSchema, default: () => ({}) },
    dropInTender: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Helper to compute amount from denominations
function totalFromDenoms(denoms = {}) {
  const values = { 2000:2000, 500:500, 200:200, 100:100, 50:50, 20:20, 10:10, 5:5, 2:2, 1:1 };
  return Object.entries(values).reduce((sum, [k, v]) => sum + (Number(denoms[k]) || 0) * v, 0);
}

// Always compute dropInAmount from denominations before validate/save
SafeDropInSchema.pre("validate", function (next) {
  this.dropInAmount = totalFromDenoms(this.denominations);
  next();
});

module.exports = mongoose.model("SafeDropIn", SafeDropInSchema);
