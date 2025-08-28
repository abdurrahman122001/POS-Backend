// models/Product.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true }, // string category
    unit: { type: String },
    price: { type: Number, required: true },
    stockQty: { type: Number, default: 0 },
    barcode: { type: String },
    image: { type: String },
  },
  { timestamps: true }
);

ProductSchema.index({ category: 1, name: 1 });
ProductSchema.index({ name: "text", barcode: "text" });

module.exports = mongoose.model("Product", ProductSchema);
