const CashDrawer = require('../models/CashDrawer');
const CashTransaction = require('../models/CashTransaction');

// ---- DRAWERS ----

/** GET /cash/drawers/current */
exports.getCurrentDrawer = async (_req, res) => {
  try {
    const drawer = await CashDrawer.findOne({ isOpen: true }).sort({ openedAt: -1 });
    if (!drawer) return res.status(404).json({ message: 'No open cash drawer' });
    res.json(drawer);
  } catch {
    res.status(500).json({ message: 'Failed to fetch current drawer' });
  }
};

/** POST /cash/drawers/open { openingBalance, notes? } */
exports.openDrawer = async (req, res) => {
  try {
    const exists = await CashDrawer.findOne({ isOpen: true });
    if (exists) return res.status(400).json({ message: 'A cash drawer is already open' });

    const { openingBalance, notes } = req.body;
    if (openingBalance === undefined || Number(openingBalance) < 0) {
      return res.status(400).json({ message: 'openingBalance is required and must be >= 0' });
    }

    const drawer = await CashDrawer.create({
      openingBalance: Number(openingBalance),
      notes: notes || undefined,
      isOpen: true,
    });

    res.status(201).json(drawer);
  } catch {
    res.status(500).json({ message: 'Failed to open drawer' });
  }
};

/** POST /cash/drawers/:id/close */
exports.closeDrawer = async (req, res) => {
  try {
    const { id } = req.params;
    const drawer = await CashDrawer.findById(id);
    if (!drawer || !drawer.isOpen) return res.status(404).json({ message: 'Open drawer not found' });

    drawer.isOpen = false;
    drawer.closedAt = new Date();
    await drawer.save();
    res.json(drawer);
  } catch {
    res.status(500).json({ message: 'Failed to close drawer' });
  }
};

// ---- TRANSACTIONS ----

/** GET /cash/transactions?drawerId=<id> */
exports.listTransactions = async (req, res) => {
  try {
    const { drawerId } = req.query;
    const drawer = drawerId
      ? await CashDrawer.findById(drawerId)
      : await CashDrawer.findOne({ isOpen: true }).sort({ openedAt: -1 });

    if (!drawer) return res.status(404).json({ message: 'Drawer not found' });

    const txns = await CashTransaction.find({ drawer: drawer._id }).sort({ createdAt: -1 });
    res.json({ data: txns });
  } catch {
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

/** POST /cash/transactions { type, amount, description?, createdBy?, drawerId? } */
exports.createTransaction = async (req, res) => {
  try {
    const { type, amount, description, createdBy, drawerId } = req.body;
    if (!type || amount === undefined) {
      return res.status(400).json({ message: 'type and amount are required' });
    }

    const drawer = drawerId
      ? await CashDrawer.findById(drawerId)
      : await CashDrawer.findOne({ isOpen: true }).sort({ openedAt: -1 });

    if (!drawer || !drawer.isOpen) return res.status(400).json({ message: 'No open drawer to record transaction' });

    const txn = await CashTransaction.create({
      drawer: drawer._id,
      type,
      amount: Number(amount), // sign normalized by pre-validate
      description: description || '',
      createdBy: createdBy || undefined,
    });

    res.status(201).json(txn);
  } catch {
    res.status(500).json({ message: 'Failed to create transaction' });
  }
};

/** PUT /cash/transactions/:id  { type?, amount?, description? } */
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = {};
    if (req.body.type !== undefined) patch.type = req.body.type;
    if (req.body.amount !== undefined) patch.amount = Number(req.body.amount);
    if (req.body.description !== undefined) patch.description = String(req.body.description);

    const txn = await CashTransaction.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    });
    if (!txn) return res.status(404).json({ message: 'Transaction not found' });

    res.json(txn);
  } catch {
    res.status(500).json({ message: 'Failed to update transaction' });
  }
};

/** DELETE /cash/transactions/:id */
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CashTransaction.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Failed to delete transaction' });
  }
};

/** GET /cash/balance?drawerId=<id> */
exports.getBalance = async (req, res) => {
  try {
    const { drawerId } = req.query;
    const drawer = drawerId
      ? await CashDrawer.findById(drawerId)
      : await CashDrawer.findOne({ isOpen: true }).sort({ openedAt: -1 });

    if (!drawer) return res.status(404).json({ message: 'Drawer not found' });

    const agg = await CashTransaction.aggregate([
      { $match: { drawer: drawer._id } },
      { $group: { _id: '$drawer', total: { $sum: '$amount' } } },
    ]);

    const total = agg[0]?.total ?? 0;
    const currentBalance = drawer.openingBalance + total;

    res.json({
      drawerId: drawer._id,
      openingBalance: drawer.openingBalance,
      totalTransactions: total,
      currentBalance,
    });
  } catch {
    res.status(500).json({ message: 'Failed to compute balance' });
  }
};
