const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  item_name: { type: String, required: true },
  qty_sold: { type: Number, required: true }
});

module.exports = mongoose.model('Sale', SaleSchema); // Collection: sales