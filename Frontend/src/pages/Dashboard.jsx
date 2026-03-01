import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchSalesHistory, fetchInventoryPrediction, fetchRecipeData, fetchInventoryData } from '../services/api';

const calculateRecipeCost = (recipeName, recipes, inventoryList) => {
  const recipe = recipes.find(r => r.item_name === recipeName);
  if (!recipe || !recipe.ingredients || !Array.isArray(inventoryList)) return 0;
  
  let totalCost = 0;
  recipe.ingredients.forEach(ing => {
    const stockItem = inventoryList.find(i => i.name === ing.name);
    if (stockItem) totalCost += (ing.qty * (stockItem.unit_price || 0));
  });
  return totalCost;
};

const getRecipePrice = (recipeName, recipes) => {
  const recipe = recipes.find(r => r.item_name === recipeName);
  return recipe ? (recipe.price || 0) : 0;
};

const Dashboard = () => {
  const [salesHistory, setSalesHistory] = useState([]);
  const [futurePredictions, setFuturePredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [historyData, aiData, recipes, inventory] = await Promise.all([
        fetchSalesHistory(),
        fetchInventoryPrediction(),
        fetchRecipeData(),
        fetchInventoryData()
      ]);

      const history = Array.isArray(historyData) ? historyData : [];
      setSalesHistory(history);
      
      const totRev = history.reduce((acc, day) => acc + day.revenue, 0);
      const totProf = history.reduce((acc, day) => acc + day.profit, 0);
      setTotalRevenue(totRev);
      setTotalProfit(totProf);

      const predictionsList = aiData?.shopping_list || [];
      setPendingOrdersCount(predictionsList.length);

      // Process Future Predictions Chart Data
      if (aiData && aiData.forecast) {
        const forecastObj = aiData.forecast; // Format: {"2026-03-02": {"Burger": 10}, ...}
        const futureData = [];
        
        for (const [dateStr, itemsData] of Object.entries(forecastObj)) {
          let dailyPredictedRevenue = 0;
          let dailyPredictedProfit = 0;

          // For each item predicted to sell on that day
          for (const [itemName, predictedQty] of Object.entries(itemsData)) {
             const price = getRecipePrice(itemName, recipes);
             const cost = calculateRecipeCost(itemName, recipes, inventory);
             
             dailyPredictedRevenue += (predictedQty * price);
             dailyPredictedProfit += (predictedQty * (price - cost));
          }

          futureData.push({
            date: dateStr,
            revenue: Number(dailyPredictedRevenue.toFixed(2)),
            profit: Number(dailyPredictedProfit.toFixed(2))
          });
        }
        
        // Sort future dates
        futureData.sort((a, b) => new Date(a.date) - new Date(b.date));
        setFuturePredictions(futureData);
      }

    } catch (err) {
      console.error("Dashboard data load error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-bold text-pantri-primary">Financial Overview</h2>
            <p className="text-sage">Performance across the last 30 days and AI-powered future forecasts.</p>
        </div>
        <div className="text-right hidden md:block">
            <p className="text-xs text-sage uppercase font-bold">Current Net Profit</p>
            <p className="text-3xl font-bold text-green-700">+${totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pantri-bc/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><h1 className="text-6xl font-bold text-pantri-primary">$</h1></div>
              <div className="text-sage text-xs font-bold uppercase tracking-wider mb-1">Total Revenue (30d)</div>
              <div className="text-3xl font-bold text-charcoal">${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <div className="text-green-600 text-xs mt-2 font-bold flex items-center">↑ Gross Sales Collected</div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pantri-bc/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><h1 className="text-6xl font-bold text-green-700">%</h1></div>
              <div className="text-sage text-xs font-bold uppercase tracking-wider mb-1">Net Profit (30d)</div>
              <div className="text-3xl font-bold text-green-700">${totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <div className="text-sage text-xs mt-2">After food costs (COGS)</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pantri-bc/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><h1 className="text-6xl font-bold text-pantri-primary">!</h1></div>
              <div className="text-sage text-xs font-bold uppercase tracking-wider mb-1">Pending Orders</div>
              <div className="text-3xl font-bold text-red-700">{pendingOrdersCount} <span className="text-lg font-normal text-charcoal">items</span></div>
              <div className="text-red-600/70 text-xs mt-2 font-bold hover:underline cursor-pointer"><Link to="/orders">Action Required in Smart Orders &rarr;</Link></div>
          </div>
      </div>

      {/* Historical Profit Graph */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-pantri-bc/30">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-charcoal">Past 30 Days Trend</h3>
            <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-200"></div> Net Profit</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pantri-bc/50"></div> Gross Revenue</div>
            </div>
          </div>
          
          <div className="h-80 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-sage animate-pulse">Loading Historical Data...</div>
            ) : salesHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesHistory}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#15803d" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#15803d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{fill: '#8F9E82', fontSize: 12}} tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis tick={{fill: '#8F9E82', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name === 'profit' ? 'Net Profit' : 'Gross Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#C89F87" fill="transparent" strokeWidth={2} />
                  <Area type="monotone" dataKey="profit" stroke="#15803d" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sage">No historical data available yet. Please punch some sales.</div>
            )}
          </div>
      </div>

       {/* Future Prediction Profit Graph */}
       <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-3xl shadow-sm border border-indigo-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                 <span className="text-indigo-600">✨</span> ML Projected Future Output (Next 30 Days)
              </h3>
              <p className="text-sm text-indigo-600/70 mt-1">Based on random forest demand forecasting models.</p>
            </div>
            <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-300"></div> Projected Net Profit</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-100"></div> Projected Revenue</div>
            </div>
          </div>
          
          <div className="h-80 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-indigo-400 animate-pulse">Running ML Models...</div>
            ) : futurePredictions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={futurePredictions}>
                  <defs>
                    <linearGradient id="colorFutureProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFutureRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                  <XAxis dataKey="date" tick={{fill: '#6366f1', fontSize: 12}} tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis tick={{fill: '#6366f1', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #c7d2fe', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name === 'profit' ? 'AI Projected Profit' : 'AI Projected Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#818cf8" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorFutureRev)" strokeWidth={2} />
                  <Area type="monotone" dataKey="profit" stroke="#4f46e5" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorFutureProfit)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-indigo-400">
                  <p>No ML prediction data available. </p>
                  <p className="text-sm mt-2">Ensure Python AI service is running and endpoints are accessible.</p>
              </div>
            )}
          </div>
      </div>

    </div>
  );
};

export default Dashboard;
