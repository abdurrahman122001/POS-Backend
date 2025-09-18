// controllers/saleController.js
const Sale = require("../models/Sale");
const Product = require("../models/Product");

exports.createSale = async (req, res) => {
  try {
    const { items, tender = 0, customerId, paymentMode } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items are required" });
    }
    if (!paymentMode) {
      return res.status(400).json({ message: "paymentMode is required" });
    }
    
    const detailed = [];
    let netTotal = 0;

    for (const it of items) {
      const prod = await Product.findById(it.productId);
      if (!prod) return res.status(404).json({ message: "Product not found: " + it.productId });

      const qty = Number(it.qty) || 0;
      if (qty <= 0) return res.status(400).json({ message: "Invalid qty for product " + prod.name });

      if (prod.stockQty < qty) {
        return res.status(400).json({ message: `Insufficient stock for ${prod.name}` });
      }

      const lineTotal = prod.price * qty;
      netTotal += lineTotal;

      detailed.push({
        product: prod._id,
        name: prod.name,
        price: prod.price,
        qty,
        total: lineTotal,
      });
    }

    const returnAmount = Math.max(0, Number(tender) - netTotal);
    if (tender < netTotal && paymentMode !== "Credit") {
      return res.status(400).json({ message: "Tender amount is less than net total" });
    }

    const sale = await Sale.create({
      customerId,
      paymentMode,
      items: detailed,
      netTotal,
      tender,
      returnAmount,
    });

    // Update stock quantities
    await Promise.all(
      detailed.map((d) =>
        Product.findByIdAndUpdate(d.product, { $inc: { stockQty: -d.qty } })
      )
    );

    res.status(201).json(sale);

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.listSales = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter = {};

    // Add date range filter in IST
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate && !isNaN(Date.parse(startDate))) {
        const start = new Date(startDate);
        start.setHours(start.getHours() - 5);
        start.setMinutes(start.getMinutes() - 30);
        filter.createdAt.$gte = start;
      }
      if (endDate && !isNaN(Date.parse(endDate))) {
        const end = new Date(endDate);
        end.setHours(23 + 5, 59 + 30, 59, 999);
        filter.createdAt.$lte = end;
      }
      if (Object.keys(filter.createdAt).length === 0) {
        delete filter.createdAt;
      }
    }

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Sale.countDocuments(filter)
    ]);

    res.json({
      data: sales,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (e) {
    console.error("listSales error:", e);
    res.status(500).json({ message: e.message });
  }
};

// controllers/saleController.js - Updated deleteSale function
exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the sale first to get the items for stock restoration
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    // Restore stock quantities - use the product ID from each item
    await Promise.all(
      sale.items.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { stockQty: item.qty } })
      )
    );

    // Delete the sale
    await Sale.findByIdAndDelete(id);

    res.json({ message: "Sale deleted successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// NEW: Get single sale with full details
exports.getSale = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.json(sale);
  } catch (e) {
    console.error("getSale error:", e);
    res.status(500).json({ message: e.message });
  }
};