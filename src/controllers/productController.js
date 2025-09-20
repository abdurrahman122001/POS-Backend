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

// GET /products?search=&category=&subcategory=&isActive=true&limit=200
exports.listProducts = async (req, res) => {
  try {
    const { search = "", category, subcategory, isActive, limit } = req.query;

    const filter = {};
    if (search) filter.name = { $regex: search, $options: "i" };

    if (category) {
      let catId = null;
      if (mongoose.isValidObjectId(category)) {
        catId = category;
      } else {
        const catDoc = await Category.findOne({ name: category }).select("_id").lean();
        if (catDoc) catId = catDoc._id;
      }
      if (catId) filter.category = catId;
      else if (!search) return res.json([]);
    }

    if (subcategory) {
      let subId = null;
      if (mongoose.isValidObjectId(subcategory)) {
        subId = subcategory;
      } else {
        const subDoc = await Subcategory.findOne({ name: subcategory }).select("_id").lean();
        if (subDoc) subId = subDoc._id;
      }
      if (subId) filter.subcategory = subId;
      else if (!search) return res.json([]);
    }

    const lim = Math.max(1, Math.min(1000, Number(limit) || 0)) || undefined;

    const items = await Product.find(filter)
      .populate({ path: "category", select: "name isActive" })
      .populate({ path: "subcategory", select: "name isActive category" })
      .sort({ createdAt: -1 })
      .lean();

    res.json(items);
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: "Invalid filter id provided" });
    }
    res.status(500).json({ message: "Failed to load products" });
  }
};

// POST /products
exports.createProduct = async (req, res) => {
  try {
    let {
      name,
      price,
      stockQty,
      stockGrams,
      unit,
      pricePerWeight,
      category,
      subcategory,
      barcode,
      image,
      isActive = true,
    } = req.body;

    if (!name || price == null || !category) {
      return res.status(400).json({ message: "'name', 'price', and 'category' are required" });
    }

    const hasStockQty = stockQty !== undefined && stockQty !== null;
    const hasStockGrams = stockGrams !== undefined && stockGrams !== null;
    if (hasStockQty === hasStockGrams) {
      return res.status(400).json({ message: "Exactly one of stockQty or stockGrams must be provided" });
    }
    if (hasStockQty && (unit || pricePerWeight)) {
      return res.status(400).json({ message: "Unit and pricePerWeight must be null for unit-based products" });
    }
    if (hasStockGrams && (!unit || pricePerWeight == null || pricePerWeight <= 0)) {
      return res.status(400).json({ message: "Unit and pricePerWeight > 0 are required for weight-based products" });
    }

    const catId = new mongoose.Types.ObjectId(category);
    let subId = null;
    if (subcategory) subId = new mongoose.Types.ObjectId(subcategory);

    const cat = await Category.findById(catId).lean();
    if (!cat) return res.status(404).json({ message: "Category not found" });

    if (subId) {
      const sub = await Subcategory.findById(subId).lean();
      if (!sub) return res.status(404).json({ message: "Subcategory not found" });
      if (String(sub.category) !== String(catId)) {
        return res.status(400).json({ message: "Subcategory does not belong to selected category" });
      }
    }

    // Convert stockGrams to grams if unit is kg
    const stockGramsInGrams = hasStockGrams ? (unit === 'kg' ? Number(stockGrams) * 1000 : Number(stockGrams)) : undefined;

    const created = await Product.create({
      name: String(name).trim(),
      price: Number(price),
      stockQty: hasStockQty ? Number(stockQty) : undefined,
      stockGrams: stockGramsInGrams,
      unit: unit || undefined,
      pricePerWeight: pricePerWeight !== undefined ? Number(pricePerWeight) : undefined,
      category: catId,
      subcategory: subId || undefined,
      barcode,
      image,
      isActive: !!isActive,
    });

    const populated = await Product.findById(created._id)
      .populate({ path: "category", select: "name isActive" })
      .populate({ path: "subcategory", select: "name isActive category" })
      .select("name price stockQty stockGrams unit pricePerWeight category subcategory isActive")
      .lean();

    return res.status(201).json(populated);
  } catch (err) {
    console.error("createProduct error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    if (isDupKeyError(err)) {
      return res.status(409).json({ message: "Product already exists" });
    }
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: "Invalid category/subcategory id" });
    }
    return res.status(500).json({ message: err?.message || "Failed to create product" });
  }
};

// PUT /products/:id - General product update
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stockQty, stockGrams, unit, pricePerWeight, category, subcategory, barcode, image, isActive } = req.body;

    if (!name || price == null || !category) {
      return res.status(400).json({ message: "'name', 'price', and 'category' are required" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const hasStockQty = stockQty !== undefined && stockQty !== null;
    const hasStockGrams = stockGrams !== undefined && stockGrams !== null;

    if (hasStockQty === hasStockGrams) {
      return res.status(400).json({ message: "Exactly one of stockQty or stockGrams must be provided" });
    }
    if (hasStockQty && (unit || pricePerWeight)) {
      return res.status(400).json({ message: "Unit and pricePerWeight must be null for unit-based products" });
    }
    if (hasStockGrams && (!unit || pricePerWeight == null || pricePerWeight <= 0)) {
      return res.status(400).json({ message: "Unit and pricePerWeight > 0 are required for weight-based products" });
    }

    const catId = new mongoose.Types.ObjectId(category);
    let subId = subcategory ? new mongoose.Types.ObjectId(subcategory) : null;

    const cat = await Category.findById(catId).lean();
    if (!cat) return res.status(404).json({ message: "Category not found" });

    if (subId) {
      const sub = await Subcategory.findById(subId).lean();
      if (!sub) return res.status(404).json({ message: "Subcategory not found" });
      if (String(sub.category) !== String(catId)) {
        return res.status(400).json({ message: "Subcategory does not belong to selected category" });
      }
    }

    // Convert stockGrams to grams if unit is kg
    const stockGramsInGrams = hasStockGrams ? (unit === 'kg' ? Number(stockGrams) * 1000 : Number(stockGrams)) : undefined;

    product.name = String(name).trim();
    product.price = Number(price);
    product.stockQty = hasStockQty ? Number(stockQty) : undefined;
    product.stockGrams = stockGramsInGrams;
    product.unit = unit || undefined;
    product.pricePerWeight = pricePerWeight !== undefined ? Number(pricePerWeight) : undefined;
    product.category = catId;
    product.subcategory = subId || undefined;
    product.barcode = barcode || undefined;
    product.image = image || undefined;
    product.isActive = isActive !== undefined ? !!isActive : product.isActive;

    await product.save();

    const populated = await Product.findById(id)
      .populate({ path: "category", select: "name isActive" })
      .populate({ path: "subcategory", select: "name isActive category" })
      .select("name price stockQty stockGrams unit pricePerWeight category subcategory isActive")
      .lean();

    return res.status(200).json(populated);
  } catch (err) {
    console.error("updateProduct error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    if (isDupKeyError(err)) {
      return res.status(409).json({ message: "Product already exists" });
    }
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: "Invalid category/subcategory id" });
    }
    return res.status(500).json({ message: err?.message || "Failed to update product" });
  }
};

// POST /products/update-stock - Stock update
exports.updateProductStock = async (req, res) => {
  try {
    const { productId, quantity, grams } = req.body;

    if (!productId || (quantity == null && grams == null)) {
      return res.status(400).json({ message: "'productId' and either 'quantity' or 'grams' are required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const hasStockQty = product.stockQty !== undefined && product.stockQty !== null;
    const hasStockGrams = product.stockGrams !== undefined && product.stockGrams !== null;

    if (quantity !== undefined && !hasStockQty) {
      return res.status(400).json({ message: "Cannot update quantity for weight-based product" });
    }
    if (grams !== undefined && !hasStockGrams) {
      return res.status(400).json({ message: "Cannot update grams for unit-based product" });
    }

    let saleAmount = 0;
    if (hasStockQty && quantity !== undefined) {
      const newQty = product.stockQty - Number(quantity);
      if (newQty < 0) {
        return res.status(400).json({ message: "Insufficient stock" });
      }
      product.stockQty = newQty;
      saleAmount = Number(quantity) * product.price;
    } else if (hasStockGrams && grams !== undefined) {
      const gramsToDeduct = product.unit === 'kg' ? Number(grams) * 1000 : Number(grams);
      const newGrams = product.stockGrams - gramsToDeduct;
      if (newGrams < 0) {
        return res.status(400).json({ message: "Insufficient stock" });
      }
      product.stockGrams = newGrams;
      saleAmount = (gramsToDeduct / product.pricePerWeight) * product.price;
    } else {
      return res.status(400).json({ message: "Invalid stock update" });
    }

    await product.save();

    const populated = await Product.findById(productId)
      .populate({ path: "category", select: "name isActive" })
      .populate({ path: "subcategory", select: "name isActive category" })
      .select("name price stockQty stockGrams unit pricePerWeight category subcategory isActive")
      .lean();

    return res.status(200).json({ ...populated, saleAmount });
  } catch (err) {
    console.error("updateProductStock error:", err);
    return res.status(500).json({ message: err?.message || "Failed to update stock" });
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