
const mongoose = require('mongoose');
const Sale = require("../models/Sale");
const Product = require("../models/Product");
const SaleReturn = require("../models/SaleReturn");

exports.createSale = async (req, res) => {
  try {
    const { items, tender = 0, customerId, paymentMode, customerContact, counter } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items are required" });
    }
    if (!paymentMode) {
      return res.status(400).json({ message: "paymentMode is required" });
    }
    if (paymentMode === "Credit" && !customerContact) {
      return res.status(400).json({ message: "customerContact is required for Credit payment mode" });
    }
    if (!counter || !["Counter One", "Counter Two"].includes(counter)) {
      return res.status(400).json({ message: "Valid counter is required (Counter One or Counter Two)" });
    }

    const detailed = [];
    let netTotal = 0;

    for (const it of items) {
      const prod = await Product.findById(it.productId);
      if (!prod) return res.status(404).json({ message: "Product not found: " + it.productId });

      const qty = Number(it.qty) || 0;
      if (qty <= 0) return res.status(400).json({ message: "Invalid qty for product " + prod.name });

      // Check stock based on product type
      if (prod.unit && it.grams !== undefined) {
        // Weight-based product
        const gramsToDeduct = prod.unit === 'kg' ? Number(it.grams) * 1000 : Number(it.grams);
        if (prod.stockGrams < gramsToDeduct) {
          return res.status(400).json({ message: `Insufficient stock for ${prod.name}` });
        }
      } else if (prod.stockQty !== undefined) {
        // Unit-based product
        if (prod.stockQty < qty) {
          return res.status(400).json({ message: `Insufficient stock for ${prod.name}` });
        }
      } else {
        return res.status(400).json({ message: `Invalid stock configuration for ${prod.name}` });
      }

      const price = Number.isFinite(it.unitPrice) && it.unitPrice > 0 ? it.unitPrice : prod.price;
      const discount = Number.isFinite(it.discount) ? it.discount : 0;
      const lineTotal = price * qty - discount;
      netTotal += lineTotal;

      detailed.push({
        product: prod._id,
        name: it.name || prod.name,
        price,
        qty,
        discount,
        total: lineTotal,
        unit: it.unit,
        grams: it.grams,
      });
    }

    const returnAmount = Math.max(0, Number(tender) - netTotal);
    if (tender < netTotal && !["Credit Card", "Credit"].includes(paymentMode)) {
      return res.status(400).json({ message: "Tender amount is less than net total" });
    }

    const sale = await Sale.create({
      customerId,
      customerContact: paymentMode === "Credit" ? customerContact : undefined,
      paymentMode,
      counter,
      items: detailed,
      netTotal,
      tender,
      returnAmount,
    });

    // Update product stock
    await Promise.all(
      detailed.map(async (d) => {
        if (d.unit && d.grams !== undefined) {
          const gramsToDeduct = d.unit === 'kg' ? Number(d.grams) * 1000 : Number(d.grams);
          const updatedProduct = await Product.findByIdAndUpdate(
            d.product,
            { $inc: { stockGrams: -gramsToDeduct } },
            { new: true }
          );
          console.log(`Updated stockGrams for ${d.name}: ${updatedProduct.stockGrams}`);
          return updatedProduct;
        }
        const updatedProduct = await Product.findByIdAndUpdate(
          d.product,
          { $inc: { stockQty: -d.qty } },
          { new: true }
        );
        console.log(`Updated stockQty for ${d.name}: ${updatedProduct.stockQty}`);
        return updatedProduct;
      })
    );

    res.status(201).json(sale);
  } catch (e) {
    console.error("Error in createSale:", e);
    res.status(500).json({ message: e.message });
  }
};

exports.listSales = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, paymentMode } = req.query;
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

    // Add paymentMode filter
    if (paymentMode && ["Cash", "UPI", "Credit Card", "Credit"].includes(paymentMode)) {
      filter.paymentMode = paymentMode;
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

// Other controller functions (unchanged)
exports.createReturn = async (req, res) => {
  try {
    const { originalSaleId, customerId, items, returnAmount: frontendReturnAmount, notes } = req.body;

    // Validate input
    if (!originalSaleId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Missing or invalid required fields: originalSaleId and items are required' });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(originalSaleId)) {
      return res.status(400).json({ message: `Invalid originalSaleId: ${originalSaleId}` });
    }

    // Find the original sale
    const sale = await Sale.findById(originalSaleId);
    if (!sale) {
      return res.status(404).json({ message: `Original sale not found: ${originalSaleId}` });
    }

    // Validate return items
    const origItems = sale.items.map(item => ({ ...item.toObject() }));
    for (const returnItem of items) {
      if (!mongoose.Types.ObjectId.isValid(returnItem.productId)) {
        return res.status(400).json({ message: `Invalid productId for ${returnItem.name}: ${returnItem.productId}` });
      }
      const saleItem = origItems.find(si => si.product.toString() === returnItem.productId);
      if (!saleItem) {
        return res.status(400).json({ message: `Product ${returnItem.name} (ID: ${returnItem.productId}) not found in sale` });
      }
      if (!Number.isFinite(returnItem.qty) || returnItem.qty <= 0 || returnItem.qty > saleItem.qty) {
        return res.status(400).json({
          message: `Invalid return quantity for ${returnItem.name}. Requested: ${returnItem.qty}, Purchased: ${saleItem.qty}`,
        });
      }
      if (!Number.isFinite(returnItem.total) || returnItem.total <= 0) {
        return res.status(400).json({ message: `Invalid total for ${returnItem.name}: ${returnItem.total}` });
      }
    }

    // Calculate prorated totals
    let totalReturnAmount = 0;
    for (const returnItem of items) {
      const origItem = origItems.find(oi => oi.product.toString() === returnItem.productId);
      const proratedTotal = (returnItem.qty / origItem.qty) * origItem.total;
      totalReturnAmount += proratedTotal;
    }

    // Adjust sale items and totals
    const toRemove = [];
    for (let i = 0; i < sale.items.length; i++) {
      const saleItem = sale.items[i];
      const returnItem = items.find(it => it.productId === saleItem.product.toString());
      if (returnItem) {
        const origQty = saleItem.qty;
        const origTotal = saleItem.total;
        const returnQty = returnItem.qty;
        const returnTotal = (returnQty / origQty) * origTotal;
        const remainingQty = origQty - returnQty;
        if (remainingQty <= 0) {
          toRemove.push(i);
        } else {
          saleItem.qty = remainingQty;
          saleItem.total = origTotal - returnTotal;
        }
      }
    }
    for (let j = toRemove.length - 1; j >= 0; j--) {
      sale.items.splice(toRemove[j], 1);
    }

    sale.netTotal -= totalReturnAmount;
    sale.returnAmount += totalReturnAmount;
    sale.returned = sale.netTotal <= 0;

    let savedSale = sale;
    if (sale.items.length === 0 || sale.netTotal <= 0) {
      await Sale.findByIdAndDelete(originalSaleId);
      savedSale = null;
    } else {
      savedSale = await sale.save();
    }

    // Prepare return items with prorated totals
    const returnItems = items.map(item => {
      const origItem = origItems.find(oi => oi.product.toString() === item.productId);
      const proratedTotal = origItem ? (item.qty / origItem.qty) * origItem.total : item.total;
      return {
        productId: item.productId,
        name: item.name,
        price: item.price,
        qty: item.qty,
        total: proratedTotal,
      };
    });

    // Create the return document
    const saleReturn = new SaleReturn({
      originalSaleId,
      customerId: customerId || sale.customerId,
      items: returnItems,
      returnAmount: totalReturnAmount,
      notes: notes || '',
    });

    const savedReturn = await saleReturn.save();

    if (savedSale) {
      savedSale.returns.push(savedReturn._id);
      await savedSale.save();
    }

    // Update product stock
    for (const returnItem of returnItems) {
      const product = await Product.findById(returnItem.productId);
      if (product) {
        if (product.unit === 'g') {
          product.stockGrams = (product.stockGrams || 0) + returnItem.qty;
        } else {
          product.stockQty = (product.stockQty || 0) + returnItem.qty;
        }
        await product.save();
      } else {
        console.warn(`Product ${returnItem.productId} not found for stock update`);
      }
    }

    res.status(201).json(savedReturn);
  } catch (error) {
    console.error('Error creating return:', error, 'Payload:', req.body);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.find().populate('items.product');
    res.status(200).json({ data: sales });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

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
