const mongoose = require("mongoose");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");

/**
 * POST /inventory/movements
 * Body: { product, direction('IN'|'OUT'|'ADJUST'), qtyUnits?, qtyGrams?, sourceType?, reference?, note?, createdBy? }
 * Effect:
 *  - Creates movement
 *  - Applies delta to Product.stockQty or Product.stockGrams atomically
 */
exports.createMovement = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      product,
      direction,
      qtyUnits,
      qtyGrams,
      sourceType,
      reference,
      note,
      createdBy,
    } = req.body;

    if (!product || !direction) {
      return res.status(400).json({ message: "product and direction are required" });
    }
    if (!["IN", "OUT", "ADJUST"].includes(direction)) {
      return res.status(400).json({ message: "Invalid direction" });
    }

    // Validate exactly one of qtyUnits or qtyGrams
    const hasUnits = qtyUnits !== undefined && qtyUnits !== null;
    const hasGrams = qtyGrams !== undefined && qtyGrams !== null;
    if ((hasUnits && hasGrams) || (!hasUnits && !hasGrams)) {
      return res.status(400).json({ message: "Provide exactly one of qtyUnits or qtyGrams" });
    }

    const prod = await Product.findById(product).session(session);
    if (!prod) return res.status(404).json({ message: "Product not found" });

    // Determine delta (positive or negative)
    const sign = direction === "IN" ? 1 : direction === "OUT" ? -1 : 1; // ADJUST uses given sign as-is (positive/negative via qty provided)
    let deltaUnits = 0;
    let deltaGrams = 0;

    if (hasUnits) {
      const val = Number(qtyUnits);
      if (val < 0) return res.status(400).json({ message: "qtyUnits cannot be negative" });
      deltaUnits = direction === "ADJUST" ? val : sign * val;
    }
    if (hasGrams) {
      const val = Number(qtyGrams);
      if (val < 0) return res.status(400).json({ message: "qtyGrams cannot be negative" });
      deltaGrams = direction === "ADJUST" ? val : sign * val;
    }

    // Apply delta defensively
    if (hasUnits) {
      const current = Number(prod.stockQty || 0);
      const nextVal = current + deltaUnits;
      if (nextVal < 0) {
        return res.status(400).json({ message: "Insufficient unit stock for this movement" });
      }
      prod.stockQty = nextVal;
    }

    if (hasGrams) {
      const current = Number(prod.stockGrams || 0);
      const nextVal = current + deltaGrams;
      if (nextVal < 0) {
        return res.status(400).json({ message: "Insufficient gram stock for this movement" });
      }
      prod.stockGrams = nextVal;
    }

    // Save product & movement
    await prod.save({ session });

    const movement = await StockMovement.create(
      [
        {
          product: prod._id,
          direction,
          qtyUnits: hasUnits ? Number(qtyUnits) : undefined,
          qtyGrams: hasGrams ? Number(qtyGrams) : undefined,
          sourceType: sourceType || "other",
          reference: reference || undefined,
          note: note || undefined,
          createdBy: createdBy || undefined,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    const populated = await StockMovement.findById(movement[0]._id)
      .populate("product", "name unit price stockQty stockGrams category subcategory");

    res.status(201).json({ movement: populated, product: prod });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("createMovement error:", err);
    res.status(500).json({ message: "Failed to create stock movement" });
  }
};

/**
 * GET /inventory/movements?product=<id>&limit=50&page=1
 */
exports.listMovements = async (req, res) => {
  try {
    const { product, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (product) filter.product = product;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      StockMovement.find(filter)
        .populate("product", "name unit")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      StockMovement.countDocuments(filter),
    ]);

    res.json({
      data: items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("listMovements error:", err);
    res.status(500).json({ message: "Failed to load movements" });
  }
};

/**
 * GET /inventory/balance/:productId
 * Returns the current stock from Product (canonical).
 */
exports.getBalance = async (req, res) => {
  try {
    const prod = await Product.findById(req.params.productId);
    if (!prod) return res.status(404).json({ message: "Product not found" });

    res.json({
      product: prod._id,
      stockQty: prod.stockQty ?? null,
      stockGrams: prod.stockGrams ?? null,
      unit: prod.unit ?? null,
    });
  } catch (err) {
    console.error("getBalance error:", err);
    res.status(500).json({ message: "Failed to read balance" });
  }
};

/**
 * POST /inventory/recalculate/:productId
 * Rebuilds the product's stock from movement history (units or grams).
 * Helpful if you ever need to repair data.
 */
exports.recalculateBalance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId } = req.params;
    const prod = await Product.findById(productId).session(session);
    if (!prod) return res.status(404).json({ message: "Product not found" });

    const movements = await StockMovement.find({ product: productId }).session(session);

    let sumUnits = null;
    let sumGrams = null;

    movements.forEach((m) => {
      if (m.qtyUnits !== undefined && m.qtyUnits !== null) {
        if (sumUnits === null) sumUnits = 0;
        const val = Number(m.qtyUnits);
        if (m.direction === "IN") sumUnits += val;
        else if (m.direction === "OUT") sumUnits -= val;
        else if (m.direction === "ADJUST") sumUnits += val; // assuming ADJUST already a delta
      }
      if (m.qtyGrams !== undefined && m.qtyGrams !== null) {
        if (sumGrams === null) sumGrams = 0;
        const val = Number(m.qtyGrams);
        if (m.direction === "IN") sumGrams += val;
        else if (m.direction === "OUT") sumGrams -= val;
        else if (m.direction === "ADJUST") sumGrams += val;
      }
    });

    // Only set fields that are actually tracked by movements
    if (sumUnits !== null) prod.stockQty = Math.max(0, sumUnits);
    if (sumGrams !== null) prod.stockGrams = Math.max(0, sumGrams);

    await prod.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ product: prod._id, stockQty: prod.stockQty ?? null, stockGrams: prod.stockGrams ?? null });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("recalculateBalance error:", err);
    res.status(500).json({ message: "Failed to recalculate balance" });
  }
};
