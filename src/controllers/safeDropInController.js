// controllers/safeDropIn.controller.js
const SafeDropIn = require("../models/SafeDropIn");

const parseIntOr = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

exports.createSafeDropIn = async (req, res) => {
  try {
    const body = req.body || {};
    const doc = await SafeDropIn.create({
      dropNo: body.dropNo,
      userName: body.userName,
      details: body.details,
      date: body.date,
      denominations: body.denominations,
      dropInTender: body.dropInTender,
    });
    return res.status(201).json(doc);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.getSafeDropIns = async (req, res) => {
  try {
    const {
      q,                  // search by dropNo or userName
      from, to,           // date range (ISO)
      page = 1,
      limit = 20,
      sort = "-date",     // default latest first
    } = req.query;

    const filter = {};
    if (q) {
      filter.$or = [
        { dropNo: { $regex: q, $options: "i" } },
        { userName: { $regex: q, $options: "i" } },
        { details: { $regex: q, $options: "i" } },
      ];
    }
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const skip = (parseIntOr(page, 1) - 1) * parseIntOr(limit, 20);
    const [items, total] = await Promise.all([
      SafeDropIn.find(filter).sort(sort).skip(skip).limit(parseIntOr(limit, 20)),
      SafeDropIn.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / parseIntOr(limit, 20)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSafeDropInById = async (req, res) => {
  try {
    const doc = await SafeDropIn.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateSafeDropIn = async (req, res) => {
  try {
    const doc = await SafeDropIn.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });

    const { dropNo, userName, details, date, denominations, dropInTender } = req.body || {};
    if (dropNo !== undefined) doc.dropNo = dropNo;
    if (userName !== undefined) doc.userName = userName;
    if (details !== undefined) doc.details = details;
    if (date !== undefined) doc.date = date;
    if (denominations !== undefined) doc.denominations = denominations;
    if (dropInTender !== undefined) doc.dropInTender = dropInTender;

    await doc.validate(); // triggers pre('validate') to recompute dropInAmount
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteSafeDropIn = async (req, res) => {
  try {
    const doc = await SafeDropIn.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
