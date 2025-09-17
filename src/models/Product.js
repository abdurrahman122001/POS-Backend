// models/Product.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stockQty: { type: Number, min: 0 }, // Changed: removed required, default
    stockGrams: { type: Number, min: 0 }, // New: for grams    unit: { type: String },
    unit: { type: String, trim: true }, // Optional: e.g., "bottle", "g"
    barcode: { type: String },
    image: { type: String },

    // IMPORTANT: Use ObjectId refs so we can populate names in the UI
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      index: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
// Custom validator: ensure at least one stock field is provided
ProductSchema.pre('validate', function (next) {
  if (this.stockQty === undefined && this.stockGrams === undefined) {
    this.invalidate('stock', 'Please provide either stockQty or stockGrams');
  }
  next();
});
// Optional index ideas
ProductSchema.index({ name: 1, category: 1 }, { unique: false });

module.exports = mongoose.model("Product", ProductSchema);
