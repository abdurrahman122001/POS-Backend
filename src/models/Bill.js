const mongoose = require("mongoose");

const BillSchema = new mongoose.Schema({
  billNo: { type: String, required: true },
  date: { type: Date, default: Date.now },
  counterId: { type: mongoose.Schema.Types.ObjectId, ref: "Counter" },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: String,
      qty: Number,
      rate: Number,
      discount: { type: Number, default: 0 },
      total: Number
    }
  ],
  grossAmount: Number,
  discount: { type: Number, default: 0 },
  netAmount: Number,
  tenderAmount: Number,
  returnAmount: Number,
  paymentMethod: { type: String, enum: ["Cash", "UPI", "Credit"] },
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
  }
}, { timestamps: true });

module.exports = mongoose.model("Bill", BillSchema);
