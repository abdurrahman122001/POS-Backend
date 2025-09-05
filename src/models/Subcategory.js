const mongoose = require("mongoose");


const SubcategorySchema = new mongoose.Schema(
{
name: { type: String, required: true, trim: true },
description: { type: String, default: "" },
image: { type: String }, // optional banner image
isActive: { type: Boolean, default: true },
category: {
type: mongoose.Schema.Types.ObjectId,
ref: "Category",
required: true,
index: true,
},
},
{ timestamps: true }
);


// Unique name per category
SubcategorySchema.index({ name: 1, category: 1 }, { unique: true });
SubcategorySchema.index({ name: 1 });


module.exports = mongoose.model("Subcategory", SubcategorySchema);