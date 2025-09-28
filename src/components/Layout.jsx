import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Layout({ children, onLogout }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="h-16 flex items-center justify-center font-bold text-xl text-blue-600 dark:text-blue-400">Canvoras</div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link to="/dashboard" className={`block px-4 py-2 rounded ${location.pathname === "/dashboard" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}>Dashboard</Link>
          <Link to="/sales" className={`block px-4 py-2 rounded ${location.pathname === "/sales" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}>Sales</Link>
          <Link to="/purchase" className={`block px-4 py-2 rounded ${location.pathname === "/purchase" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}>Purchases</Link>
          <Link to="/inventory" className={`block px-4 py-2 rounded ${location.pathname === "/inventory" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}>Inventory</Link>
          <Link to="/customers" className={`block px-4 py-2 rounded ${location.pathname === "/customers" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}>Customers</Link>
          <Link to="/ledger" className={`block px-4 py-2 rounded ${location.pathname === "/ledger" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}>Ledger</Link>
          <Link to="/analytics" className={`block px-4 py-2 rounded ${location.pathname === "/analytics" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}>Analytics</Link>
        </nav>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow flex items-center justify-between px-6 h-16">
          <div className="flex items-center">
            <button
              className="md:hidden p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 mr-3"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-bold text-lg text-gray-900 dark:text-white">Canvoras</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => document.documentElement.classList.toggle('dark')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Toggle dark mode"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 4.66l-.71-.71M4.05 4.05l-.71-.71" /></svg>
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Logout
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold text-gray-700 dark:text-gray-200">A</div>
          </div>
        </header>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <nav className="px-4 py-2 space-y-1">
              <Link 
                to="/dashboard" 
                className={`block px-4 py-2 rounded ${location.pathname === "/dashboard" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/sales" 
                className={`block px-4 py-2 rounded ${location.pathname === "/sales" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sales
              </Link>
              <Link 
                to="/purchase" 
                className={`block px-4 py-2 rounded ${location.pathname === "/purchase" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Purchases
              </Link>
              <Link 
                to="/inventory" 
                className={`block px-4 py-2 rounded ${location.pathname === "/inventory" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Inventory
              </Link>
              <Link 
                to="/customers" 
                className={`block px-4 py-2 rounded ${location.pathname === "/customers" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Customers
              </Link>
              <Link 
                to="/ledger" 
                className={`block px-4 py-2 rounded ${location.pathname === "/ledger" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Ledger
              </Link>
              <Link 
                to="/analytics" 
                className={`block px-4 py-2 rounded ${location.pathname === "/analytics" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Analytics
              </Link>
            </nav>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}