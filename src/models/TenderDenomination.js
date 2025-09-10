import mongoose from "mongoose";

const TenderDenominationSchema = new mongoose.Schema(
  {
    value: { type: Number, required: true, unique: true, min: 0 },
    label: { type: String },          // defaults to `Rs.{value}` if missing
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

TenderDenominationSchema.pre("save", function (next) {
  if (!this.label) this.label = `Rs.${this.value}`;
  next();
});

export const TenderDenomination = mongoose.model(
  "TenderDenomination",
  TenderDenominationSchema
);
