// controllers/productController.js
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");

const isDupKeyError = (err) => err && err.code === 11000;

// GET /products/:id
exports.getProduct = async (req, res) => {
  try {
    const item = await Product.findById(req.params.id)
      .populate({ path: "category", select: "name isActive" })
      .populate({ path: "subcategory", select: "name isActive category" });

    if (!item) return res.status(404).json({ message: "Product not found" });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: "Invalid ID" });
  }
};

// GET /products?search=&category=&subcategory=&isActive=true
exports.listProducts = async (req, res) => {
  try {
    const { search = "", category, subcategory, isActive } = req.query;

    const filter = {};
    if (search) filter.name = { $regex: search, $options: "i" };
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (typeof isActive !== "undefined") filter.isActive = isActive === "true";

    const items = await Product.find(filter)
      .populate({ path: "category", select: "name isActive" })
      .populate({ path: "subcategory", select: "name isActive category" })
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to load products" });
  }
};

// POST /products
// body: { name, price, stockQty, category(ObjectId), subcategory?(ObjectId) }

exports.createProduct = async (req, res) => {
  try {
    let {
      name,
      price,
      stockQty = 0,
      category,
      subcategory,
      unit,
      barcode,
      image,
      isActive = true,
    } = req.body;

    if (!name || price == null || !category) {
      return res
        .status(400)
        .json({ message: "'name', 'price' and 'category' are required" });
    }

    // Coerce to ObjectId (throws if invalid)
    const catId = new mongoose.Types.ObjectId(category);
    let subId = null;
    if (subcategory) subId = new mongoose.Types.ObjectId(subcategory);

    // Validate category exists
    const cat = await Category.findById(catId).lean();
    if (!cat) return res.status(404).json({ message: "Category not found" });

    // Validate subcategory belongs to category
    if (subId) {
      const sub = await Subcategory.findById(subId).lean();
      if (!sub) return res.status(404).json({ message: "Subcategory not found" });
      if (String(sub.category) !== String(catId)) {
        return res
          .status(400)
          .json({ message: "Subcategory does not belong to selected category" });
      }
    }

    const created = await Product.create({
      name: String(name).trim(),
      price: Number(price),
      stockQty: Number(stockQty),
      category: catId,
      subcategory: subId || undefined,
      unit,
      barcode,
      image,
      isActive: !!isActive,
    });

    // Re-read and populate using a fresh query; return plain JSON
    const populated = await Product.findById(created._id)
      .populate({ path: "category", select: "name isActive" })
      .populate({ path: "subcategory", select: "name isActive category" })
      .lean();

    return res.status(201).json(populated);
  } catch (err) {
    // LOG the real error so you can see it in the server console
    console.error("createProduct error:", err);

    if (isDupKeyError(err)) {
      return res
        .status(409)
        .json({ message: "Product already exists" });
    }
    if (err instanceof mongoose.Error.CastError) {
      return res
        .status(400)
        .json({ message: "Invalid category/subcategory id" });
    }

    // Surface the actual message to the client to debug
    return res
      .status(500)
      .json({ message: err?.message || "Failed to create product" });
  }
};

// PUT /products/:id
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, price, stockQty, category, subcategory, unit, barcode, image, isActive } = req.body;

    const update = {};

    if (typeof name !== "undefined") update.name = String(name).trim();
    if (typeof price !== "undefined") update.price = Number(price);
    if (typeof stockQty !== "undefined") update.stockQty = Number(stockQty);
    if (typeof unit !== "undefined") update.unit = unit;
    if (typeof barcode !== "undefined") update.barcode = barcode;
    if (typeof image !== "undefined") update.image = image;
    if (typeof isActive !== "undefined") update.isActive = !!isActive;

    // If category/subcategory provided, coerce to IDs and validate
    let catId = null;
    if (typeof category !== "undefined" && category !== null && category !== "") {
      catId = new mongoose.Types.ObjectId(category);
      const cat = await Category.findById(catId);
      if (!cat) return res.status(404).json({ message: "Category not found" });
      update.category = catId;
    }

    let subId = null;
    if (typeof subcategory !== "undefined") {
      if (subcategory) {
        subId = new mongoose.Types.ObjectId(subcategory);
        const sub = await Subcategory.findById(subId);
        if (!sub) return res.status(404).json({ message: "Subcategory not found" });

        // Validate relation either against provided category, or existing product category
        const compareCat =
          catId ||
          (await Product.findById(id).select("category").then((p) => (p ? p.category : null)));

        if (!compareCat) return res.status(404).json({ message: "Product not found" });
        if (String(sub.category) !== String(compareCat)) {
          return res.status(400).json({ message: "Subcategory does not belong to selected category" });
        }
        update.subcategory = subId;
      } else {
        // explicit clear
        update.subcategory = undefined;
      }
    }

    const updated = await Product.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .populate({ path: "category", select: "name isActive" })
      .populate({ path: "subcategory", select: "name isActive category" });

    if (!updated) return res.status(404).json({ message: "Product not found" });

    res.json(updated);
  } catch (err) {
    if (isDupKeyError(err)) {
      return res.status(409).json({ message: "Duplicate product" });
    }
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: "Invalid category/subcategory id" });
    }
    res.status(500).json({ message: "Failed to update product" });
  }
};

// DELETE /products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product" });
  }
};
