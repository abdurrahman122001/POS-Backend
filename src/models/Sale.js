
const mongoose = require("mongoose");

const SaleItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const SaleSchema = new mongoose.Schema(
  {
    customerId: { type: String },
    customerContact: {
      type: String,
      required: function () {
        return this.paymentMode === "Credit"; // Required only for Credit payment mode
      },
      match: [/^\+?\d{10,15}$/, "Please provide a valid phone number"], // Basic phone number validation
    },
    paymentMode: { type: String, required: true, enum: ["Cash", "UPI", "Credit Card", "Credit"] },
    items: { type: [SaleItemSchema], required: true },
    netTotal: { type: Number, required: true },
    tender: { type: Number, default: 0 },
    returnAmount: { type: Number, default: 0 },
    returns: [{ type: mongoose.Schema.Types.ObjectId, ref: "SaleReturn" }],
    returned: { type: Boolean, default: false },
    counter: {
      type: String,
      enum: ["Counter One", "Counter Two"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sale", SaleSchema);
