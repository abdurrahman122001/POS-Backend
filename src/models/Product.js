// models/Product.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 }, // Price per unit (for unit-based) or per pricePerWeight (for weight-based)
    stockQty: { type: Number, min: 0 }, // For unit-based products (e.g., bottles)
    stockGrams: { type: Number, min: 0 }, // For weight-based products, always stored in grams
    unit: { type: String, enum: ['g', 'kg', null], default: null }, // Unit for weight-based inputs/display
    pricePerWeight: { type: Number, min: 0 }, // Weight amount that price is for (e.g., 10 for 10g), required for weight-based
    barcode: { type: String, trim: true },
    image: { type: String },
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

// Validation: Exactly one of stockQty or stockGrams, and unit/pricePerWeight rules
ProductSchema.pre('validate', function (next) {
  const hasStockQty = this.stockQty !== undefined && this.stockQty !== null;
  const hasStockGrams = this.stockGrams !== undefined && this.stockGrams !== null;

  if (hasStockQty === hasStockGrams) {
    this.invalidate('stock', 'Exactly one of stockQty or stockGrams must be provided');
  }
  if (hasStockQty && (this.unit || this.pricePerWeight)) {
    this.invalidate('unit', 'Unit and pricePerWeight must be null for unit-based products');
  }
  if (hasStockGrams && (!this.unit || this.pricePerWeight == null || this.pricePerWeight <= 0)) {
    this.invalidate('unit', 'Unit and pricePerWeight > 0 are required for weight-based products');
  }
  next();
});

ProductSchema.index({ name: 1, category: 1 }, { unique: false });

module.exports = mongoose.model("Product", ProductSchema);