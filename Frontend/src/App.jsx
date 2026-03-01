import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts'; // Changed to AreaChart for better visualization
import Layout from './components/Layout';
import Login from './pages/Login';
import SalesEntry from './pages/SalesEntry';
import DataTableView from './pages/DataTableView';
import RecipeManagement from './pages/RecipeManagement';
import OrderManagement from './pages/OrderManagement';
import Dashboard from './pages/Dashboard';
import InventoryManagement from './pages/InventoryManagement';
import { 
  fetchInventoryData, 
  fetchRecipeData, 
  fetchInventoryPrediction,
  fetchSalesHistory 
} from './services/api';

const calculateRecipeCost = (recipe, inventoryList) => {
  if (!recipe.ingredients || !Array.isArray(inventoryList)) return 0;
  let totalCost = 0;
  recipe.ingredients.forEach(ing => {
    const stockItem = inventoryList.find(i => i.name === ing.name);
    if (stockItem) totalCost += (ing.qty * (stockItem.unit_price || 0));
  });
  return totalCost;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [aiPredictions, setAiPredictions] = useState([]); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      setLoading(true);
      const loadDatabase = async () => {
        try {
          const [invData, recData, aiData, salesData] = await Promise.all([
            fetchInventoryData().catch(() => []),
            fetchRecipeData().catch(() => []),
            fetchInventoryPrediction().catch(() => ({ shopping_list: [] })),
            fetchSalesHistory().catch(() => [])
          ]);

          setInventory(Array.isArray(invData) ? invData : []);
          setRecipes(Array.isArray(recData) ? recData : []);
          setAiPredictions(aiData?.shopping_list || []);
          
          const history = Array.isArray(salesData) ? salesData : [];

        } catch (error) {
          console.error("Critical Data Load Error:", error);
        } finally {
          setLoading(false);
        }
      };
      loadDatabase();
    }
  }, [isLoggedIn]);

  // --- MERGE LOGIC ---
  const getSmartInventory = () => {
    if (!Array.isArray(inventory)) return [];
    return inventory.map(item => {
      const safePredictions = Array.isArray(aiPredictions) ? aiPredictions : [];
      const prediction = safePredictions.find(p => p.ingredient === item.name);
      let status = 'Good';
      let nextAction = 'No Action';
      if (prediction) {
        status = 'Reorder Now';
        nextAction = `Buy ${prediction.order_qty} ${item.unit} by ${prediction.target_date}`;
      } else if (item.stock < 10) status = 'Low Stock';

      return {
        name: item.name,
        stock: `${item.stock} ${item.unit}`,
        unit_price: `$${(item.unit_price || 0).toFixed(3)}`, 
        status: status,     
        next_action: nextAction 
      };
    });
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isLoggedIn ? <Login setIsLoggedIn={setIsLoggedIn} /> : <Navigate to="/" />} />

        <Route path="/*" element={
            isLoggedIn ? (
              <Layout setIsLoggedIn={setIsLoggedIn}>
                <Routes>
                  {/* === FINANCIAL DASHBOARD === */}
                  <Route path="/" element={<Dashboard />} />
                  
                  {/* ROUTES REMAINDER */}
                  <Route path="/sales-entry" element={<SalesEntry menuItems={recipes} />} />
                  
                  <Route path="/inventory" element={<InventoryManagement />} />
                  
                  <Route path="/lead-times" element={
                       <DataTableView 
                          title="Supplier Lead Times" 
                          description="Delivery estimates."
                          columns={['Name', 'Lead Time']}
                          data={inventory.map(i => ({ name: i.name, lead_time: `${i.lead_time || 1} Days` }))}
                      />
                  } />

                  <Route path="/mrp" element={
                       <DataTableView 
                          title="Product Pricing (MRP)" 
                          description="Live cost analysis & margins."
                          columns={['Item', 'Category', 'Selling Price', 'Making Cost', 'Margin']}
                          data={recipes.map(r => {
                            const makingCost = calculateRecipeCost(r, inventory);
                            const sellingPrice = r.price || 0;
                            const margin = sellingPrice - makingCost;
                            return {
                              item: r.item_name,
                              category: r.category || 'General',
                              selling_price: `$${sellingPrice.toFixed(2)}`,
                              making_cost: `$${makingCost.toFixed(2)}`, 
                              margin: `$${margin.toFixed(2)}`
                            };
                          })}
                      />
                  } />

                  <Route path="/recipes" element={<RecipeManagement inventoryData={inventory} />} />
                  <Route path="/orders" element={<OrderManagement />} />
                </Routes>
              </Layout>
            ) : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;