const mongoose = require("mongoose");

const StockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    // 'IN' adds to stock, 'OUT' subtracts, 'ADJUST' sets delta manually
    direction: {
      type: String,
      enum: ["IN", "OUT", "ADJUST"],
      required: true,
    },

    // Use exactly one of the two (like your Product)
    qtyUnits: { type: Number, min: 0 },
    qtyGrams: { type: Number, min: 0 },

    // Optional meta for “where from / where to”
    sourceType: {
      type: String,
      enum: ["purchase", "sale", "return_in", "return_out", "opening", "transfer", "damage", "other"],
      default: "other",
    },
    reference: { type: String, trim: true }, // e.g. supplier name, invoice#, customer, etc.
    note: { type: String, trim: true },

    createdBy: { type: String, trim: true }, // optional user id/email/name string
  },
  { timestamps: true }
);

// Validate exactly one of qtyUnits or qtyGrams
StockMovementSchema.pre("validate", function (next) {
  const hasUnits = this.qtyUnits !== undefined && this.qtyUnits !== null;
  const hasGrams = this.qtyGrams !== undefined && this.qtyGrams !== null;
  if ((hasUnits && hasGrams) || (!hasUnits && !hasGrams)) {
    this.invalidate("quantity", "Provide exactly one of qtyUnits or qtyGrams");
  }
  next();
});

module.exports = mongoose.model("StockMovement", StockMovementSchema);
