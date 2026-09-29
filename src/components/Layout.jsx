import React, { useState, useEffect } from "react";
import ErrorBoundary from './ErrorBoundary'
import { Link, useLocation } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '../api/users';
import { getSubscriptionEntitlements } from '../api/subscription';
import UpgradePromptModal from './subscription/UpgradePromptModal';
import { getCountryCode } from '../utils/currency';
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
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ClockIcon,
  CalendarDaysIcon,
  FolderIcon,
  AdjustmentsHorizontalIcon,
  GiftIcon,
  TruckIcon,
  ChevronDownIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { getUserRole } from "../utils/auth";
import OnboardingWizard from './OnboardingWizard';

export default function Layout({ children, onLogout }) {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [collapsedSections, setCollapsedSections] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed_sections");
      const parsed = saved ? JSON.parse(saved) : {};
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch {
      return {};
    }
  });

  const toggleSection = (title) => {
    setCollapsedSections((prev) => {
      const safePrev = (prev && typeof prev === 'object') ? prev : {};
      const updated = { ...safePrev, [title]: !safePrev[title] };
      try {
        localStorage.setItem("sidebar_collapsed_sections", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };
  const handleSignOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      localStorage.removeItem('role');
      localStorage.removeItem('activeSession');
      window.location.href = '/';
    }
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState({
    open: false,
    title: 'Upgrade required',
    featureName: '',
    description: '',
    targetPlanName: 'Pro',
    targetPlanCode: 'pro',
    ctaLabel: '',
    subtitle: '',
  });

  const role = getUserRole();
  const country = getCountryCode();

  // Intercept browser back button to close the mobile drawer menu instead of navigating back in browser history
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const stateObj = { mobileMenuOpen: true };
    window.history.pushState(stateObj, '');

    const handlePopState = () => {
      setIsMobileMenuOpen(false);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state && window.history.state.mobileMenuOpen) {
        window.history.back();
      }
    };
  }, [isMobileMenuOpen]);

  // Intercept browser back button to close the upgrade modal instead of navigating back in browser history
  useEffect(() => {
    if (!upgradeModal.open) return;

    const stateObj = { upgradeModalOpen: true };
    window.history.pushState(stateObj, '');

    const handlePopState = () => {
      setUpgradeModal(prev => ({ ...prev, open: false }));
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state && window.history.state.upgradeModalOpen) {
        window.history.back();
      }
    };
  }, [upgradeModal.open]);

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
        { path: "/quotations", label: "Quotations", icon: DocumentTextIcon, roles: [], upgradePlan: 'Pro', upgradeText: 'Quotations are available on Pro and above.' },
        { path: "/sales-orders", label: "Sales Orders", icon: ShoppingBagIcon, roles: [] },
        { path: "/delivery-challans", label: "Delivery Challans", icon: TruckIcon, roles: [] },
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
        { path: "/purchase-orders", label: "Purchase Orders", icon: BuildingLibraryIcon, roles: [] },
        { path: "/debit-notes", label: "Debit Notes", icon: ArrowUturnRightIcon, roles: [] },
      ]
    },
    {
      title: "Inventory & Logistics",
      items: [
        { path: "/inventory", label: "Inventory", icon: CubeIcon, roles: [] },
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
        { path: "/gst", label: country === 'IN' ? "GST Dashboard" : "Tax & VAT", icon: ReceiptPercentIcon, roles: [] },
        { path: "/gst-hsn-guide", label: country === 'IN' ? "HSN & GST Guide" : "Tax Codes Guide", icon: BookOpenIcon, roles: [] },
      ]
    },
    {
      title: "HRMS",
      items: [
        { path: "/hr/dashboard", label: "Dashboard", icon: ChartBarIcon, roles: [] },
        { path: "/hr/employees", label: "Employees", icon: UsersIcon, roles: [] },
        { path: "/hr/payroll", label: "Payroll", icon: CurrencyRupeeIcon, roles: [] },
        { path: "/hr/attendance", label: "Attendance", icon: ClockIcon, roles: [] },
        { path: "/hr/leave-applications", label: "Leave", icon: CalendarDaysIcon, roles: [] },
        { path: "/hr/allowances-bonuses", label: "Allowances & Bonus", icon: GiftIcon, roles: [] },
        { path: "/hr/documents", label: "Documents", icon: FolderIcon, roles: [] },
        { path: "/hr/reports", label: "Reports", icon: BookOpenIcon, roles: [] },
        { path: "/hr/settings", label: "Settings", icon: AdjustmentsHorizontalIcon, roles: [] }
      ]
    },
    {
      title: "Employee Portal",
      items: [
        { path: "/employee/portal", label: "My Portal", icon: UserIcon, roles: ['employee'] }
      ]
    },
    {
      title: "System",
      items: [
        { path: "/profile", label: "Profile", icon: UserIcon, roles: [] },
        { path: "/settings/team", label: "Team Settings", icon: UsersIcon, roles: ['admin'] },
        { path: "/integrations", label: "Business Tools", icon: Cog6ToothIcon, roles: ['admin', 'manager'], featureKey: 'integrations', upgradePlan: 'Pro', upgradeText: 'Business tools and integrations unlock on Pro.' },
        { path: "/audit-logs", label: "Audit Logs", icon: DocumentTextIcon, roles: ['admin', 'manager'] },
      ]
    }
  ];

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: getUserProfile,
    enabled: !!role // Only fetch if authenticated
  });

  const isProfileIncomplete = profileData?.profile && !profileData.profile.profile_completed && role === 'admin';

  useEffect(() => {
    if (isProfileIncomplete) {
      const skipped = localStorage.getItem('onboarding_skipped');
      if (!skipped) {
        setShowOnboarding(true);
      }
    } else {
      setShowOnboarding(false);
    }
  }, [isProfileIncomplete]);

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription-entitlements'],
    queryFn: getSubscriptionEntitlements,
    enabled: !!role,
    staleTime: 60_000,
  });
  
  const permissions = profileData?.profile?.permissions || {};
  const entitlements = subscriptionData?.data || {};
  const can = entitlements.can || {};
  const currentPlanName = entitlements.plan?.name || profileData?.profile?.plan_name || 'Starter';
  const currentPlanCode = (entitlements.plan?.code || profileData?.profile?.plan_code || 'free').toLowerCase();
  const isVipAccess = String(currentPlanName).toLowerCase().includes('vip');
  const isFreePlan = currentPlanCode === 'free' || currentPlanCode === 'starter';
  const pendingPlanStartsAt = entitlements.plan?.pending_plan_starts_at;
  const nextPlanCode = (entitlements.plan?.pending_plan_code || entitlements.plan?.next_plan_code || '').toLowerCase();
  const currentPeriodEnd = entitlements.plan?.current_period_end;

  const resolvePlanCode = (planNameOrCode) => {
    const value = String(planNameOrCode || '').toLowerCase();
    if (value === 'business') return 'business';
    if (value === 'pro') return 'pro';
    return 'pro';
  };

  const expiryDate = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
  const hasValidExpiryDate = expiryDate && !Number.isNaN(expiryDate.getTime());
  const msInDay = 24 * 60 * 60 * 1000;
  const daysRemaining = hasValidExpiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / msInDay) : null;
  const showExpiringBanner = !isVipAccess && !isFreePlan && Number.isFinite(daysRemaining) && daysRemaining >= 0 && daysRemaining <= 5;
  const showExpiredBanner = !isVipAccess && !isFreePlan && Number.isFinite(daysRemaining) && daysRemaining < 0;
  const queuedDate = pendingPlanStartsAt ? new Date(pendingPlanStartsAt) : null;
  const hasQueuedDate = queuedDate && !Number.isNaN(queuedDate.getTime());
  const showQueuedBanner = !isVipAccess && ['free', 'starter'].includes(nextPlanCode) && hasQueuedDate;

  const isAllowedFreeRoute = (path) => {
    const route = (path || '').toLowerCase();

    // Free plan access policy:
    // - Allow Sales Invoices only (quotations and sales orders are locked)
    // - Allow Customers
    // - Allow Profile
    // - Allow Payments
    if (route.startsWith('/sales-orders')) return false;
    if (route === '/sales' || route.startsWith('/sales/')) return true;
    if (route.startsWith('/customers')) return true;
    if (route.startsWith('/profile')) return true;
    if (route.startsWith('/payments')) return true;
    return false;
  };

  const getManagerModulePermission = (groupTitle) => {
    if (groupTitle === 'Sales & Trade') return permissions.sales;
    if (groupTitle === 'Purchasing') return permissions.purchases;
    if (groupTitle === 'Inventory & Logistics') return permissions.inventory;
    if (groupTitle === 'Financials') return permissions.financials;
    // Default to 'none' (denied) when permission is unspecified for managers
    return 'none';
  };

  const getSidebarLockState = (groupTitle, itemPath, itemFeatureKey) => {
    const isManagerDenied = role === 'manager' && getManagerModulePermission(groupTitle) === 'none';
    const isPlanLocked = (isFreePlan && !isAllowedFreeRoute(itemPath)) || (itemFeatureKey && can[itemFeatureKey] === false);

    return {
      isLocked: isManagerDenied || isPlanLocked,
      lockLabel: isManagerDenied ? 'Access denied' : 'Locked',
      lockDescription: isManagerDenied
        ? 'You do not have permission to access this section.'
        : 'This feature is locked on your current plan.',
    };
  };

  // Filter structural groups by roles only; manager module permissions are shown as locked items.
  const filteredGroups = navigationGroups.map(group => {
    // Strict role-based isolation
    if (role === 'hr' && group.title !== 'HR & Payroll' && group.title !== 'System') return null;
    if (role === 'employee' && group.title !== 'Employee Portal' && group.title !== 'System') return null;
    if (role !== 'employee' && group.title === 'Employee Portal') return null;

    const validItems = group.items.filter(item => {
      // 1. Role Check
      if (item.roles && item.roles.length > 0 && !item.roles.includes(role)) {
        return false;
      }
      
      return true;
    });
    return { ...group, items: validItems };
  }).filter(group => group !== null && group.items.length > 0); // Hide empty groups
  
  if (!role) console.log("Layout: No role found (User might be guest or token invalid)");


  return (
    <div className="flex min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
      {/* Background Texture Grid */}
      <div className="fixed inset-0 bg-grid z-0 pointer-events-none opacity-40"></div>

      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col glass-sidebar z-50 h-screen sticky top-0 transition-[width] duration-300 ease-in-out select-none overflow-x-hidden ${
        isSidebarCollapsed ? 'w-20' : 'w-72'
      }`}>
        
        {/* Logo & Collapse Header Area */}
        <div className={`h-20 flex items-center border-b border-white/5 transition-all duration-300 shrink-0 ${
          isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-5'
        }`}>
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between w-full gap-2 overflow-hidden">
              <Link to="/" className="flex items-center min-w-0" title="Cenvora Home">
                <img 
                  src="/cenvora-logo-backgrond-removed.png" 
                  alt="Cenvora Logo" 
                  className="w-[145px] h-auto object-contain transform origin-left transition-transform duration-300" 
                />
              </Link>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border truncate max-w-[85px] ${
                    isVipAccess
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      : 'bg-white/10 text-gray-300 border-white/10'
                  }`}
                  title={isVipAccess ? 'This account has VIP lifetime access' : `Current plan: ${currentPlanName}`}
                >
                  {isVipAccess ? 'VIP' : currentPlanName}
                </span>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Collapse sidebar (Ctrl+B)"
                  aria-label="Collapse sidebar"
                >
                  <ChevronDoubleLeftIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 w-full py-1">
              <Link to="/" className="flex items-center justify-center hover:opacity-80 transition-opacity" title="Cenvora Home">
                <img 
                  src="/pwa-192x192.png" 
                  alt="Cenvora" 
                  className="w-8 h-8 rounded-lg object-contain shadow-sm border border-white/10" 
                />
              </Link>
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                title="Expand sidebar (Ctrl+B)"
                aria-label="Expand sidebar"
              >
                <ChevronDoubleRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        
        {/* Navigation — scrollable middle section */}
        <nav className={`flex-1 min-h-0 py-4 space-y-4 overflow-y-auto custom-scrollbar transition-all duration-300 ${
          isSidebarCollapsed ? 'px-2' : 'px-3.5'
        }`}>
          {filteredGroups.map((group, groupIdx) => {
            const hasActiveItem = group.items.some((item) => location.pathname === item.path);
            const isCollapsed = !hasActiveItem && Boolean(collapsedSections?.[group.title]);

            return (
              <div key={groupIdx} className="space-y-1">
                {/* Category Header or Divider */}
                {!isSidebarCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(group.title)}
                    className="w-full flex items-center justify-between px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500/90 hover:text-gray-200 transition-colors group mb-1 cursor-pointer select-none"
                    title={isCollapsed ? `Expand ${group.title}` : `Collapse ${group.title}`}
                  >
                    <span className="truncate">{group.title}</span>
                    <ChevronDownIcon
                      className={`w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-transform duration-200 shrink-0 ${
                        isCollapsed ? "-rotate-90" : "rotate-0"
                      }`}
                    />
                  </button>
                ) : (
                  groupIdx > 0 && <div className="border-t border-white/5 my-2 mx-1" />
                )}
                
                {/* Category Items with Smooth Accordion Transition */}
                <div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
                  isCollapsed && !isSidebarCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
                }`}>
                  <div className="overflow-hidden space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      const { isLocked, lockLabel, lockDescription } = getSidebarLockState(group.title, item.path, item.featureKey);

                      if (isSidebarCollapsed) {
                        // Collapsed Rail Item with Floating Tooltip
                        if (isLocked) {
                          return (
                            <button
                              key={item.path}
                              type="button"
                              disabled
                              aria-disabled="true"
                              title={lockDescription}
                              onClick={() => setUpgradeModal({
                                open: true,
                                title: 'Upgrade required',
                                featureName: item.label,
                                description: item.upgradeText || lockDescription,
                                targetPlanName: item.upgradePlan || 'Pro',
                                targetPlanCode: resolvePlanCode(item.upgradePlan),
                                ctaLabel: '',
                                subtitle: '',
                              })}
                              className="relative group/nav flex items-center justify-center w-full p-2.5 rounded-xl font-medium transition-all duration-200 opacity-60 cursor-not-allowed text-gray-500 hover:bg-white/[0.02]"
                            >
                              <Icon className="w-5 h-5 shrink-0 text-gray-500" />
                              <div className="fixed left-[76px] px-3 py-1.5 bg-[#141416] text-white text-xs font-medium rounded-lg shadow-2xl border border-white/10 opacity-0 group-hover/nav:opacity-100 translate-x-1 group-hover/nav:translate-x-0 pointer-events-none transition-all duration-150 z-[100] whitespace-nowrap flex items-center gap-2">
                                <span>{item.label}</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">{lockLabel}</span>
                              </div>
                            </button>
                          );
                        }

                        return (
                          <Link 
                            key={item.path}
                            to={item.path} 
                            className={`relative group/nav flex items-center justify-center w-full p-2.5 rounded-xl font-medium transition-all duration-200 ${
                              isActive
                                ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-300 ring-1 ring-white/20'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
                            }`}
                            title={item.label}
                          >
                            <Icon className={`w-5 h-5 shrink-0 transition-colors duration-200 ${isActive ? 'text-purple-400' : 'text-gray-500 group-hover/nav:text-gray-200'}`} />
                            <div className="fixed left-[76px] px-3 py-1.5 bg-[#141416] text-white text-xs font-medium rounded-lg shadow-2xl border border-white/10 opacity-0 group-hover/nav:opacity-100 translate-x-1 group-hover/nav:translate-x-0 pointer-events-none transition-all duration-150 z-[100] whitespace-nowrap flex items-center gap-2">
                              <span>{item.label}</span>
                            </div>
                          </Link>
                        );
                      }

                      // Expanded Sidebar Item
                      const baseClass = `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-white shadow-sm ring-1 ring-white/10'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'
                      }`;
                      
                      if (isLocked) {
                        return (
                          <button
                            key={item.path}
                            type="button"
                            disabled
                            aria-disabled="true"
                            title={lockDescription}
                            onClick={() => setUpgradeModal({
                              open: true,
                              title: 'Upgrade required',
                              featureName: item.label,
                              description: item.upgradeText || lockDescription,
                              targetPlanName: item.upgradePlan || 'Pro',
                              targetPlanCode: resolvePlanCode(item.upgradePlan),
                              ctaLabel: '',
                              subtitle: '',
                            })}
                            className={`${baseClass} w-full text-left cursor-not-allowed opacity-70`}
                          >
                            <Icon className={`w-5 h-5 shrink-0 transition-colors duration-200 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                            <span className="text-sm flex-1 truncate">{item.label}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase shrink-0">{lockLabel}</span>
                          </button>
                        );
                      }

                      return (
                        <Link 
                          key={item.path}
                          to={item.path} 
                          className={baseClass}
                          title={item.label}
                        >
                          <Icon className={`w-5 h-5 shrink-0 transition-colors duration-200 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                          <span className="text-sm truncate flex-1">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
        
        {/* Bottom section — always visible, never scrolls away */}
        <div className={`flex-shrink-0 pt-2 pb-4 border-t border-white/5 space-y-1.5 transition-all duration-300 ${
          isSidebarCollapsed ? 'px-2 flex flex-col items-center' : 'px-3.5'
        }`}>
          {!isSidebarCollapsed ? (
            <>
              <Link
                to="/contact"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all duration-200 w-full ${
                  location.pathname === '/contact'
                    ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'
                }`}
                title="Contact Us"
              >
                <ChatBubbleLeftRightIcon className={`w-5 h-5 shrink-0 transition-colors duration-200 ${
                  location.pathname === '/contact' ? 'text-purple-400' : 'text-gray-500'
                }`} />
                <span className="text-sm flex-1 truncate">Contact Us</span>
              </Link>

              {/* Coming Soon Button */}
              <Link
                to="/coming-soon"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all duration-200 w-full ${
                  location.pathname === '/coming-soon'
                    ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'
                }`}
                title="Coming Soon"
              >
                <BeakerIcon className={`w-5 h-5 shrink-0 transition-colors duration-200 ${
                  location.pathname === '/coming-soon' ? 'text-purple-400' : 'text-gray-500'
                }`} />
                <span className="text-sm flex-1 truncate">Coming Soon</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase shrink-0">New</span>
              </Link>

              {/* Sign Out */}
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full px-3.5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-medium rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 cursor-pointer"
                title="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/contact"
                className={`relative group/nav flex items-center justify-center w-full p-2.5 rounded-xl font-medium transition-all duration-200 ${
                  location.pathname === '/contact'
                    ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-300 ring-1 ring-white/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
                }`}
                title="Contact Us"
              >
                <ChatBubbleLeftRightIcon className={`w-5 h-5 shrink-0 ${location.pathname === '/contact' ? 'text-purple-400' : 'text-gray-500 group-hover/nav:text-gray-200'}`} />
                <div className="fixed left-[76px] px-3 py-1.5 bg-[#141416] text-white text-xs font-medium rounded-lg shadow-2xl border border-white/10 opacity-0 group-hover/nav:opacity-100 translate-x-1 group-hover/nav:translate-x-0 pointer-events-none transition-all duration-150 z-[100] whitespace-nowrap">
                  Contact Us
                </div>
              </Link>

              <Link
                to="/coming-soon"
                className={`relative group/nav flex items-center justify-center w-full p-2.5 rounded-xl font-medium transition-all duration-200 ${
                  location.pathname === '/coming-soon'
                    ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-300 ring-1 ring-white/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
                }`}
                title="Coming Soon"
              >
                <BeakerIcon className={`w-5 h-5 shrink-0 ${location.pathname === '/coming-soon' ? 'text-purple-400' : 'text-gray-500 group-hover/nav:text-gray-200'}`} />
                <div className="fixed left-[76px] px-3 py-1.5 bg-[#141416] text-white text-xs font-medium rounded-lg shadow-2xl border border-white/10 opacity-0 group-hover/nav:opacity-100 translate-x-1 group-hover/nav:translate-x-0 pointer-events-none transition-all duration-150 z-[100] whitespace-nowrap flex items-center gap-1.5">
                  <span>Coming Soon</span>
                  <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">NEW</span>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="relative group/nav flex items-center justify-center w-full p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-medium rounded-xl transition-all duration-200 cursor-pointer"
                title="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
                <div className="fixed left-[76px] px-3 py-1.5 bg-[#141416] text-red-300 text-xs font-medium rounded-lg shadow-2xl border border-red-500/20 opacity-0 group-hover/nav:opacity-100 translate-x-1 group-hover/nav:translate-x-0 pointer-events-none transition-all duration-150 z-[100] whitespace-nowrap">
                  Sign Out
                </div>
              </button>
            </>
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
          
          <span
            className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
              isVipAccess
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                : 'bg-white/10 text-gray-300 border-white/10'
            }`}
            title={isVipAccess ? 'This account has VIP lifetime access' : `Current plan: ${currentPlanName}`}
          >
            {isVipAccess ? 'VIP' : currentPlanName}
          </span>
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
            
            <nav className="flex-1 min-h-0 px-4 py-6 space-y-4 overflow-y-auto custom-scrollbar">
              {filteredGroups.map((group, groupIdx) => {
                const hasActiveItem = group.items.some((item) => location.pathname === item.path);
                const isCollapsed = !hasActiveItem && Boolean(collapsedSections?.[group.title]);

                return (
                  <div key={groupIdx} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleSection(group.title)}
                      className="w-full flex items-center justify-between px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500/90 hover:text-gray-200 transition-colors group mb-1 cursor-pointer select-none"
                    >
                      <span>{group.title}</span>
                      <ChevronDownIcon
                        className={`w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-transform duration-200 ${
                          isCollapsed ? "-rotate-90" : "rotate-0"
                        }`}
                      />
                    </button>
                    {!isCollapsed && group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      const { isLocked, lockLabel, lockDescription } = getSidebarLockState(group.title, item.path, item.featureKey);
                      const baseClass = `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-white ring-1 ring-white/10'
                          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                      }`;
                      
                      if (isLocked) {
                        return (
                          <button
                            key={item.path}
                            type="button"
                            disabled
                            aria-disabled="true"
                            title={lockDescription}
                            onClick={() => setUpgradeModal({
                              open: true,
                              title: 'Upgrade required',
                              featureName: item.label,
                              description: item.upgradeText || lockDescription,
                              targetPlanName: item.upgradePlan || 'Pro',
                              targetPlanCode: resolvePlanCode(item.upgradePlan),
                              ctaLabel: '',
                              subtitle: '',
                            })}
                            className={`${baseClass} w-full text-left cursor-not-allowed opacity-70`}
                          >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                            <span className="text-sm flex-1">{item.label}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">{lockLabel}</span>
                          </button>
                        );
                      }

                      if (item.isComingSoon) {
                        return (
                          <Link 
                            key={item.label}
                            to="/coming-soon"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={baseClass}
                          >
                            <Icon className="w-5 h-5 text-gray-500" />
                            <span className="text-sm flex-1">{item.label}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">Soon</span>
                          </Link>
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
                );
              })}
            </nav>

            {/* Bottom section — always pinned */}
            <div className="flex-shrink-0 px-4 pt-2 pb-4 border-t border-white/10 space-y-2">
              <Link
                to="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 w-full ${
                  location.pathname === '/contact'
                    ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-white ring-1 ring-white/10'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <ChatBubbleLeftRightIcon className={`w-5 h-5 ${location.pathname === '/contact' ? 'text-purple-400' : 'text-gray-500'}`} />
                <span className="text-sm flex-1">Contact Us</span>
              </Link>

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
              <button
                onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                className="w-full px-4 py-3 bg-red-500/10 text-red-400 font-medium rounded-xl text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <ErrorBoundary>
          <main className="flex-1 overflow-y-auto relative z-10">
          {(showQueuedBanner || showExpiringBanner || showExpiredBanner) && (
            <div className="px-4 pt-4 md:px-6 md:pt-6">
              <div className="mx-auto max-w-7xl space-y-3">
                {showQueuedBanner && (
                  <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/15 via-sky-500/10 to-blue-500/15 p-4 md:p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Downgrade Scheduled</p>
                        <p className="mt-1 text-sm text-gray-100">
                          Your account will move to Free on {queuedDate.toLocaleDateString()} after the current cycle ends.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {(showExpiringBanner || showExpiredBanner) && (
                  <div className={`rounded-2xl border p-4 md:p-5 ${showExpiredBanner ? 'border-rose-400/35 bg-gradient-to-r from-rose-500/20 via-red-500/15 to-orange-500/20' : 'border-amber-400/30 bg-gradient-to-r from-amber-500/20 via-yellow-500/12 to-orange-500/18'}`}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${showExpiredBanner ? 'text-rose-200' : 'text-amber-200'}`}>
                          {showExpiredBanner ? 'Plan Expired' : 'Renewal Reminder'}
                        </p>
                        <p className="mt-1 text-sm text-gray-100">
                          {showExpiredBanner
                            ? `Your ${currentPlanName} plan has expired. Renew now to restore full access.`
                            : `Your ${currentPlanName} plan expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Renew now to avoid interruption.`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUpgradeModal({
                          open: true,
                          title: 'Renew your plan',
                          featureName: 'Plan access',
                          description: `Pay now to renew ${currentPlanName}. If your current cycle is still active, renewal starts automatically after it ends.`,
                          targetPlanName: currentPlanName,
                          targetPlanCode: resolvePlanCode(currentPlanCode),
                          ctaLabel: `Pay & Renew ${currentPlanName}`,
                          subtitle: showExpiredBanner
                            ? `Your ${currentPlanName} access has expired.`
                            : `Keep your ${currentPlanName} access active without interruption.`,
                        })}
                        className="inline-flex items-center justify-center rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Renew now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
                      title: 'Upgrade required',
                      featureName: 'Premium Modules',
                      description: 'Upgrade to Pro or Business to unlock dashboard, reports, integrations, and advanced operations.',
                      targetPlanName: 'Pro',
                      targetPlanCode: 'pro',
                      ctaLabel: '',
                      subtitle: '',
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
        </ErrorBoundary>
      </div>

      <UpgradePromptModal
        isOpen={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, title: 'Upgrade required', featureName: '', description: '', targetPlanName: 'Pro', targetPlanCode: 'pro', ctaLabel: '', subtitle: '' })}
        title={upgradeModal.title || 'Upgrade required'}
        featureName={upgradeModal.featureName}
        targetPlanName={upgradeModal.targetPlanName}
        targetPlanCode={upgradeModal.targetPlanCode || 'pro'}
        description={upgradeModal.description}
        ctaLabel={upgradeModal.ctaLabel}
        subtitle={upgradeModal.subtitle}
      />

      {showOnboarding && profileData?.profile && (
        <OnboardingWizard 
          profile={profileData.profile} 
          onClose={() => setShowOnboarding(false)} 
        />
      )}
    </div>
  );
}
