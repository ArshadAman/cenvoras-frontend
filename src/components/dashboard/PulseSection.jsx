import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  CurrencyRupeeIcon, 
  BanknotesIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  UserGroupIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import api from '../../api/api';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

/**
 * UdhaarModal - Shows a list of customers with outstanding balances
 */
function UdhaarModal({ isOpen, onClose }) {
  const [search, setSearch] = useState('');
  
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/billing/customers/').then(res => res.data),
    enabled: isOpen
  });

  const customers = (Array.isArray(customersData) ? customersData : (customersData?.results || []))
    .filter(c => parseFloat(c.current_balance) > 0)
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.current_balance - a.current_balance);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-primary)]/50">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <UserGroupIcon className="w-6 h-6 text-[var(--status-warning)]" />
              Udhaar
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">List of customers with outstanding balances</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/30">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input 
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg py-2 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-[var(--border-subtle)] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : customers.length > 0 ? (
            <div className="space-y-1">
              {customers.map((customer) => (
                <div 
                  key={customer.id} 
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-primary)]/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--status-warning)]/10 flex items-center justify-center text-[var(--status-warning)] border border-[var(--status-warning)]/20">
                      <UserCircleIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--status-warning)] transition-colors">{customer.name}</div>
                      <div className="text-xs text-[var(--text-muted)] uppercase tracking-tight">Credit Limit: {getCurrencySymbol()}{parseFloat(customer.credit_limit || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[var(--status-warning)]">{getCurrencySymbol()}{parseFloat(customer.current_balance).toLocaleString()}</div>
                    <div className="text-xs text-[var(--text-muted)]">Balance Due</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
              <UserGroupIcon className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">No customers with outstanding balance</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[var(--bg-primary)]/40 border-t border-[var(--border-subtle)] flex justify-between items-center">
            <div className="text-xs text-[var(--text-muted)]">
              Total Customers: <span className="text-[var(--text-primary)] font-medium">{customers.length}</span>
            </div>
            <button 
              onClick={onClose}
              className="btn-secondary px-4 py-2 text-xs"
            >
              Close
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * PulseSection - Today's key business metrics at a glance
 */
export default function PulseSection({ data, isLoading }) {
  const [isUdhaarModalOpen, setIsUdhaarModalOpen] = useState(false);
  const lastGoodPulseRef = useRef({});

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/billing/customers/').then(res => res.data),
    staleTime: 0,
  });

  if (isLoading && !Object.keys(lastGoodPulseRef.current).length) {
    return (
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bento-card !p-5 animate-pulse">
            <div className="h-10 w-10 bg-[var(--border-subtle)] rounded-xl mb-3" />
            <div className="h-8 w-24 bg-[var(--border-subtle)] rounded mb-2" />
            <div className="h-4 w-32 bg-[var(--border-subtle)] rounded" />
          </div>
        ))}
      </section>
    );
  }

  const hasPulseData = !!(data && Object.keys(data).length > 0);
  if (hasPulseData) {
    lastGoodPulseRef.current = data;
  }
  const pulse = hasPulseData ? data : lastGoodPulseRef.current;
  const customers = Array.isArray(customersData) ? customersData : (customersData?.results || []);
  const liveReceivables = customers.reduce((sum, customer) => {
    const balance = parseFloat(customer?.current_balance || 0);
    return balance > 0 ? sum + balance : sum;
  }, 0);

  // Keep abs for sales/udhaar display; Cash/Bank must show signed ledger balances
  const formatCurrencyAbs = (value) => {
    if (value === undefined || value === null) return '--';
    return `${getCurrencySymbol()}${Math.abs(value).toLocaleString('en-IN')}`;
  };
  const formatCurrencySigned = (value) => {
    if (value === undefined || value === null) return '--';
    const n = Number(value);
    const sign = n < 0 ? '-' : '';
    return `${sign}${getCurrencySymbol()}${Math.abs(n).toLocaleString('en-IN')}`;
  };

  const liquidTotal = pulse.total_liquid_balance ?? ((pulse.cash_in_hand || 0) + (pulse.bank_collections || 0));
  const liquidNegative = Number(liquidTotal) < 0;

  const cards = [
    {
      label: 'Sales Today',
      value: formatCurrencyAbs(pulse.sales_today),
      subtitle: pulse.sales_change_percent !== undefined 
        ? `${pulse.sales_change_percent > 0 ? '+' : ''}${pulse.sales_change_percent}% vs yesterday`
        : 'vs yesterday',
      icon: CurrencyRupeeIcon,
      color: 'cyan',
      trend: pulse.sales_change_percent,
    },
    {
      label: 'Cash / Bank',
      value: formatCurrencySigned(liquidTotal),
      subtitle: `Cash: ${formatCurrencySigned(pulse.cash_in_hand || 0)} | Bank: ${formatCurrencySigned(pulse.bank_collections || 0)}`,
      icon: BanknotesIcon,
      color: liquidNegative ? 'red' : 'green',
    },
    {
      label: 'Net Profit (Est.)',
      value: formatCurrencyAbs(pulse.net_profit_today),
      subtitle: pulse.net_profit_today >= 0 ? 'Estimated sales above COGS today — not statutory P&L' : 'Below COGS today — not statutory P&L',
      icon: pulse.net_profit_today >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon,
      color: pulse.net_profit_today >= 0 ? 'emerald' : 'red',
    },
    {
      label: 'Udhaar',
      value: formatCurrencyAbs(liveReceivables || pulse.total_receivables),
      subtitle: (
        <div className="flex justify-between items-center w-full">
          <span>G: {formatCurrency(pulse.udhaar_given_today)} | C: {formatCurrency(pulse.udhaar_collected_today)}</span>
          <Link 
            to="/payments" 
            className="text-[var(--accent-primary)] hover:underline ml-2 font-medium" 
            onClick={(e) => e.stopPropagation()}
          >
            Record Payment
          </Link>
        </div>
      ),
      icon: UserGroupIcon,
      color: 'orange',
      onClick: () => setIsUdhaarModalOpen(true)
    },
  ];

  const colorClasses = {
    cyan: { bg: 'bg-[var(--status-info-bg)]', text: 'text-[var(--status-info-text)]', border: 'border-[var(--status-info-border)]' },
    green: { bg: 'bg-[var(--status-success-bg)]', text: 'text-[var(--status-success-text)]', border: 'border-[var(--status-success-border)]' },
    emerald: { bg: 'bg-[var(--status-success-bg)]', text: 'text-[var(--status-success-text)]', border: 'border-[var(--status-success-border)]' },
    red: { bg: 'bg-[var(--status-danger-bg)]', text: 'text-[var(--status-danger-text)]', border: 'border-[var(--status-danger-border)]' },
    orange: { bg: 'bg-[var(--status-warning-bg)]', text: 'text-[var(--status-warning-text)]', border: 'border-[var(--status-warning-border)]' },
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Today's Pulse</h2>
        <span className="text-xs px-2 py-0.5 bg-[var(--status-info)]/15 text-[var(--status-info)] font-semibold rounded-full">Live</span>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const colors = colorClasses[card.color] || colorClasses.cyan;
          const Icon = card.icon;
          
          return (
            <div 
              key={i} 
              onClick={card.onClick}
              className={`bento-card !p-5 group hover:border-[var(--accent-primary)]/40 transition-all duration-300 ${colors.border} ${card.onClick ? 'cursor-pointer active:scale-95' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${colors.bg}`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                {card.trend !== undefined && (
                  <div className={`flex items-center gap-1 text-xs font-semibold ${card.trend >= 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'}`}>
                    {card.trend >= 0 ? (
                      <ArrowTrendingUpIcon className="w-3 h-3" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-3 h-3" />
                    )}
                    {Math.abs(card.trend)}%
                  </div>
                )}
              </div>
              
              <div className={`text-2xl font-bold ${colors.text} mb-1 font-mono font-tabular`}>
                {card.value}
              </div>
              
              <div className="text-xs text-[var(--text-muted)] font-medium">
                {card.label}
              </div>
              
              <div className="text-xs text-[var(--text-muted)]/80 mt-1 truncate">
                {card.subtitle}
              </div>
            </div>
          );
        })}
      </div>

      <UdhaarModal 
        isOpen={isUdhaarModalOpen} 
        onClose={() => setIsUdhaarModalOpen(false)} 
      />
    </section>
  );
}
