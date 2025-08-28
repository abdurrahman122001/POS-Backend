// models/Sale.js
const mongoose = require("mongoose");

const SaleItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const SaleSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    items: { type: [SaleItemSchema], required: true },
    netTotal: { type: Number, required: true },
    tender: { type: Number, default: 0 },
    returnAmount: { type: Number, default: 0 },
    // optional: store payment mode, counter, etc.
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sale", SaleSchema);
