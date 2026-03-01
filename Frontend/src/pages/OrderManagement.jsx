import React, { useState, useEffect } from 'react';
import { fetchInventoryPrediction, submitInventoryOrder } from '../services/api';
import { PackageCheck, AlertTriangle } from 'lucide-react';

const OrderManagement = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInventoryPrediction();
      setPredictions(data.shopping_list || []);
    } catch (err) {
      setError("Failed to load ML predictions. Ensure AI service is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSingle = async (item) => {
    if (window.confirm(`Place order for ${item.order_qty} ${item.ingredient}?`)) {
      setProcessing(true);
      try {
        await submitInventoryOrder([{ name: item.ingredient, qty: item.order_qty }]);
        alert("Order placed successfully! Stock updated.");
        loadPredictions(); // Reload from AI
      } catch (err) {
        alert("Failed to place order.");
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleOrderAll = async () => {
    if (predictions.length === 0) return;
    
    if (window.confirm(`Place bulk order for ${predictions.length} items?`)) {
      setProcessing(true);
      try {
        const orderData = predictions.map(p => ({ name: p.ingredient, qty: p.order_qty }));
        await submitInventoryOrder(orderData);
        alert("Bulk order placed successfully! Stock updated.");
        loadPredictions();
      } catch (err) {
        alert("Failed to place bulk order.");
      } finally {
        setProcessing(false);
      }
    }
  };

  if (loading) {
    return <div className="p-8"><div className="animate-pulse text-sage">Loading ML Predictions...</div></div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-pantri-primary flex items-center gap-3">
            <PackageCheck size={32} />
            Smart Order Management
          </h2>
          <p className="text-sage mt-2">ML-driven procurement suggestions to prevent stockouts.</p>
        </div>
        {predictions.length > 0 && (
          <button 
            onClick={handleOrderAll}
            disabled={processing}
            className="bg-pantri-primary text-white font-bold py-3 px-6 rounded-xl shadow-md hover:bg-pantri-primary/90 transition-all disabled:opacity-50"
          >
            {processing ? 'Processing...' : `Order All (${predictions.length} Items)`}
          </button>
        )}
      </header>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-8 flex items-center gap-3 border border-red-200">
          <AlertTriangle size={24} />
          {error}
        </div>
      )}

      {predictions.length === 0 && !error ? (
        <div className="bg-green-50 text-green-700 p-8 rounded-2xl text-center border border-green-200 shadow-sm">
          <PackageCheck size={48} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">Inventory is Optimal</h3>
          <p>The ML model predicts no imminent stockouts based on the next 7 days of forecasted sales.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {predictions.map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-charcoal">{item.ingredient}</h3>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                  Urgent
                </span>
              </div>
              
              <div className="space-y-3 mb-6 flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-sage">Current Stock:</span>
                  <span className="font-bold text-charcoal">{Math.round(item.current_stock)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-sage">Needed By {item.target_date}:</span>
                  <span className="font-bold text-charcoal">{Math.round(item.needed_for_target)}</span>
                </div>
                <div className="pt-2 border-t border-pantri-bc/30 flex justify-between text-base">
                  <span className="text-charcoal font-bold">Suggested Order:</span>
                  <span className="font-bold text-pantri-primary text-xl">+{Math.ceil(item.order_qty)}</span>
                </div>
              </div>

              <button 
                onClick={() => handleOrderSingle(item)}
                disabled={processing}
                className="w-full bg-charcoal text-white font-bold py-2 rounded-xl hover:bg-pantri-primary transition-colors disabled:opacity-50"
              >
                Confirm Order
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
