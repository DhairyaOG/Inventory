import axios from 'axios';

// ⚠️ IMPORTANT: Ensure this matches your Node Backend URL
// If your Node server is running on port 5000, keep it as 5000.
const API_URL = 'http://localhost:5001/api';

// 1. Fetch Inventory & Lead Times
export const fetchInventoryData = async () => {
  try {
    const response = await axios.get(`${API_URL}/inventory`);
    return response.data;
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return []; // Return empty array on error to prevent app crash
  }
};

export const createInventoryItem = async (itemData) => {
  try {
    const response = await axios.post(`${API_URL}/inventory`, itemData);
    return response.data;
  } catch (error) {
    console.error("Error creating inventory item:", error);
    throw error;
  }
};

export const updateInventoryItem = async (id, itemData) => {
  try {
    const response = await axios.put(`${API_URL}/inventory/${id}`, itemData);
    return response.data;
  } catch (error) {
    console.error("Error updating inventory item:", error);
    throw error;
  }
};

export const deleteInventoryItem = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/inventory/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    throw error;
  }
};

// 2. Fetch Recipes (Menu)
export const fetchRecipeData = async () => {
  try {
    const response = await axios.get(`${API_URL}/recipes`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return [];
  }
};

export const createRecipe = async (recipeData) => {
  try {
    const response = await axios.post(`${API_URL}/recipes`, recipeData);
    return response.data;
  } catch (error) {
    console.error("Error creating recipe:", error);
    throw error;
  }
};

export const updateRecipe = async (id, recipeData) => {
  try {
    const response = await axios.put(`${API_URL}/recipes/${id}`, recipeData);
    return response.data;
  } catch (error) {
    console.error("Error updating recipe:", error);
    throw error;
  }
};

export const deleteRecipe = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/recipes/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw error;
  }
};

// 3. Submit Sales (Used in SalesEntry page)
export const submitSalesData = async (salesPayload) => {
  try {
    const response = await axios.post(`${API_URL}/sales`, salesPayload);
    return response.data;
  } catch (error) {
    console.error("Error submitting sales:", error);
    throw error;
  }
};

// 4. AI Prediction (The "Brain")
export const fetchInventoryPrediction = async () => {
  try {
    const response = await axios.get(`${API_URL}/predict-orders`);
    return response.data;
  } catch (error) {
    console.error("Error fetching AI prediction:", error);
    return { shopping_list: [] }; // Return safe default
  }
};

// 5. Trigger Training (Optional)
export const triggerTraining = async () => {
  try {
    const response = await axios.post('http://localhost:3900/train'); // Direct to Python for training
    return response.data;
  } catch (error) {
    console.error("Error triggering training:", error);
    throw error;
  }
};

export const submitInventoryOrder = async (orders) => {
  try {
    const response = await axios.post(`${API_URL}/inventory/order`, { orders });
    return response.data;
  } catch (error) {
    console.error("Error submitting inventory order:", error);
    throw error;
  }
};
// 6. Fetch Sales History (For Dashboard Chart)
export const fetchSalesHistory = async () => {
  try {
    const response = await axios.get(`${API_URL}/sales/history`);
    return response.data;
  } catch (error) {
    console.error("Error fetching sales history:", error);
    return [];
  }
};