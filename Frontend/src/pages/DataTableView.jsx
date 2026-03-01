import React from 'react';
import { Edit2, Filter, Download } from 'lucide-react';

const DataTableView = ({ title, description, columns, data }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-charcoal">{title}</h1>
            <p className="text-sage mt-1">{description}</p>
        </div>
        <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-white border border-pantri-bc/50 text-sage hover:text-pantri-primary hover:border-pantri-primary px-4 py-2 rounded-xl transition">
                <Filter size={16} /> Filter
            </button>
            <button className="flex items-center gap-2 bg-white border border-pantri-bc/50 text-sage hover:text-pantri-primary hover:border-pantri-primary px-4 py-2 rounded-xl transition">
                <Download size={16} /> Export
            </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-pantri-bc/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-cream border-b border-pantri-bc/30">
              <tr>
                {columns.map((col, index) => (
                  <th key={index} className="px-6 py-4 text-xs font-bold text-sage uppercase tracking-wider">
                    {col}
                  </th>
                ))}
                <th className="px-6 py-4 text-right text-xs font-bold text-sage uppercase tracking-wider">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pantri-bc/20">
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-cream-darker transition-colors group">
                  {columns.map((col, colIndex) => {
                    const value = row[col.toLowerCase().replace(' ', '_')];
                    return (
                        <td key={colIndex} className="px-6 py-5 text-charcoal font-medium">
                        {value === 'Low Stock' || value === 'Critical' ? (
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wide">Low Stock</span>
                        ) : value === 'OK' || value === 'Good' ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide">Good</span>
                        ) : (
                            value
                        )}
                        </td>
                    );
                  })}
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-sage opacity-0 group-hover:opacity-100 hover:text-pantri-primary hover:bg-pantri-bc/20 rounded-lg transition">
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataTableView;