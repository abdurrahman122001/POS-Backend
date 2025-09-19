const mongoose = require("mongoose");

const SaleItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    discount: { type: Number, default: 0 }, // Added for completeness
    total: { type: Number, required: true },
  },
  { _id: false }
);

const SaleSchema = new mongoose.Schema(
  {
    customerId: { type: String },
    paymentMode: { type: String, required: true, enum: ["Cash", "UPI", "Credit Card"] },
    items: { type: [SaleItemSchema], required: true },
    netTotal: { type: Number, required: true },
    tender: { type: Number, default: 0 },
    returnAmount: { type: Number, default: 0 }, // Accumulates partial returns
    returns: [{ type: mongoose.Schema.Types.ObjectId, ref: "SaleReturn" }], // Fixed ref
    returned: { type: Boolean, default: false }, // Added for full returns (optional)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sale", SaleSchema);