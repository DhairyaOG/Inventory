const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const Recipe = require('../models/Recipe');
const Sale = require('../models/Sale');
const axios = require('axios');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { authenticateToken, requireManager } = require('../middleware/authMiddleware');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================================================
// INVENTORY ROUTES - Manager Only (except GET)
// ============================================================

// GET - Both Manager and Waiter can view
router.get('/inventory', authenticateToken, async (req, res) => {
  try { 
    res.json(await Inventory.find()); 
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// POST - Manager Only
router.post('/inventory', authenticateToken, requireManager, async (req, res) => {
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

// PUT - Manager Only
router.put('/inventory/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const updated = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Ingredient not found" });
    res.json(updated);
  } catch (err) { 
    res.status(400).json({ message: err.message }); 
  }
});

// DELETE - Manager Only
router.delete('/inventory/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const deleted = await Inventory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Ingredient not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// POST Order - Manager Only
router.post('/inventory/order', authenticateToken, requireManager, async (req, res) => {
  const { orders } = req.body;
  if (!Array.isArray(orders)) return res.status(400).json({ message: "Orders must be an array" });
  try {
    const bulkOps = orders.map(order => ({ 
      updateOne: { 
        filter: { name: order.name }, 
        update: { $inc: { stock: order.qty } } 
      } 
    }));
    if (bulkOps.length > 0) await Inventory.bulkWrite(bulkOps);
    res.json({ message: "Stock updated", count: orders.length });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// ============================================================
// RECIPES ROUTES - Manager Only (except GET)
// ============================================================

// GET - Both Manager and Waiter can view
router.get('/recipes', authenticateToken, async (req, res) => {
  try { 
    res.json(await Recipe.find()); 
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// POST - Manager Only
router.post('/recipes', authenticateToken, requireManager, async (req, res) => {
  try { 
    const r = new Recipe(req.body); 
    await r.save(); 
    res.status(201).json(r); 
  } catch (err) { 
    res.status(400).json({ message: err.message }); 
  }
});

// PUT - Manager Only
router.put('/recipes/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const updated = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Recipe not found" });
    res.json(updated);
  } catch (err) { 
    res.status(400).json({ message: err.message }); 
  }
});

// DELETE - Manager Only
router.delete('/recipes/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const deleted = await Recipe.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Recipe not found" });
    res.json({ message: "Deleted" });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// ============================================================
// SALES ROUTES - Both Manager and Waiter can create sales
// ============================================================

// POST - Both can create sales
router.post('/sales', authenticateToken, async (req, res) => {
  try {
    const rawData = Array.isArray(req.body) ? req.body : [req.body];
    const newSales = rawData
      .filter(item => item.item_name && item.qty_sold > 0)
      .map(item => ({
        item_name: item.item_name,
        qty_sold:  Number(item.qty_sold),
        revenue:   item.revenue || 0,
        date:      item.date ? new Date(item.date) : new Date(),
      }));
    if (newSales.length === 0) return res.status(400).json({ message: "No valid sales data" });
    await Sale.insertMany(newSales);
    
    const recipes = await Recipe.find({ item_name: { $in: newSales.map(s => s.item_name) } });
    const bulkOps = [];
    newSales.forEach(sale => {
      const recipe = recipes.find(r => r.item_name === sale.item_name);
      if (recipe?.ingredients) {
        recipe.ingredients.forEach(ing => {
          bulkOps.push({ 
            updateOne: { 
              filter: { name: ing.name }, 
              update: { $inc: { stock: -(ing.qty * sale.qty_sold) } } 
            } 
          });
        });
      }
    });
    if (bulkOps.length > 0) await Inventory.bulkWrite(bulkOps);
    res.json({ message: "Sales recorded", count: newSales.length });
  } catch (err) {
    console.error("Sales error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET Sales History - Manager Only
router.get('/sales/history', authenticateToken, requireManager, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [sales, recipes, inventory] = await Promise.all([
      Sale.find({ date: { $gte: thirtyDaysAgo } }), 
      Recipe.find(), 
      Inventory.find()
    ]);
    
    const ingredientPrices = {};
    inventory.forEach(item => { ingredientPrices[item.name] = item.unit_price || 0; });
    
    const recipeFinancials = {};
    recipes.forEach(r => {
      let makingCost = 0;
      if (r.ingredients) r.ingredients.forEach(ing => { 
        makingCost += (ing.qty * (ingredientPrices[ing.name] || 0)); 
      });
      recipeFinancials[r.item_name] = { price: r.price || 0, cost: makingCost };
    });
    
    const dailyStats = {};
    sales.forEach(sale => {
      const dateKey = sale.date.toISOString().split('T')[0];
      if (!dailyStats[dateKey]) dailyStats[dateKey] = { 
        date: dateKey, 
        revenue: 0, 
        profit: 0, 
        units: 0 
      };
      const info = recipeFinancials[sale.item_name];
      if (info) {
        const rev = sale.qty_sold * info.price;
        dailyStats[dateKey].revenue += rev;
        dailyStats[dateKey].profit += (rev - sale.qty_sold * info.cost);
        dailyStats[dateKey].units += sale.qty_sold;
      }
    });
    res.json(Object.values(dailyStats).sort((a, b) => new Date(a.date) - new Date(b.date)));
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// ============================================================
// RAZORPAY ROUTES - Both can create and verify payments
// ============================================================

// Create Payment Order - Both
router.post('/payments/create-order', authenticateToken, async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;
  if (!amount) return res.status(400).json({ message: "Amount required" });
  try {
    const order = await razorpay.orders.create({ 
      amount: Math.round(amount * 100), 
      currency, 
      receipt: receipt || `receipt_${Date.now()}` 
    });
    res.json({ 
      order_id: order.id, 
      currency: order.currency, 
      amount: order.amount, 
      key_id: process.env.RAZORPAY_KEY_ID 
    });
  } catch (err) {
    console.error("Razorpay error:", err);
    res.status(500).json({ message: "Failed to create payment order" });
  }
});

// Verify Payment - Both
router.post('/payments/verify', authenticateToken, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  if (expected !== razorpay_signature) return res.status(400).json({ 
    success: false, 
    message: "Payment verification failed" 
  });
  try {
    if (orderData?.items?.length > 0) {
      const salesToInsert = orderData.items.map(item => ({ 
        item_name: item.item_name, 
        qty_sold: item.qty, 
        revenue: item.total, 
        date: new Date() 
      }));
      await Sale.insertMany(salesToInsert);
      
      const recipes = await Recipe.find({ 
        item_name: { $in: salesToInsert.map(s => s.item_name) } 
      });
      const bulkOps = [];
      salesToInsert.forEach(sale => {
        const recipe = recipes.find(r => r.item_name === sale.item_name);
        if (recipe?.ingredients) {
          recipe.ingredients.forEach(ing => { 
            bulkOps.push({ 
              updateOne: { 
                filter: { name: ing.name }, 
                update: { $inc: { stock: -(ing.qty * sale.qty_sold) } } 
              } 
            }); 
          });
        }
      });
      if (bulkOps.length > 0) await Inventory.bulkWrite(bulkOps);
    }
    res.json({ 
      success: true, 
      payment_id: razorpay_payment_id, 
      message: "Payment verified and order saved" 
    });
  } catch (err) {
    console.error("Post-payment save error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Payment verified but save failed" 
    });
  }
});

// ============================================================
// AI PROXY - Manager Only
// ============================================================

router.get('/predict-orders', authenticateToken, requireManager, async (req, res) => {
  try {
    const mlApiUrl = process.env.ML_API_URL || 'http://localhost:3900';
    const r = await axios.get(`${mlApiUrl}/predict-orders`);
    res.json(r.data);
  } catch (err) {
    res.status(503).json({ 
      message: "AI service unavailable. Please contact support." 
    });
  }
});

module.exports = router;