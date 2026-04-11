import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '../api/users';
import { getSubscriptionEntitlements } from '../api/subscription';
import UpgradePromptModal from './subscription/UpgradePromptModal';
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
  BuildingLibraryIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { getUserRole } from "../utils/auth";

export default function Layout({ children, onLogout }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState({ open: false, featureName: '', description: '', targetPlanName: 'Pro' });

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
        { path: "/warranty", label: "Warranty", icon: ShieldCheckIcon, roles: [] },
        { path: "/customers", label: "Customers", icon: UsersIcon, roles: [] },
        { path: "/vendors", label: "Vendors", icon: UsersIcon, roles: [] },
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
        { path: "/batches", label: "Batches", icon: CubeIcon, roles: [] },
        { path: "/stock-journals", label: "Stock Journals", icon: ClipboardDocumentListIcon, roles: [] },
        { path: "/warehouses", label: "Warehouses", icon: CubeIcon, roles: [], featureKey: 'warehouse', upgradePlan: 'Business', upgradeText: 'Warehouses are available on the Business plan.' },
      ]
    },
    {
      title: "Financials",
      items: [
        { path: "/payments", label: "Payments", icon: BanknotesIcon, roles: [] },
        { path: "/ledger", label: "Ledger", icon: BookOpenIcon, roles: [] },
        { path: "/reports", label: "Reports", icon: ChartBarIcon, roles: [] },
        { path: "/gst", label: "GST Compliance", icon: ReceiptPercentIcon, roles: [] },
      ]
    },
    {
      title: "System",
      items: [
        { path: "/profile", label: "Profile", icon: UserIcon, roles: [] },
        { path: "/settings/team", label: "Team Settings", icon: UsersIcon, roles: ['admin'] },
        { path: "/integrations", label: "Business Tools", icon: Cog6ToothIcon, roles: [], featureKey: 'integrations', upgradePlan: 'Pro', upgradeText: 'Business tools and integrations unlock on Pro.' },
        { path: "/audit-logs", label: "Audit Logs", icon: DocumentTextIcon, roles: ['admin', 'manager'] },
      ]
    }
  ];

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: getUserProfile,
    enabled: !!role // Only fetch if authenticated
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription-entitlements'],
    queryFn: getSubscriptionEntitlements,
    enabled: !!role,
    staleTime: 60_000,
  });
  
  const permissions = profileData?.profile?.permissions || {};
  const entitlements = subscriptionData?.data || {};
  const can = entitlements.can || {};
  const currentPlanCode = (entitlements.plan?.code || profileData?.profile?.plan_code || 'free').toLowerCase();
  const isFreePlan = currentPlanCode === 'free' || currentPlanCode === 'starter';

  const isAllowedFreeRoute = (path) => {
    return path.startsWith('/sales') || path.startsWith('/customers') || path.startsWith('/profile');
  };

  // Filter structural groups by roles AND granular permissions
  const filteredGroups = navigationGroups.map(group => {
    const validItems = group.items.filter(item => {
      // 0. Free plan hard gate: only Sales Invoices, Customers, and Profile routes are accessible.
      if (isFreePlan && !isAllowedFreeRoute(item.path)) {
        return false;
      }

      // 1. Role Check
      if (item.roles && item.roles.length > 0 && !item.roles.includes(role)) {
        return false;
      }
      
      // 2. Granular Permission Check (if manager)
      if (role === 'manager') {
        if (group.title === "Sales & Trade" && permissions.sales === 'none') return false;
        if (group.title === "Purchasing" && permissions.purchases === 'none') return false;
        if (group.title === "Inventory & Logistics" && permissions.inventory === 'none') return false;
        if (group.title === "Financials" && permissions.financials === 'none') return false;
      }
      
      return true;
    });
    return { ...group, items: validItems };
  }).filter(group => group.items.length > 0); // Hide empty groups
  
  if (!role) console.log("Layout: No role found (User might be guest or token invalid)");


  return (
    <div className="flex min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
      {/* Background Texture Grid */}
      <div className="fixed inset-0 bg-grid z-0 pointer-events-none opacity-40"></div>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 glass-sidebar z-50 h-screen sticky top-0">
        
        {/* Logo Area */}
        <div className="h-24 flex items-center px-6 border-b border-white/5">
          <Link to="/" className="flex items-center">
            <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="w-[180px] h-auto object-contain transform origin-left" />
          </Link>
        </div>
        
        {/* Navigation — scrollable middle section */}
        <nav className="flex-1 min-h-0 px-4 py-8 space-y-8 overflow-y-auto custom-scrollbar">
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
                const isLocked = item.featureKey && can[item.featureKey] === false;

                const baseClass = `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'
                }`;
                
                if (isLocked) {
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => setUpgradeModal({
                        open: true,
                        featureName: item.label,
                        description: item.upgradeText || `${item.label} is not available on your current plan.`,
                        targetPlanName: item.upgradePlan || 'Pro',
                      })}
                      className={`${baseClass} w-full text-left`}
                    >
                      <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                      <span className="text-sm flex-1">{item.label}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">Locked</span>
                    </button>
                  );
                }

                return (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    className={baseClass}
                  >
                    <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        
        {/* Bottom section — always visible, never scrolls away */}
        <div className="flex-shrink-0 px-4 pt-2 pb-4 border-t border-white/5 space-y-2">
          {/* Coming Soon Button */}
          <Link
            to="/coming-soon"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 w-full ${
              location.pathname === '/coming-soon'
                ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-white shadow-sm ring-1 ring-white/10'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'
            }`}
          >
            <BeakerIcon className={`w-5 h-5 transition-colors duration-200 ${
              location.pathname === '/coming-soon' ? 'text-purple-400' : 'text-gray-500'
            }`} />
            <span className="text-sm flex-1">Coming Soon</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">New</span>
          </Link>

          {/* Sign Out */}
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
            <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="w-[140px] h-auto object-contain" />
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
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
              <img src="/cenvora-logo-backgrond-removed.png" alt="Cenvora Logo" className="w-[140px] h-auto object-contain" />
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="flex-1 min-h-0 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar">
              {filteredGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1">
                  <h3 className="px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500/80 mb-2">
                    {group.title}
                  </h3>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    const isLocked = item.featureKey && can[item.featureKey] === false;
                    const baseClass = `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-white ring-1 ring-white/10'
                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }`;
                    
                    if (isLocked) {
                      return (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => setUpgradeModal({
                            open: true,
                            featureName: item.label,
                            description: item.upgradeText || `${item.label} is not available on your current plan.`,
                            targetPlanName: item.upgradePlan || 'Pro',
                          })}
                          className={`${baseClass} w-full text-left`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                          <span className="text-sm flex-1">{item.label}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">Locked</span>
                        </button>
                      );
                    }

                    return (
                      <Link 
                        key={item.path}
                        to={item.path} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={baseClass}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Bottom section — always pinned */}
            <div className="flex-shrink-0 px-4 pt-2 pb-4 border-t border-white/10 space-y-2">
              <Link
                to="/coming-soon"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 w-full ${
                  location.pathname === '/coming-soon'
                    ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-white ring-1 ring-white/10'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <BeakerIcon className={`w-5 h-5 ${location.pathname === '/coming-soon' ? 'text-purple-400' : 'text-gray-500'}`} />
                <span className="text-sm flex-1">Coming Soon</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">New</span>
              </Link>
              {onLogout && (
                <button
                  onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
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
          {isFreePlan && !isAllowedFreeRoute(location.pathname) ? (
            <div className="p-6 md:p-10">
              <div className="max-w-2xl rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
                <h2 className="text-2xl font-bold text-white mb-2">This section is locked on Free</h2>
                <p className="text-sm text-gray-300 mb-4">
                  Your Free plan can access only Sales Invoices, Customers, and Profile. Upgrade to unlock dashboard, inventory, reports, integrations, and advanced features.
                </p>
                <div className="flex gap-3">
                  <Link
                    to="/sales"
                    className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm font-medium"
                  >
                    Go to Sales Invoices
                  </Link>
                  <button
                    type="button"
                    onClick={() => setUpgradeModal({
                      open: true,
                      featureName: 'Premium Modules',
                      description: 'Upgrade to Pro or Business to unlock dashboard, reports, integrations, and advanced operations.',
                      targetPlanName: 'Pro',
                    })}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 transition-all text-sm font-semibold"
                  >
                    Upgrade Plan
                  </button>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      <UpgradePromptModal
        isOpen={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, featureName: '', description: '', targetPlanName: 'Pro' })}
        title="Upgrade required"
        featureName={upgradeModal.featureName}
        targetPlanName={upgradeModal.targetPlanName}
        description={upgradeModal.description}
      />
    </div>
  );
}