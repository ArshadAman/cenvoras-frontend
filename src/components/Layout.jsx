import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  ChartBarIcon, 
  CurrencyRupeeIcon, 
  ShoppingBagIcon, 
  CubeIcon, 
  UsersIcon, 
  BookOpenIcon,
  UserIcon,
  BanknotesIcon,
  Bars3Icon,
  XMarkIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ReceiptPercentIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';
import { getUserRole } from "../utils/auth";

export default function Layout({ children, onLogout }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const role = getUserRole();

  const navigationGroups = [
    {
      title: "Overview",
      items: [
        { path: "/dashboard", label: "Dashboard", icon: ChartBarIcon, roles: [] }
      ]
    },
    {
      title: "Sales & Trade",
      items: [
        { path: "/sales", label: "Sales Invoices", icon: CurrencyRupeeIcon, roles: [] },
        { path: "/sales-orders", label: "Sales Orders", icon: ShoppingBagIcon, roles: [] },
        { path: "/credit-notes", label: "Credit Notes", icon: ArrowUturnLeftIcon, roles: [] },
        { path: "/customers", label: "Customers", icon: UsersIcon, roles: [] },
      ]
    },
    {
      title: "Purchasing",
      items: [
        { path: "/purchase", label: "Purchase Bills", icon: ShoppingBagIcon, roles: [] },
        { path: "/debit-notes", label: "Debit Notes", icon: ArrowUturnRightIcon, roles: [] },
      ]
    },
    {
      title: "Inventory & Logistics",
      items: [
        { path: "/inventory", label: "Inventory", icon: CubeIcon, roles: [] },
        { path: "/delivery-challans", label: "Delivery Challans", icon: CubeIcon, roles: [] },
        { path: "/boms", label: "Bill of Materials", icon: BeakerIcon, roles: [] },
        { path: "/stock-journals", label: "Stock Journals", icon: ClipboardDocumentListIcon, roles: [] },
        { path: "/warehouses", label: "Warehouses", icon: CubeIcon, roles: [] },
        { path: "/inventory/price-lists", label: "Price Lists", icon: BanknotesIcon, roles: [] },
      ]
    },
    {
      title: "Financials",
      items: [
        { path: "/payments", label: "Payments", icon: BanknotesIcon, roles: [] },
        { path: "/ledger", label: "Ledger", icon: BookOpenIcon, roles: [] },
        { path: "/bank-reconciliation", label: "Bank Reconciliation", icon: BuildingLibraryIcon, roles: [] },
        { path: "/reports", label: "Reports", icon: ChartBarIcon, roles: [] },
        { path: "/gst", label: "GST Compliance", icon: ReceiptPercentIcon, roles: [] },
      ]
    },
    {
      title: "System",
      items: [
        { path: "/integrations", label: "Integrations", icon: Cog6ToothIcon, roles: [] },
        { path: "/audit-logs", label: "Audit Logs", icon: DocumentTextIcon, roles: ['admin', 'manager'] },
      ]
    }
  ];


  // Filter structural groups by roles
  const filteredGroups = navigationGroups.map(group => {
    const validItems = group.items.filter(item => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.includes(role);
    });
    return { ...group, items: validItems };
  }).filter(group => group.items.length > 0); // Hide empty groups
  
  if (!role) console.log("Layout: No role found (User might be guest or token invalid)");


  return (
    <div className="flex min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
      {/* Background Texture Grid */}
      <div className="fixed inset-0 bg-grid z-0 pointer-events-none opacity-40"></div>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 glass-sidebar relative z-50 h-screen sticky top-0">
        
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <Link to="/" className="flex items-center">
            <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="h-10 w-auto object-contain" />
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-8 overflow-y-auto custom-scrollbar">
          {filteredGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {/* Category Header */}
              <h3 className="px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500/80 mb-3">
                {group.title}
              </h3>
              
              {/* Category Items */}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-white shadow-sm ring-1 ring-white/10' 
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white-[0.03]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        
        {/* Logout Area */}
        <div className="p-4 border-t border-white/5">
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full px-4 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-medium rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2"
            >
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
          
          <Link to="/" className="flex items-center">
            <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="h-10 w-auto object-contain" />
          </Link>
          
          <div className="w-10"></div> {/* Spacer */}
        </header>

        {/* Mobile Menu Overlay */}
        <div 
          className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${
            isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Sidebar */}
          <div 
            className={`absolute top-0 bottom-0 left-0 w-72 bg-[#111] border-r border-white/10 transform transition-transform duration-300 flex flex-col ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
              <span className="text-xl font-bold">Menu</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar">
              {filteredGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1">
                  <h3 className="px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500/80 mb-2">
                    {group.title}
                  </h3>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    
                    return (
                      <Link 
                        key={item.path}
                        to={item.path} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                           isActive 
                             ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-white ring-1 ring-white/10' 
                             : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
            
            <div className="p-4 border-t border-white/10">
               {onLogout && (
                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-red-500/10 text-red-400 font-medium rounded-xl text-sm"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto relative z-10">
           {children}
        </main>
      </div>
    </div>
  );
}