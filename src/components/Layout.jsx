import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Layout({ children, onLogout }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="h-16 flex items-center justify-center font-bold text-xl text-blue-600 dark:text-blue-400">ERP</div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link to="/dashboard" className={`block px-4 py-2 rounded ${location.pathname === "/dashboard" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}>Dashboard</Link>
          <a href="#" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Sales</a>
          <Link to="/purchase" className={`block px-4 py-2 rounded ${location.pathname === "/purchase" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}>Purchases</Link>
          <a href="#" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Inventory</a>
          <a href="#" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Clients</a>
          <a href="#" className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Analytics</a>
        </nav>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow flex items-center justify-between px-6 h-16">
          <span className="font-bold text-lg text-gray-900 dark:text-white">ERP System</span>
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
        {/* Page Content */}
        <main className="flex-1 p-6 space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}