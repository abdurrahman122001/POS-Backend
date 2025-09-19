const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cashController');

// drawers
router.get('/drawers/current', ctrl.getCurrentDrawer);
router.post('/drawers/open', ctrl.openDrawer);
router.post('/drawers/:id/close', ctrl.closeDrawer);

// transactions
router.get('/transactions', ctrl.listTransactions);
router.post('/transactions', ctrl.createTransaction);
router.put('/transactions/:id', ctrl.updateTransaction);
router.delete('/transactions/:id', ctrl.deleteTransaction);

// balance
router.get('/balance', ctrl.getBalance);

module.exports = router;
