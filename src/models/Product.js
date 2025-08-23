const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  unit: { type: String },
  price: { type: Number, required: true },
  stockQty: { type: Number, default: 0 },
  barcode: { type: String },
  image: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);
