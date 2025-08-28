// controllers/saleController.js
const Sale = require("../models/Sale");
const Product = require("../models/Product");

exports.createSale = async (req, res) => {
  try {
    const { customerName, items, tender = 0 } = req.body || {};
    if (!customerName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "customerName and items are required" });
    }

    const detailed = [];
    let netTotal = 0;

    for (const it of items) {
      const prod = await Product.findById(it.productId);
      if (!prod) return res.status(404).json({ message: "Product not found: " + it.productId });

      const qty = Number(it.qty) || 0;
      if (qty <= 0) return res.status(400).json({ message: "Invalid qty for product " + prod.name });

      // optional stock check
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

    const sale = await Sale.create({
      customerName,
      items: detailed,
      netTotal,
      tender,
      returnAmount,
    });

    // reduce stock
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
    const sales = await Sale.find({})
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit) || 50)
      .lean();
    res.json(sales);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
