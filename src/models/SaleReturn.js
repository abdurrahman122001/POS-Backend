const mongoose = require('mongoose');

const saleReturnSchema = new mongoose.Schema({
  originalSaleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true,
  },
  customerId: {
    type: String,
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      name: String,
      price: Number,
      qty: Number,
      total: Number,
    },
  ],
  returnAmount: {
    type: Number,
    required: true,
  },
  notes: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SaleReturn', saleReturnSchema);