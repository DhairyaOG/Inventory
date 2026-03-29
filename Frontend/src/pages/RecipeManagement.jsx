import React, { useState, useEffect } from 'react';
import { 
  fetchRecipeData, 
  createRecipe, 
  updateRecipe, 
  deleteRecipe 
} from '../services/api';

const RecipeManagement = ({ inventoryData = [], onRecipeUpdate }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  
  // Form State
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Main');
  const [price, setPrice] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [targetMargin, setTargetMargin] = useState(60);

  // Calculated Values
  const [makingCost, setMakingCost] = useState(0);
  const [suggestedPrice, setSuggestedPrice] = useState(0);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    calculateCosts();
  }, [ingredients, targetMargin, inventoryData]);

  const calculateCosts = () => {
    let totalCost = 0;
    ingredients.forEach(ing => {
      const dbItem = inventoryData.find(i => i.name === ing.name);
      if (dbItem && ing.qty) {
        totalCost += (Number(ing.qty) * (dbItem.unit_price || 0));
      }
    });
    setMakingCost(totalCost);
    
    if (targetMargin >= 100) setTargetMargin(99);
    const marginDec = targetMargin / 100;
    const suggested = totalCost > 0 ? (totalCost / (1 - marginDec)) : 0;
    setSuggestedPrice(suggested);
  };

  const loadRecipes = async () => {
    setLoading(true);
    const data = await fetchRecipeData();
    setRecipes(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleEditClick = (recipe) => {
    setIsEditing(true);
    setCurrentRecipe(recipe);
    setItemName(recipe.item_name);
    setCategory(recipe.category);
    setPrice(recipe.price);
    setIngredients(recipe.ingredients || []);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      await deleteRecipe(id);
      loadRecipes();
      // ✅ FIX: Notify App.jsx to refresh its recipes state too
      if (onRecipeUpdate) onRecipeUpdate();
    }
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', qty: '' }]);
  };

  const handleRemoveIngredient = (index) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const recipeData = {
      item_name: itemName,
      category,
      price: Number(price),
      ingredients: ingredients.map(ing => ({ ...ing, qty: Number(ing.qty) }))
    };

    if (isEditing && currentRecipe) {
      await updateRecipe(currentRecipe._id, recipeData);
    } else {
      await createRecipe(recipeData);
    }

    resetForm();
    loadRecipes();
    // ✅ FIX: After saving, tell App.jsx to re-fetch recipes so MRP stays in sync
    if (onRecipeUpdate) onRecipeUpdate();
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentRecipe(null);
    setItemName('');
    setCategory('Main');
    setPrice('');
    setIngredients([]);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-pantri-primary">Recipe Management</h2>
          <p className="text-sage">Create and manage dishes and their ingredients.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pantri-bc/30">
            <h3 className="text-xl font-bold text-charcoal mb-4">
              {isEditing ? 'Edit Recipe' : 'Add New Recipe'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sage mb-1">Item Name</label>
                <input 
                  type="text" 
                  value={itemName} 
                  onChange={(e) => setItemName(e.target.value)} 
                  className="w-full p-2 border border-pantri-bc rounded-lg focus:outline-none focus:ring-2 focus:ring-pantri-primary/50"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-sage mb-1">Category</label>
                  <input 
                    type="text" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    className="w-full p-2 border border-pantri-bc rounded-lg focus:outline-none focus:ring-2 focus:ring-pantri-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sage mb-1">Target Margin (%)</label>
                  <input 
                    type="number" 
                    value={targetMargin} 
                    onChange={(e) => setTargetMargin(e.target.value)} 
                    className="w-full p-2 border border-pantri-bc rounded-lg focus:outline-none focus:ring-2 focus:ring-pantri-primary/50"
                    min="0" max="99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sage mb-1 flex justify-between">
                    Final Selling Price ($)
                    {suggestedPrice > 0 && (
                      <span className="text-pantri-primary text-xs font-bold cursor-pointer hover:underline" onClick={() => setPrice(suggestedPrice.toFixed(2))}>
                        Use Suggested: ${suggestedPrice.toFixed(2)}
                      </span>
                    )}
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    className="w-full p-2 border border-pantri-bc rounded-lg focus:outline-none focus:ring-2 focus:ring-pantri-primary/50"
                    required 
                  />
                </div>
              </div>

              {makingCost > 0 && (
                <div className="bg-pantri-bc/20 p-4 rounded-xl flex justify-between items-center text-sm border border-pantri-bc/50">
                  <div className="text-charcoal"><span className="text-sage">Total Making Cost:</span> <strong>${makingCost.toFixed(2)}</strong></div>
                  <div className="text-charcoal"><span className="text-sage">Projected Auto-Profit:</span> <strong>${(Number(price || 0) - makingCost).toFixed(2)}</strong>/unit</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-sage mb-2 flex justify-between items-center">
                  Ingredients
                  <button type="button" onClick={handleAddIngredient} className="text-xs bg-pantri-primary text-white px-2 py-1 rounded">
                    + Add
                  </button>
                </label>
                {ingredients.map((ing, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      placeholder="Name (e.g., Bun)" 
                      value={ing.name} 
                      onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                      className="w-full p-2 text-sm border border-pantri-bc rounded-lg focus:outline-none focus:ring-2 focus:ring-pantri-primary/50"
                      required
                    />
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="Qty" 
                      value={ing.qty} 
                      onChange={(e) => handleIngredientChange(index, 'qty', e.target.value)}
                      className="w-24 p-2 text-sm border border-pantri-bc rounded-lg focus:outline-none focus:ring-2 focus:ring-pantri-primary/50"
                      required
                    />
                    <button type="button" onClick={() => handleRemoveIngredient(index)} className="text-red-500 font-bold px-2">
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex gap-2">
                <button type="submit" className="flex-1 bg-charcoal text-white font-bold py-2 px-4 rounded-xl hover:bg-pantri-primary transition-colors">
                  {isEditing ? 'Update Dish' : 'Save Dish'}
                </button>
                {isEditing && (
                  <button type="button" onClick={resetForm} className="bg-sage/20 text-charcoal font-bold py-2 px-4 rounded-xl hover:bg-sage/30 transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-pantri-bc/30 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-pantri-bg/50 border-b border-pantri-bc">
                  <th className="p-4 text-xs font-bold text-sage uppercase tracking-wider">Dish</th>
                  <th className="p-4 text-xs font-bold text-sage uppercase tracking-wider">Category</th>
                  <th className="p-4 text-xs font-bold text-sage uppercase tracking-wider">Price</th>
                  <th className="p-4 text-xs font-bold text-sage uppercase tracking-wider">Ingredients</th>
                  <th className="p-4 text-xs font-bold text-sage uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="p-4 text-center text-sage">Loading recipes...</td></tr>
                ) : recipes.length === 0 ? (
                  <tr><td colSpan="5" className="p-4 text-center text-sage">No recipes found. Create one!</td></tr>
                ) : (
                  recipes.map(recipe => (
                    <tr key={recipe._id} className="border-b border-pantri-bc/50 hover:bg-pantri-bg/30 transition-colors">
                      <td className="p-4 font-bold text-charcoal">{recipe.item_name}</td>
                      <td className="p-4 text-sm text-sage">{recipe.category}</td>
                      <td className="p-4 text-sm text-charcoal font-medium">${recipe.price.toFixed(2)}</td>
                      <td className="p-4 text-sm text-sage text-xs">
                        {recipe.ingredients.map(i => `${i.qty}x ${i.name}`).join(', ')}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => handleEditClick(recipe)} className="text-pantri-primary hover:text-charcoal text-sm font-bold">Edit</button>
                        <button onClick={() => handleDeleteClick(recipe._id)} className="text-red-500 hover:text-red-700 text-sm font-bold">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeManagement;