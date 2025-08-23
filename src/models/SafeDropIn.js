const mongoose = require("mongoose");

const SafeDropInSchema = new mongoose.Schema({
  dropNo: { type: String, required: true },
  userName: { type: String, required: true },
  details: { type: String },
  date: { type: Date, default: Date.now },
  dropInAmount: { type: Number, required: true },
  denominations: {
    "2000": { type: Number, default: 0 },
    "500": { type: Number, default: 0 },
    "200": { type: Number, default: 0 },
    "100": { type: Number, default: 0 },
    "50": { type: Number, default: 0 },
    "20": { type: Number, default: 0 },
    "10": { type: Number, default: 0 },
    "5": { type: Number, default: 0 },
    "2": { type: Number, default: 0 },
    "1": { type: Number, default: 0 },
  },
  dropInTender: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("SafeDropIn", SafeDropInSchema);
