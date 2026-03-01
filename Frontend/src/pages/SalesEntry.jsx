import React, { useState, useEffect } from 'react';
import { Save, Minus, Plus } from 'lucide-react';
import { submitSalesData } from '../services/api';

const SalesEntry = ({ menuItems = [] }) => {
  const [sales, setSales] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (menuItems && menuItems.length > 0) {
      setSales(menuItems.map((item, idx) => ({ 
        id: item._id || idx, 
        item: item.item_name, 
        qty: 0 
      })));
    }
  }, [menuItems]);

  const handleQtyChange = (id, change) => {
    setSales(sales.map(s => 
      s.id === id ? { ...s, qty: Math.max(0, s.qty + change) } : s
    ));
  };

  const handleSubmit = async () => {
    const totalSalesQty = sales.reduce((acc, sale) => acc + sale.qty, 0);
    if (totalSalesQty === 0) {
      alert("Please enter at least one sale volume.");
      return;
    }
    
    setSubmitting(true);
    try {
      // API expects: [{item_name: "Burger", qty: 5}]
      const payload = sales.map(s => ({ item_name: s.item, qty: s.qty }));
      await submitSalesData(payload);
      alert("Sales logged successfully! Inventory updated.");
      
      // Reset after submission
      setSales(sales.map(s => ({ ...s, qty: 0 })));
    } catch (error) {
      alert("Failed to record sales.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-charcoal">Daily Sales Entry</h1>
            <p className="text-sage mt-1">Record today's closing numbers to update inventory.</p>
        </div>

      <div className="bg-white rounded-3xl shadow-sm border border-pantri-bc/30 overflow-hidden">
        <div className="p-6 bg-cream border-b border-pantri-bc/30 flex justify-between items-center">
            <span className="font-bold text-charcoal text-lg">Date: {new Date().toLocaleDateString()}</span>
            <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide">
                Live Session
            </div>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {sales.map((saleItem) => (
            <div key={saleItem.id} className="flex items-center justify-between p-5 bg-cream-darker rounded-2xl border border-pantri-bc/20 hover:border-pantri-primary/50 transition-colors">
              <span className="text-lg font-semibold text-charcoal">{saleItem.item}</span>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleQtyChange(saleItem.id, -1)}
                  className="w-10 h-10 flex items-center justify-center text-pantri-primary bg-white border border-pantri-bc/30 hover:bg-pantri-bc/20 rounded-full transition shadow-sm"
                >
                  <Minus size={18} />
                </button>
                <span className="w-8 text-center font-bold text-2xl text-charcoal">
                  {saleItem.qty}
                </span>
                <button 
                  onClick={() => handleQtyChange(saleItem.id, 1)}
                  className="w-10 h-10 flex items-center justify-center text-white bg-pantri-primary hover:bg-pantri-dark rounded-full transition shadow-sm"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-6 bg-cream border-t border-pantri-bc/30 flex justify-end">
             <button 
                onClick={handleSubmit} 
                disabled={submitting || sales.length === 0}
                className="flex items-center gap-2 bg-charcoal hover:bg-black text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                <Save size={18} />
                {submitting ? 'Submitting...' : 'Submit Sales Log'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SalesEntry;