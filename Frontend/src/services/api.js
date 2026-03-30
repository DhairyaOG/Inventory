import axios from 'axios';
 
const API_URL = import.meta.env.VITE_API_URL 
const ML_API_URL = import.meta.env.VITE_ML_API_URL 

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_URL
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (invalid/expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token invalid/expired - logout user
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH ENDPOINTS
// ============================================================

export const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, { username, password });
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get('/auth/users');
  return response.data;
};

export const updateUser = async (userId, userData) => {
  const response = await api.put(`/auth/users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/auth/users/${userId}`);
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post('/auth/change-password', {
    currentPassword,
    newPassword
  });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const getUserRole = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role || null;
};

// ============================================================
// INVENTORY
// ============================================================

export const fetchInventoryData = async () => { 
  try { 
    return (await api.get('/inventory')).data; 
  } catch { 
    return []; 
  } 
};

export const createInventoryItem = async (d) => (await api.post('/inventory', d)).data;
export const updateInventoryItem = async (id, d) => (await api.put(`/inventory/${id}`, d)).data;
export const deleteInventoryItem = async (id) => (await api.delete(`/inventory/${id}`)).data;
export const submitInventoryOrder = async (orders) => (await api.post('/inventory/order', { orders })).data;

// ============================================================
// RECIPES
// ============================================================

export const fetchRecipeData = async () => { 
  try { 
    return (await api.get('/recipes')).data; 
  } catch { 
    return []; 
  } 
};

export const createRecipe = async (d) => (await api.post('/recipes', d)).data;
export const updateRecipe = async (id, d) => (await api.put(`/recipes/${id}`, d)).data;
export const deleteRecipe = async (id) => (await api.delete(`/recipes/${id}`)).data;

// ============================================================
// SALES
// ============================================================

export const submitSalesData = async (payload) => (await api.post('/sales', payload)).data;
export const fetchSalesHistory = async () => { 
  try { 
    return (await api.get('/sales/history')).data; 
  } catch { 
    return []; 
  } 
};

// ============================================================
// AI PREDICTIONS
// ============================================================

export const fetchInventoryPrediction = async () => { 
  try { 
    return (await api.get('/predict-orders')).data; 
  } catch (err) { 
    console.error('Prediction error:', err);
    return { shopping_list: [] }; 
  } 
};

export const triggerTraining = async (apiKey) => {
  try {
    return (await axios.post(`${ML_API_URL}/train`, {}, {
      headers: { 'X-API-Key': apiKey }
    })).data;
  } catch (err) {
    console.error('Training error:', err);
    throw err;
  }
};

// ============================================================
// RAZORPAY
// ============================================================

export const createPaymentOrder = async (amount) =>
  (await api.post('/payments/create-order', { 
    amount, 
    currency: 'INR', 
    receipt: `pos_${Date.now()}` 
  })).data;

export const verifyPayment = async (paymentData, orderData) =>
  (await api.post('/payments/verify', { ...paymentData, orderData })).data;

export const loadRazorpayScript = () => new Promise((resolve) => {
  if (document.getElementById('razorpay-script')) return resolve(true);
  const script = document.createElement('script');
  script.id = 'razorpay-script';
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});