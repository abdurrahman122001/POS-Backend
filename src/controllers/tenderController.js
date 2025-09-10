import { TenderDenomination } from "../models/TenderDenomination.js";

export async function listDenoms(req, res) {
  try {
    const onlyActive = req.query.active === "true";
    const filter = onlyActive ? { active: true } : {};
    const docs = await TenderDenomination.find(filter).sort({ sortOrder: 1, value: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
}

export async function getDenom(req, res) {
  try {
    const doc = await TenderDenomination.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
}

export async function createDenom(req, res) {
  try {
    const { value, label, active = true, sortOrder = 0 } = req.body || {};
    if (value === undefined)
      return res.status(400).json({ message: "value is required" });

    const exists = await TenderDenomination.findOne({ value });
    if (exists) return res.status(409).json({ message: "value already exists" });

    const doc = await TenderDenomination.create({ value, label, active, sortOrder });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
}

export async function updateDenom(req, res) {
  try {
    const { value, label, active, sortOrder } = req.body || {};
    const doc = await TenderDenomination.findByIdAndUpdate(
      req.params.id,
      { $set: { value, label, active, sortOrder } },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
}

export async function deleteDenom(req, res) {
  try {
    const doc = await TenderDenomination.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
}

// Quick seed (optional — remove/lock for production)
export async function seedDefaults(_req, res) {
  try {
    const defaults = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1].map((v, i) => ({
      value: v,
      label: `Rs.${v}`,
      active: true,
      sortOrder: i
    }));
    await TenderDenomination.deleteMany({});
    await TenderDenomination.insertMany(defaults);
    res.json({ ok: true, count: defaults.length });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
}
