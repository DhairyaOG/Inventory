import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import SalesEntry from './pages/SalesEntry';
import DataTableView from './pages/DataTableView';
import RecipeManagement from './pages/RecipeManagement';
import OrderManagement from './pages/OrderManagement';
import Dashboard from './pages/Dashboard';
import InventoryManagement from './pages/InventoryManagement';
import POS from './pages/POS';
import { 
  fetchInventoryData, 
  fetchRecipeData, 
  fetchInventoryPrediction,
  fetchSalesHistory,
  isAuthenticated,
  getUserRole
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
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [userRole, setUserRole] = useState(getUserRole());
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [aiPredictions, setAiPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      setLoading(true);
      loadDatabase();
    }
  }, [isLoggedIn]);

  const loadDatabase = async () => {
    try {
      const promises = [
        fetchInventoryData().catch(() => []),
        fetchRecipeData().catch(() => []),
      ];

      // Only fetch predictions and sales if user is manager
      if (userRole === 'manager') {
        promises.push(
          fetchInventoryPrediction().catch(() => ({ shopping_list: [] })),
          fetchSalesHistory().catch(() => [])
        );
      }

      const results = await Promise.all(promises);
      
      setInventory(Array.isArray(results[0]) ? results[0] : []);
      setRecipes(Array.isArray(results[1]) ? results[1] : []);
      
      if (userRole === 'manager' && results[2]) {
        setAiPredictions(results[2]?.shopping_list || []);
      }
    } catch (error) {
      console.error("Critical Data Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshRecipes = async () => {
    const recData = await fetchRecipeData().catch(() => []);
    setRecipes(Array.isArray(recData) ? recData : []);
  };

  const refreshInventory = async () => {
    const invData = await fetchInventoryData().catch(() => []);
    setInventory(Array.isArray(invData) ? invData : []);
  };

  // Protected Route Component
  const ProtectedRoute = ({ children, managerOnly = false }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" />;
    }
    
    if (managerOnly && userRole !== 'manager') {
      return <Navigate to="/pos" />; // Redirect waiters to POS
    }
    
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            !isLoggedIn ? 
            <Login setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} /> : 
            <Navigate to={userRole === 'waiter' ? '/pos' : '/'} />
          } 
        />
        
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout setIsLoggedIn={setIsLoggedIn} userRole={userRole}>
              <Routes>
                {/* WAITER: Only POS access */}
                <Route 
                  path="/pos" 
                  element={<POS />} 
                />

                {/* MANAGER: All routes below */}
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute managerOnly>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/sales-entry" 
                  element={
                    <ProtectedRoute managerOnly>
                      <SalesEntry menuItems={recipes} />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/inventory" 
                  element={
                    <ProtectedRoute managerOnly>
                      <InventoryManagement />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/lead-times" 
                  element={
                    <ProtectedRoute managerOnly>
                      <DataTableView
                        title="Supplier Lead Times"
                        description="Delivery estimates."
                        columns={['Name', 'Lead Time']}
                        data={inventory.map(i => ({ 
                          name: i.name, 
                          lead_time: `${i.lead_time || 1} Days` 
                        }))}
                      />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/mrp" 
                  element={
                    <ProtectedRoute managerOnly>
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
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/recipes" 
                  element={
                    <ProtectedRoute managerOnly>
                      <RecipeManagement
                        inventoryData={inventory}
                        onRecipeUpdate={refreshRecipes}
                      />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/orders" 
                  element={
                    <ProtectedRoute managerOnly>
                      <OrderManagement />
                    </ProtectedRoute>
                  } 
                />

                {/* Redirect unknown routes */}
                <Route 
                  path="*" 
                  element={<Navigate to={userRole === 'waiter' ? '/pos' : '/'} />} 
                />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;