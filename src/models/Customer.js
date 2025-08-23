const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
  customerNo: { type: String, unique: true },
  name: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Customer", CustomerSchema);
