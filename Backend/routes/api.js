const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const Recipe = require('../models/Recipe');
const Sale = require('../models/Sale');
const axios = require('axios'); // Needed to talk to Python AI

// --- INVENTORY ROUTES ---

// GET /api/inventory
router.get('/inventory', async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/inventory (To manually update stock)
router.post('/inventory', async (req, res) => {
  const { name, stock, lead_time, unit_price, expiry_days } = req.body;
  try {
    let item = await Inventory.findOne({ name });
    if (item) {
      if (stock !== undefined) item.stock = stock;
      if (lead_time !== undefined) item.lead_time = lead_time;
      if (unit_price !== undefined) item.unit_price = unit_price;
      if (expiry_days !== undefined) item.expiry_days = expiry_days;
      await item.save();
    } else {
      item = new Inventory({ name, stock, lead_time, unit_price, expiry_days });
      await item.save();
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/inventory/:id
router.put('/inventory/:id', async (req, res) => {
  try {
    const updatedIngredient = await Inventory.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!updatedIngredient) return res.status(404).json({ message: "Ingredient not found" });
    res.json(updatedIngredient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/inventory/:id
router.delete('/inventory/:id', async (req, res) => {
  try {
    const deletedIngredient = await Inventory.findByIdAndDelete(req.params.id);
    if (!deletedIngredient) return res.status(404).json({ message: "Ingredient not found" });
    res.json({ message: "Ingredient deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/inventory/order (To receive an order & increment stock)
router.post('/inventory/order', async (req, res) => {
  const { orders } = req.body; // Expecting { orders: [{ name: "Bun", qty: 50 }, ...] }
  
  if (!Array.isArray(orders)) {
    return res.status(400).json({ message: "Orders must be an array" });
  }

  try {
    const bulkOps = orders.map(order => ({
      updateOne: {
        filter: { name: order.name },
        update: { $inc: { stock: order.qty } }
      }
    }));

    if (bulkOps.length > 0) {
      await Inventory.bulkWrite(bulkOps);
    }
    
    res.json({ message: "Stock updated successfully based on orders", count: orders.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- RECIPE ROUTES ---

// GET /api/recipes
router.get('/recipes', async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/recipes
router.post('/recipes', async (req, res) => {
  try {
    const recipe = new Recipe(req.body);
    await recipe.save();
    res.status(201).json(recipe);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/recipes/:id
router.put('/recipes/:id', async (req, res) => {
  try {
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!updatedRecipe) return res.status(404).json({ message: "Recipe not found" });
    res.json(updatedRecipe);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/recipes/:id
router.delete('/recipes/:id', async (req, res) => {
  try {
    const deletedRecipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!deletedRecipe) return res.status(404).json({ message: "Recipe not found" });
    res.json({ message: "Recipe deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- SALES ROUTES ---

// POST /api/sales (Punching Sales)
router.post('/sales', async (req, res) => {
  const salesData = req.body; // Expecting array: [{item_name: "Burger", qty: 5}]
  
  if (!Array.isArray(salesData)) {
    return res.status(400).json({ message: "Data must be an array" });
  }

  try {
    const newSales = salesData
      .filter(item => item.qty > 0)
      .map(item => ({
        item_name: item.item_name,
        qty_sold: item.qty,
        date: new Date()
      }));

    if (newSales.length > 0) {
      await Sale.insertMany(newSales);
      
      // OPTIONAL: Update Inventory immediately based on recipe?
      // Yes, updating inventory immediately as part of the POS flow.
      const recipes = await Recipe.find({ item_name: { $in: newSales.map(s => s.item_name) } });
      const inventoryItems = await Inventory.find();

      const bulkOps = [];
      
      newSales.forEach(sale => {
        const recipe = recipes.find(r => r.item_name === sale.item_name);
        if (recipe && recipe.ingredients) {
          recipe.ingredients.forEach(ing => {
            const totalQtyNeeded = ing.qty * sale.qty_sold;
            // Subtract from inventory
            bulkOps.push({
              updateOne: {
                filter: { name: ing.name },
                update: { $inc: { stock: -totalQtyNeeded } }
              }
            });
          });
        }
      });

      if (bulkOps.length > 0) {
        await Inventory.bulkWrite(bulkOps);
      }
    }
    
    res.json({ message: "Sales recorded successfully", count: newSales.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- AI PREDICTION PROXY ---
// The React app calls Node, Node calls Python.
router.get('/predict-orders', async (req, res) => {
  try {
    // Assuming Python is running on port 3900
    const pythonResponse = await axios.get('http://localhost:3900/predict-orders');
    res.json(pythonResponse.data);
  } catch (err) {
    console.error("AI Service Error:", err.message);
    res.status(503).json({ 
      message: "AI Brain is offline. Ensure Python service is running on port 3900." 
    });
  }
});
// GET /api/sales/history (Smart Financials)
router.get('/sales/history', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Fetch EVERYTHING needed for the math
    const sales = await Sale.find({ date: { $gte: thirtyDaysAgo } });
    const recipes = await Recipe.find();
    const inventory = await Inventory.find(); // <--- Needed for prices

    // 2. Build an Inventory Price Map (Fast Lookup)
    // { "Tomato": 0.005, "Bun": 0.50, ... }
    const ingredientPrices = {};
    inventory.forEach(item => {
      ingredientPrices[item.name] = item.unit_price || 0;
    });

    // 3. Calculate Dynamic Cost for every Recipe
    const recipeFinancials = {};
    recipes.forEach(r => {
      let makingCost = 0;
      
      // Sum up the cost of ingredients
      if (r.ingredients && Array.isArray(r.ingredients)) {
        r.ingredients.forEach(ing => {
          const price = ingredientPrices[ing.name] || 0;
          makingCost += (ing.qty * price);
        });
      }

      recipeFinancials[r.item_name] = { 
        price: r.price || 0, 
        cost: makingCost // <--- The calculated cost
      };
    });

    // 4. Generate Daily Stats
    const dailyStats = {};

    sales.forEach(sale => {
      const dateKey = sale.date.toISOString().split('T')[0];
      
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { date: dateKey, revenue: 0, profit: 0, units: 0 };
      }

      const info = recipeFinancials[sale.item_name];
      if (info) {
        const rev = sale.qty_sold * info.price;
        const cost = sale.qty_sold * info.cost; // Now this is accurate!
        
        dailyStats[dateKey].revenue += rev;
        dailyStats[dateKey].profit += (rev - cost);
        dailyStats[dateKey].units += sale.qty_sold;
      }
    });

    // 5. Sort and Send
    const result = Object.values(dailyStats).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});module.exports = router;