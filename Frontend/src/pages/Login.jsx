import React from 'react';
import logoFull from '../assets/pantri-logo-full.png';

const Login = ({ setIsLoggedIn }) => {
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
        
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); }}>
          <input 
            type="email" 
            placeholder="kitchen@pantri.ai" 
            className="w-full px-5 py-3 rounded-xl bg-white border border-pantri-bc/50 focus:border-pantri-primary focus:ring-2 focus:ring-pantri-primary/20 outline-none transition"
          />
           <input 
            type="password" 
            placeholder="••••••••" 
            className="w-full px-5 py-3 rounded-xl bg-white border border-pantri-bc/50 focus:border-pantri-primary focus:ring-2 focus:ring-pantri-primary/20 outline-none transition"
          />
          <button 
            type="submit"
            className="w-full bg-pantri-primary hover:bg-pantri-dark text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 mt-2"
          >
            Access Kitchen
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;