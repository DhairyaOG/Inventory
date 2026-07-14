import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logoFull from '../assets/pantri-logo-full.png';
import { register, login } from '../services/api';

const Register = ({ setIsLoggedIn, setUserRole }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'manager' // Default role
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Register the user
      await register(formData);
      
      // 2. Automatically log them in after registration
      const loginResponse = await login(formData.username, formData.password);
      
      // Store token and user info in localStorage
      localStorage.setItem('token', loginResponse.token);
      localStorage.setItem('user', JSON.stringify(loginResponse.user));
      
      // Update parent state
      setIsLoggedIn(true);
      setUserRole(loginResponse.user.role);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-darker flex items-center justify-center p-4 bg-paper-texture">
      <div className="bg-cream p-10 rounded-3xl shadow-xl border border-pantri-bc/30 w-full max-w-md text-center">
        
        <div className="flex justify-center mb-6">
           <img 
             src={logoFull} 
             alt="Pantri" 
             className="h-16 object-contain"
             onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='block'}} 
           />
           <h1 className="hidden text-5xl font-bold text-pantri-primary tracking-tighter">Pantri.</h1>
        </div>

        <h2 className="text-2xl font-bold text-charcoal mb-2">Create an account</h2>
        <p className="text-sage mb-6">Join Pantri to manage your kitchen operations.</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input 
            type="text" 
            name="fullName"
            placeholder="Full Name" 
            value={formData.fullName}
            onChange={handleChange}
            required
            className="w-full px-5 py-3 rounded-xl bg-white border border-pantri-bc/50 focus:border-pantri-primary focus:ring-2 focus:ring-pantri-primary/20 outline-none transition"
          />
          <input 
            type="email" 
            name="email"
            placeholder="Email Address" 
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-5 py-3 rounded-xl bg-white border border-pantri-bc/50 focus:border-pantri-primary focus:ring-2 focus:ring-pantri-primary/20 outline-none transition"
          />
          <input 
            type="text" 
            name="username"
            placeholder="Username" 
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full px-5 py-3 rounded-xl bg-white border border-pantri-bc/50 focus:border-pantri-primary focus:ring-2 focus:ring-pantri-primary/20 outline-none transition"
          />
          <input 
            type="password" 
            name="password"
            placeholder="Password (min 6 characters)" 
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
            className="w-full px-5 py-3 rounded-xl bg-white border border-pantri-bc/50 focus:border-pantri-primary focus:ring-2 focus:ring-pantri-primary/20 outline-none transition"
          />
          
          <div className="text-left pt-2">
            <label className="block text-charcoal text-sm font-semibold mb-2">I am registering as a:</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="role" 
                  value="manager" 
                  checked={formData.role === 'manager'}
                  onChange={handleChange}
                  className="mr-2 text-pantri-primary focus:ring-pantri-primary"
                />
                <span className="text-sm text-sage">Manager</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="role" 
                  value="waiter" 
                  checked={formData.role === 'waiter'}
                  onChange={handleChange}
                  className="mr-2 text-pantri-primary focus:ring-pantri-primary"
                />
                <span className="text-sm text-sage">Waiter</span>
              </label>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-pantri-primary hover:bg-pantri-dark text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-pantri-bc/20">
          <p className="text-sm text-sage">
            Already have an account?{' '}
            <Link to="/login" className="text-pantri-primary font-bold hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
