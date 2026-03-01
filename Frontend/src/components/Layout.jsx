import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Clock, 
  ChefHat, 
  Tag, 
  LogOut, 
  Bell 
} from 'lucide-react';
import logoFull from '../assets/pantri-logo-full.png';

const SidebarItem = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium mb-1 ${
        isActive 
          ? 'bg-pantri-primary text-white shadow-md' 
          : 'text-charcoal hover:bg-pantri-bc/20 hover:text-pantri-primary'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
};

const Layout = ({ children, setIsLoggedIn }) => {
  return (
    <div className="flex h-screen bg-cream-darker">
      {/* === SIDEBAR === */}
      <aside className="w-64 bg-cream border-r border-pantri-bc/30 flex flex-col shadow-sm z-10">
        
        {/* Logo Area */}
        <div className="p-8 flex justify-center mb-2">
           {/* If logo is missing, show text */}
           <img 
             src={logoFull} 
             alt="Pantri" 
             className="h-10 object-contain"
             onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='block'}} 
           />
           <h1 className="hidden text-3xl font-bold text-pantri-primary tracking-tight">Pantri.</h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 overflow-y-auto">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
          
          <div className="pt-6 pb-2 px-4 text-xs font-bold text-sage uppercase tracking-wider">Operations</div>
          <SidebarItem to="/sales-entry" icon={ShoppingCart} label="Punch Sales" />
          <SidebarItem to="/inventory" icon={Package} label="Current Inventory" />
          
          <div className="pt-6 pb-2 px-4 text-xs font-bold text-sage uppercase tracking-wider">Management</div>
          <SidebarItem to="/orders" icon={Package} label="Smart Orders" />
          <SidebarItem to="/recipes" icon={ChefHat} label="Recipe Book" />
          <SidebarItem to="/lead-times" icon={Clock} label="Lead Times" />
          <SidebarItem to="/mrp" icon={Tag} label="Product MRP" />
        </nav>

        {/* Logout Area */}
        <div className="p-4 border-t border-pantri-bc/30">
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-700/70 hover:bg-red-50 hover:text-red-700 transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* === MAIN CONTENT === */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-paper-texture">
        {/* Header */}
        <header className="h-20 bg-cream/80 backdrop-blur-md border-b border-pantri-bc/30 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-xl font-bold text-pantri-primary">
            Kitchen Overview
          </h2>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-sage hover:text-pantri-primary hover:bg-pantri-bc/20 rounded-full transition">
                <Bell size={20} />
            </button>
            <div className="h-10 w-10 rounded-full bg-sage/20 border-2 border-sage text-sage flex items-center justify-center font-bold">
              K
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
          
          <footer className="mt-12 py-6 text-center text-xs text-sage/80 border-t border-pantri-bc/20">
              © 2026 Pantri Systems. Sustainable Inventory Management.
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout;