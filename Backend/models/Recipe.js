const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  item_name: { type: String, required: true },
  category: { type: String, default: 'Main' }, 
  price: { type: Number, default: 0 },          
  cost: { type: Number, default: 0 },           
  ingredients: [{
    name: { type: String, required: true },
    qty: { type: Number, required: true }
  }]
});

module.exports = mongoose.model('Recipe', RecipeSchema);