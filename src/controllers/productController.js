// controllers/productController.js
const Product = require("../models/Product");

// Get all products (with optional filters)
exports.getProducts = async (req, res) => {
  try {
    const { category, q, page = 1, limit = 0 } = req.query;

    const filter = {};
    if (category) {
      // Accept single or comma-separated categories
      const list = String(category)
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      filter.category = list.length > 1 ? { $in: list } : list[0];
    }
    if (q) {
      // simple regex search on name OR barcode
      const rx = new RegExp(String(q).trim(), "i");
      filter.$or = [{ name: rx }, { barcode: rx }];
    }

    const cursor = Product.find(filter).sort({ name: 1 });

    // optional pagination
    const pg = Math.max(1, parseInt(page));
    const lim = Math.max(0, parseInt(limit)); // 0 = no limit
    if (lim) {
      cursor.skip((pg - 1) * lim).limit(lim);
    }

    const [items, total] = await Promise.all([
      cursor.lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: lim ? pg : 1,
      pages: lim ? Math.ceil(total / lim) : 1,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProduct) return res.status(404).json({ message: "Product not found" });
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get by category path param (alt to query string)
exports.getByCategory = async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.category);
    const items = await Product.find({ category: name }).sort({ name: 1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
