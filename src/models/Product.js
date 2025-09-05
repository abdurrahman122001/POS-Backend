// models/Product.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stockQty: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String },
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

// Optional index ideas
ProductSchema.index({ name: 1, category: 1 }, { unique: false });

module.exports = mongoose.model("Product", ProductSchema);
