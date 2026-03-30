import React, { useState } from 'react';
import logoFull from '../assets/pantri-logo-full.png';
import { login } from '../services/api';

const Login = ({ setIsLoggedIn, setUserRole }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(username, password);
      
      // Store token and user info in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Update parent state
      setIsLoggedIn(true);
      setUserRole(response.user.role);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-darker flex items-center justify-center p-4 bg-paper-texture">
      <div className="bg-cream p-10 rounded-3xl shadow-xl border border-pantri-bc/30 w-full max-w-md text-center">
        
        <div className="flex justify-center mb-8">
           <img 
             src={logoFull} 
             alt="Pantri" 
             className="h-16 object-contain"
             onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='block'}} 
           />
           <h1 className="hidden text-5xl font-bold text-pantri-primary tracking-tighter">Pantri.</h1>
        </div>

        <h2 className="text-2xl font-bold text-charcoal mb-2">Welcome back</h2>
        <p className="text-sage mb-8">Please enter your kitchen credentials.</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Username or Email" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-5 py-3 rounded-xl bg-white border border-pantri-bc/50 focus:border-pantri-primary focus:ring-2 focus:ring-pantri-primary/20 outline-none transition"
          />
          <input 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-5 py-3 rounded-xl bg-white border border-pantri-bc/50 focus:border-pantri-primary focus:ring-2 focus:ring-pantri-primary/20 outline-none transition"
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-pantri-primary hover:bg-pantri-dark text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Accessing...' : 'Access Kitchen'}
          </button>
        </form>

        <div className="mt-6 text-xs text-sage">
          <p>Manager: Full Access | Waiter: POS Only</p>
        </div>
      </div>
    </div>
  );
};

export default Login;