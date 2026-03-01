const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  stock: { type: Number, required: true },
  unit: { type: String, default: 'units' },
  unit_price: { type: Number, default: 0 }, 
  lead_time: { type: Number, default: 1 },
  expiry_days: { type: Number, default: 7 },
  last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ingredient', InventorySchema);