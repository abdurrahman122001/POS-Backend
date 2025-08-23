const mongoose = require("mongoose");

const CounterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  openingBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  shiftStart: { type: Date, default: Date.now },
  shiftEnd: { type: Date },
  safeDropIn: [
    { amount: Number, date: { type: Date, default: Date.now } }
  ],
  safeDropOut: [
    { amount: Number, date: { type: Date, default: Date.now } }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Counter", CounterSchema);
