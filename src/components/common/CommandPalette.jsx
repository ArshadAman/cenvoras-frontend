import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ChartBarIcon,
  CurrencyRupeeIcon,
  ShoppingBagIcon,
  CubeIcon,
  UsersIcon,
  BookOpenIcon,
  UserIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  ScaleIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ClipboardDocumentListIcon,
  BuildingLibraryIcon,
  PlusCircleIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';

const COMMAND_ITEMS = [
  // Actions
  {
    id: 'act-new-invoice',
    title: 'New Sales Invoice',
    category: 'Quick Action',
    keywords: 'create sell bill invoice sale new add',
    path: '/sales',
    icon: PlusCircleIcon,
    badge: 'Action',
  },
  {
    id: 'act-new-quote',
    title: 'New Quotation / Estimate',
    category: 'Quick Action',
    keywords: 'create quote quotation estimate proposal price new add',
    path: '/quotations',
    icon: PlusCircleIcon,
    badge: 'Action',
  },
  {
    id: 'act-new-purchase',
    title: 'New Purchase Bill',
    category: 'Quick Action',
    keywords: 'create purchase buy supplier bill new add',
    path: '/purchase',
    icon: PlusCircleIcon,
    badge: 'Action',
  },
  {
    id: 'act-new-customer',
    title: 'Add New Customer',
    category: 'Quick Action',
    keywords: 'create client customer party add new',
    path: '/customers',
    icon: PlusCircleIcon,
    badge: 'Action',
  },
  {
    id: 'act-new-vendor',
    title: 'Add New Vendor / Supplier',
    category: 'Quick Action',
    keywords: 'create vendor supplier party add new',
    path: '/vendors',
    icon: PlusCircleIcon,
    badge: 'Action',
  },
  {
    id: 'act-new-payment',
    title: 'Record Payment',
    category: 'Quick Action',
    keywords: 'pay receipt money voucher payment add new',
    path: '/payments',
    icon: PlusCircleIcon,
    badge: 'Action',
  },

  // Navigation - Sales & Trade
  {
    id: 'nav-dashboard',
    title: 'Dashboard',
    category: 'Navigation',
    keywords: 'home analytics overview kpi stats',
    path: '/dashboard',
    icon: ChartBarIcon,
    badge: 'Overview',
  },
  {
    id: 'nav-sales',
    title: 'Sales Invoices',
    category: 'Navigation',
    keywords: 'sales invoices billing bills revenue',
    path: '/sales',
    icon: CurrencyRupeeIcon,
    badge: 'Sales',
  },
  {
    id: 'nav-quotations',
    title: 'Quotations',
    category: 'Navigation',
    keywords: 'quotes estimates proposals pricing',
    path: '/quotations',
    icon: BookOpenIcon,
    badge: 'Sales',
  },
  {
    id: 'nav-sales-orders',
    title: 'Sales Orders',
    category: 'Navigation',
    keywords: 'orders fulfillment sales pending',
    path: '/sales-orders',
    icon: ShoppingBagIcon,
    badge: 'Sales',
  },
  {
    id: 'nav-challans',
    title: 'Delivery Challans',
    category: 'Navigation',
    keywords: 'dispatch delivery challan transport shipping',
    path: '/delivery-challans',
    icon: TruckIcon,
    badge: 'Logistics',
  },
  {
    id: 'nav-credit-notes',
    title: 'Credit Notes',
    category: 'Navigation',
    keywords: 'sales return refund credit note',
    path: '/credit-notes',
    icon: ArrowUturnLeftIcon,
    badge: 'Sales',
  },
  {
    id: 'nav-customers',
    title: 'Customer Directory',
    category: 'Navigation',
    keywords: 'clients parties buyers customers',
    path: '/customers',
    icon: UsersIcon,
    badge: 'CRM',
  },
  {
    id: 'nav-vendors',
    title: 'Vendor Directory',
    category: 'Navigation',
    keywords: 'suppliers creditors vendors parties',
    path: '/vendors',
    icon: UsersIcon,
    badge: 'Procurement',
  },

  // Purchasing
  {
    id: 'nav-purchase',
    title: 'Purchase Bills',
    category: 'Navigation',
    keywords: 'bills expenses vendor invoices procurement',
    path: '/purchase',
    icon: ShoppingBagIcon,
    badge: 'Purchasing',
  },
  {
    id: 'nav-purchase-orders',
    title: 'Purchase Orders',
    category: 'Navigation',
    keywords: 'po procurement order supplier',
    path: '/purchase-orders',
    icon: BuildingLibraryIcon,
    badge: 'Purchasing',
  },
  {
    id: 'nav-debit-notes',
    title: 'Debit Notes',
    category: 'Navigation',
    keywords: 'purchase return debit note supplier',
    path: '/debit-notes',
    icon: ArrowUturnRightIcon,
    badge: 'Purchasing',
  },

  // Inventory
  {
    id: 'nav-inventory',
    title: 'Inventory Items & Stock',
    category: 'Navigation',
    keywords: 'stock products items catalog goods sku',
    path: '/inventory',
    icon: CubeIcon,
    badge: 'Inventory',
  },
  {
    id: 'nav-stock-journals',
    title: 'Stock Journals & Adjustments',
    category: 'Navigation',
    keywords: 'inventory adjustment stock transfer wastage damaged',
    path: '/stock-journals',
    icon: ClipboardDocumentListIcon,
    badge: 'Inventory',
  },

  // Financials
  {
    id: 'nav-payments',
    title: 'Payments & Receipts',
    category: 'Navigation',
    keywords: 'bank cash payments vouchers receipts',
    path: '/payments',
    icon: BanknotesIcon,
    badge: 'Financials',
  },
  {
    id: 'nav-ledger',
    title: 'General Ledger',
    category: 'Navigation',
    keywords: 'ledger accounts statements journals balance',
    path: '/ledger',
    icon: BookOpenIcon,
    badge: 'Financials',
  },
  {
    id: 'nav-trial-balance',
    title: 'Trial Balance',
    category: 'Navigation',
    keywords: 'financial statement accounting debit credit audit',
    path: '/reports/trial-balance',
    icon: ScaleIcon,
    badge: 'Financials',
  },
  {
    id: 'nav-reports',
    title: 'Business Reports & P&L',
    category: 'Navigation',
    keywords: 'reports profit loss balance sheet analytics tax summary',
    path: '/reports',
    icon: ChartBarIcon,
    badge: 'Reports',
  },
  {
    id: 'nav-gst',
    title: 'GST & Tax Dashboard',
    category: 'Navigation',
    keywords: 'tax gstr1 gstr3b compliance hsn gst portal',
    path: '/gst',
    icon: ReceiptPercentIcon,
    badge: 'Tax',
  },

  // HRMS & Settings
  {
    id: 'nav-hr',
    title: 'HRMS & Employee Management',
    category: 'Navigation',
    keywords: 'employees staff payroll attendance leaves salary',
    path: '/hr/dashboard',
    icon: UsersIcon,
    badge: 'HRMS',
  },
  {
    id: 'nav-profile',
    title: 'Company & Billing Profile',
    category: 'Navigation',
    keywords: 'company settings profile gstin address bank details',
    path: '/profile',
    icon: UserIcon,
    badge: 'Settings',
  },
];

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  // Reset search and selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter items matching query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMAND_ITEMS;
    return COMMAND_ITEMS.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchKeywords = item.keywords.toLowerCase().includes(q);
      const matchBadge = item.badge.toLowerCase().includes(q);
      return matchTitle || matchCat || matchKeywords || matchBadge;
    });
  }, [query]);

  // Ensure selectedIndex is always in range
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          const item = filteredItems[selectedIndex];
          onClose();
          navigate(item.path);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, navigate, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-10 flex flex-col max-h-[75vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/40">
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, page, or search keywords..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono text-slate-400 bg-slate-800/80 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CommandLineIcon className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-300">No matching commands or pages</p>
              <p className="text-xs text-slate-500 mt-1">Try searching "invoice", "quotation", "ledger", or "vendor".</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  data-index={index}
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(item.path);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm transition-all duration-100 ${
                    isSelected
                      ? 'bg-blue-600/20 text-white border border-blue-500/40'
                      : 'text-slate-300 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="font-medium text-slate-100">{item.title}</span>
                      <span className="text-xs text-slate-500 ml-2 hidden sm:inline">{item.path}</span>
                    </div>
                  </div>
                  <span
                    className={`text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border shrink-0 ml-2 ${
                      isSelected
                        ? 'bg-blue-500/30 text-blue-200 border-blue-400/40'
                        : 'bg-slate-800/70 text-slate-400 border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">↓</kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">↵</kbd>{' '}
              Open
            </span>
          </div>
          <span>Cenvora Quick Action</span>
        </div>
      </div>
    </div>
  );
}
