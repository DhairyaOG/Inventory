import axios from 'axios';
 
const API_URL = import.meta.env.VITE_API_URL 
const ML_API_URL = import.meta.env.VITE_ML_API_URL 
// INVENTORY
export const fetchInventoryData   = async () => { try { return (await axios.get(`${API_URL}/inventory`)).data; } catch { return []; } };
export const createInventoryItem  = async (d) => (await axios.post(`${API_URL}/inventory`, d)).data;
export const updateInventoryItem  = async (id, d) => (await axios.put(`${API_URL}/inventory/${id}`, d)).data;
export const deleteInventoryItem  = async (id) => (await axios.delete(`${API_URL}/inventory/${id}`)).data;
export const submitInventoryOrder = async (orders) => (await axios.post(`${API_URL}/inventory/order`, { orders })).data;

// RECIPES
export const fetchRecipeData = async () => { try { return (await axios.get(`${API_URL}/recipes`)).data; } catch { return []; } };
export const createRecipe    = async (d) => (await axios.post(`${API_URL}/recipes`, d)).data;
export const updateRecipe    = async (id, d) => (await axios.put(`${API_URL}/recipes/${id}`, d)).data;
export const deleteRecipe    = async (id) => (await axios.delete(`${API_URL}/recipes/${id}`)).data;

// SALES — ✅ Fixed: sends single object, backend now handles both
export const submitSalesData  = async (payload) => (await axios.post(`${API_URL}/sales`, payload)).data;
export const fetchSalesHistory = async () => { try { return (await axios.get(`${API_URL}/sales/history`)).data; } catch { return []; } };

// AI
export const fetchInventoryPrediction = async () => { try { return (await axios.get(`${API_URL}/predict-orders`)).data; } catch { return { shopping_list: [] }; } };
export const triggerTraining          = async () => (await axios.post('http://localhost:3900/train')).data;

// RAZORPAY
export const createPaymentOrder = async (amount) =>
  (await axios.post(`${API_URL}/payments/create-order`, { amount, currency: 'INR', receipt: `pos_${Date.now()}` })).data;

export const verifyPayment = async (paymentData, orderData) =>
  (await axios.post(`${API_URL}/payments/verify`, { ...paymentData, orderData })).data;

export const loadRazorpayScript = () => new Promise((resolve) => {
  if (document.getElementById('razorpay-script')) return resolve(true);
  const script = document.createElement('script');
  script.id = 'razorpay-script';
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});