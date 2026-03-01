import React from 'react';
import { AlertTriangle, CheckCircle, ShoppingCart, Clock } from 'lucide-react';

const ShoppingList = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="bg-green-50 p-8 rounded-xl border border-green-100 flex flex-col items-center justify-center text-green-700">
        <CheckCircle size={48} className="mb-2" />
        <p className="font-semibold">All Stock Levels Optimal!</p>
        <p className="text-sm opacity-80">No orders needed today.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <ShoppingCart className="text-blue-600" /> 
          Recommended Orders (Today)
        </h3>
        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
          {items.length} Items
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 font-medium">Ingredient</th>
              <th className="px-6 py-3 font-medium">Lead Time</th>
              <th className="px-6 py-3 font-medium">Reason</th>
              <th className="px-6 py-3 font-medium text-right">Order Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-800">
                  {item.ingredient}
                </td>
                <td className="px-6 py-4 text-gray-500 flex items-center gap-1">
                  <Clock size={14} /> {item.lead_time_days} days
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs">
                    <span className="text-red-500 font-medium block">
                      Needed by {item.target_date}
                    </span>
                    <span className="text-gray-400">
                      Req: {item.needed_for_target} | Have: {item.current_stock}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-100 text-red-700 font-bold border border-red-200">
                    <AlertTriangle size={14} />
                    {item.order_qty}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShoppingList;