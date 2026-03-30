import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../services/api';
import logoFull from '../assets/pantri-logo-full.png';

const Layout = ({ children, setIsLoggedIn, userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Manager navigation items
  const managerNavItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/pos', label: 'POS', icon: '💳' },
    { path: '/inventory', label: 'Inventory', icon: '📦' },
    { path: '/recipes', label: 'Recipes', icon: '🍳' },
    { path: '/orders', label: 'Orders', icon: '🛒' },
    { path: '/sales-entry', label: 'Sales', icon: '💰' },
    { path: '/mrp', label: 'Pricing', icon: '💲' },
    { path: '/lead-times', label: 'Lead Times', icon: '⏱️' },
  ];

  // Waiter navigation items (POS only)
  const waiterNavItems = [
    { path: '/pos', label: 'Point of Sale', icon: '💳' },
  ];

  const navItems = userRole === 'manager' ? managerNavItems : waiterNavItems;

  return (
    <div className="min-h-screen bg-cream-darker flex">
      {/* Sidebar */}
      <aside className="w-64 bg-charcoal text-cream p-6 flex flex-col shadow-xl">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src={logoFull} 
            alt="Pantri" 
            className="h-12 object-contain mb-2"
            onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='block'}} 
          />
          <h1 className="hidden text-3xl font-bold text-pantri-primary">Pantri.</h1>
        </div>

        {/* User Info */}
        <div className="mb-6 pb-6 border-b border-cream/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pantri-primary flex items-center justify-center text-white font-bold">
              {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-semibold text-cream">{user.fullName || 'User'}</p>
              <p className="text-xs text-sage capitalize">
                {userRole === 'manager' ? '👑 Manager' : '👨‍🍳 Waiter'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-pantri-primary text-white shadow-md'
                  : 'text-cream/70 hover:bg-cream/10 hover:text-cream'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition-all duration-200"
        >
          <span>🚪</span>
          <span className="font-medium">Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-paper-texture">
        {children}
      </main>
    </div>
  );
};

export default Layout;