import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  ChartBarIcon, 
  CurrencyRupeeIcon, 
  ShoppingBagIcon, 
  CubeIcon, 
  UsersIcon, 
  BookOpenIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function Layout({ children, onLogout }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Add theme CSS
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      .glass-sidebar {
        background: rgba(26, 35, 65, 0.95);
        backdrop-filter: blur(20px);
        border-right: 1px solid rgba(127, 211, 247, 0.2);
        z-index: 50;
        position: relative;
      }
      
      .glass-nav-item {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
      }
      
      .glass-nav-item:hover {
        background: rgba(127, 211, 247, 0.1);
        border-color: rgba(127, 211, 247, 0.3);
        transform: translateX(5px);
      }
      
      .glass-nav-item.active {
        background: rgba(127, 211, 247, 0.2);
        border-color: rgba(127, 211, 247, 0.4);
        transform: translateX(8px);
      }
      
      .gradient-text {
        background: linear-gradient(-45deg, #7fd3f7, #b6e0f7, #eaf6fa, #7fd3f7);
        background-size: 400% 400%;
        animation: gradient-shift 6s ease infinite;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: ChartBarIcon },
    { path: "/sales", label: "Sales", icon: CurrencyRupeeIcon },
    { path: "/purchase", label: "Purchases", icon: ShoppingBagIcon },
    { path: "/inventory", label: "Inventory", icon: CubeIcon },
    { path: "/customers", label: "Customers", icon: UsersIcon },
    { path: "/ledger", label: "Ledger", icon: BookOpenIcon },
    { path: "/profile", label: "Profile", icon: UserIcon },
  ];

  return (
    <div className="flex min-h-screen" style={{background: 'linear-gradient(135deg, #1a2341 0%, #2d3561 50%, #1a2341 100%)'}}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 glass-sidebar relative z-50">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-[#7fd3f7]/10 to-[#b6e0f7]/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-16 h-16 bg-gradient-to-br from-[#b6e0f7]/15 to-[#eaf6fa]/15 rounded-full blur-lg"></div>
        </div>
        
        <div className="relative z-10 h-20 flex items-center justify-center border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#7fd3f7] to-[#1a2341] rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="gradient-text text-2xl font-extrabold tracking-tight">Cenvora</span>
          </div>
        </div>
        
        <nav className="flex-1 px-6 py-8 space-y-3 relative z-10">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`glass-nav-item flex items-center gap-4 px-4 py-3 rounded-2xl text-white font-medium ${
                  isActive ? 'active' : ''
                }`}
              >
                <Icon className="w-6 h-6 text-[#7fd3f7]" />
                <span className={isActive ? 'text-[#7fd3f7]' : 'text-white'}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Logout button at bottom */}
        <div className="px-6 pb-6 relative z-10">
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#ff6b6b] to-[#ffa8a8] text-white font-bold rounded-2xl hover:from-[#ff5252] hover:to-[#ff9999] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Logout
            </button>
          )}
        </div>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-20 bg-[#1a2341]/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 h-16">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors duration-300"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6 text-[#7fd3f7]" />
            ) : (
              <Bars3Icon className="w-6 h-6 text-[#7fd3f7]" />
            )}
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#7fd3f7] to-[#1a2341] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="gradient-text text-xl font-bold">Cenvora</span>
          </div>
          
          <div className="w-10"> {/* Spacer for centering */}</div>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <div className="glass-sidebar w-72 h-full relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-[#7fd3f7]/10 to-[#b6e0f7]/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-20 right-10 w-16 h-16 bg-gradient-to-br from-[#b6e0f7]/15 to-[#eaf6fa]/15 rounded-full blur-lg"></div>
              </div>
              
              <div className="relative z-10 h-20 flex items-center justify-center border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#7fd3f7] to-[#1a2341] rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">C</span>
                  </div>
                  <span className="gradient-text text-2xl font-extrabold tracking-tight">Cenvora</span>
                </div>
              </div>
              
              <nav className="flex-1 px-6 py-8 space-y-3 relative z-10">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link 
                      key={item.path}
                      to={item.path} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`glass-nav-item flex items-center gap-4 px-4 py-3 rounded-2xl text-white font-medium ${
                        isActive ? 'active' : ''
                      }`}
                    >
                      <Icon className="w-6 h-6 text-[#7fd3f7]" />
                      <span className={isActive ? 'text-[#7fd3f7]' : 'text-white'}>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              
              {/* Logout button at bottom */}
              <div className="px-6 pb-6 relative z-10">
                {onLogout && (
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#ff6b6b] to-[#ffa8a8] text-white font-bold rounded-2xl hover:from-[#ff5252] hover:to-[#ff9999] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}