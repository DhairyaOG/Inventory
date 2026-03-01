import React, { useState, useEffect } from 'react';
import { fetchInventoryData, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../services/api';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    const data = await fetchInventoryData();
    setInventory(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleEditClick = (item) => {
    setEditingId(item._id);
    setEditForm({ ...item });
    setIsAdding(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setIsAdding(false);
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        await createInventoryItem(editForm);
      } else {
        await updateInventoryItem(editingId, editForm);
      }
      await loadInventory();
      handleCancelEdit();
    } catch (err) {
      alert("Failed to save ingredient");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this ingredient? This may break recipes relying on it.")) {
      try {
        await deleteInventoryItem(id);
        await loadInventory();
      } catch (err) {
        alert("Failed to delete ingredient");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Parse numbers automatically for numeric fields
    const parsedValue = ['unit_price', 'lead_time', 'expiry_days', 'stock'].includes(name) 
      ? Number(value) 
      : value;
    setEditForm(prev => ({ ...prev, [name]: parsedValue }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-charcoal">Raw Material Inventory</h2>
          <p className="text-sage">Manage ingredients, unit pricing, lead times, and shelf life.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingId(null); setEditForm({ name: '', stock: 0, unit: 'units', unit_price: 0, lead_time: 1, expiry_days: 7 }); }}
          className="flex items-center gap-2 bg-charcoal text-white px-4 py-2 rounded-lg font-semibold hover:bg-black transition"
        >
          <Plus size={18} /> Add Material
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-pantri-bc/30 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sage animate-pulse">Loading inventory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream border-b border-pantri-bc/30 text-sage text-sm font-bold uppercase tracking-wider">
                  <th className="p-4">Material Name</th>
                  <th className="p-4">Stock Qty</th>
                  <th className="p-4">Unit Type</th>
                  <th className="p-4">Unit Price ($)</th>
                  <th className="p-4">Lead Time (Days)</th>
                  <th className="p-4">Shelf Life (Days)</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pantri-bc/20">
                {isAdding && (
                  <tr className="bg-green-50/50">
                    <td className="p-4">
                      <input type="text" name="name" value={editForm.name || ''} onChange={handleChange} className="w-full p-2 border border-pantri-bc/50 rounded" placeholder="e.g. Tomato" />
                    </td>
                    <td className="p-4">
                      <input type="number" name="stock" value={editForm.stock || 0} onChange={handleChange} className="w-20 p-2 border border-pantri-bc/50 rounded" min="0" />
                    </td>
                    <td className="p-4">
                      <input type="text" name="unit" value={editForm.unit || 'units'} onChange={handleChange} className="w-20 p-2 border border-pantri-bc/50 rounded" />
                    </td>
                    <td className="p-4">
                      <input type="number" name="unit_price" value={editForm.unit_price || 0} onChange={handleChange} className="w-24 p-2 border border-pantri-bc/50 rounded" step="0.01" min="0" />
                    </td>
                    <td className="p-4">
                      <input type="number" name="lead_time" value={editForm.lead_time || 1} onChange={handleChange} className="w-20 p-2 border border-pantri-bc/50 rounded" min="1" />
                    </td>
                    <td className="p-4">
                      <input type="number" name="expiry_days" value={editForm.expiry_days || 7} onChange={handleChange} className="w-20 p-2 border border-pantri-bc/50 rounded" min="1" />
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={handleSave} className="p-2 text-green-700 hover:bg-green-50 rounded-full transition"><Save size={18} /></button>
                        <button onClick={handleCancelEdit} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"><X size={18} /></button>
                      </div>
                    </td>
                  </tr>
                )}

                {inventory.map(item => (
                  <tr key={item._id} className="hover:bg-cream/30 transition-colors">
                    {editingId === item._id ? (
                      <>
                        <td className="p-4">
                          <input type="text" name="name" value={editForm.name} onChange={handleChange} className="w-full p-2 border border-pantri-bc/50 rounded" />
                        </td>
                        <td className="p-4">
                          <input type="number" name="stock" value={editForm.stock} onChange={handleChange} className="w-20 p-2 border border-pantri-bc/50 rounded" min="0" />
                        </td>
                        <td className="p-4">
                          <input type="text" name="unit" value={editForm.unit} onChange={handleChange} className="w-20 p-2 border border-pantri-bc/50 rounded" />
                        </td>
                        <td className="p-4">
                          <input type="number" name="unit_price" value={editForm.unit_price} onChange={handleChange} className="w-24 p-2 border border-pantri-bc/50 rounded" step="0.01" min="0" />
                        </td>
                        <td className="p-4">
                          <input type="number" name="lead_time" value={editForm.lead_time} onChange={handleChange} className="w-20 p-2 border border-pantri-bc/50 rounded" min="1" />
                        </td>
                        <td className="p-4">
                          <input type="number" name="expiry_days" value={editForm.expiry_days} onChange={handleChange} className="w-20 p-2 border border-pantri-bc/50 rounded" min="1" />
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2">
                            <button onClick={handleSave} className="p-2 text-green-700 hover:bg-green-50 rounded-full transition"><Save size={18} /></button>
                            <button onClick={handleCancelEdit} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"><X size={18} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 font-semibold text-charcoal">{item.name}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${item.stock < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {item.stock}
                          </span>
                        </td>
                        <td className="p-4 text-sage">{item.unit}</td>
                        <td className="p-4 font-medium text-charcoal">${Number(item.unit_price || 0).toFixed(2)}</td>
                        <td className="p-4 text-sage">{item.lead_time} day(s)</td>
                        <td className="p-4 text-sage">{item.expiry_days || 7} day(s)</td>
                        <td className="p-4">
                           <div className="flex justify-center gap-2">
                            <button onClick={() => handleEditClick(item)} className="p-2 text-sage hover:text-pantri-primary transition"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(item._id)} className="p-2 text-sage hover:text-red-500 transition"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                
                {inventory.length === 0 && !isAdding && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-sage">No raw materials found. Add some to build recipes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManagement;
