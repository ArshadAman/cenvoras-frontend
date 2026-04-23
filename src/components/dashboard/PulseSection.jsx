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
      
      <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UserGroupIcon className="w-6 h-6 text-orange-400" />
              Udhaar Status
            </h2>
            <p className="text-xs text-gray-500 mt-1">List of customers with outstanding balances</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/5 bg-black/40">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : customers.length > 0 ? (
            <div className="space-y-1">
              {customers.map((customer) => (
                <div 
                  key={customer.id} 
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                      <UserCircleIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">{customer.name}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-tight">Credit Limit: ₹{parseFloat(customer.credit_limit || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-orange-400">₹{parseFloat(customer.current_balance).toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500">Balance Due</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <UserGroupIcon className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">No customers with outstanding balance</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Total Customers: <span className="text-white font-medium">{customers.length}</span>
            </div>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-colors border border-white/10"
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
            <div className="h-10 w-10 bg-white/10 rounded-xl mb-3" />
            <div className="h-8 w-24 bg-white/10 rounded mb-2" />
            <div className="h-4 w-32 bg-white/5 rounded" />
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

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '--';
    return `₹${Math.abs(value).toLocaleString('en-IN')}`;
  };

  const cards = [
    {
      label: 'Sales Today',
      value: formatCurrency(pulse.sales_today),
      subtitle: pulse.sales_change_percent !== undefined 
        ? `${pulse.sales_change_percent > 0 ? '+' : ''}${pulse.sales_change_percent}% vs yesterday`
        : 'vs yesterday',
      icon: CurrencyRupeeIcon,
      color: 'cyan',
      trend: pulse.sales_change_percent,
    },
    {
      label: 'Cash / Bank',
      value: formatCurrency((pulse.cash_in_hand || 0) + (pulse.bank_collections || 0)),
      subtitle: 'Net liquid balance (all-time, adjusted by purchase payments)',
      icon: BanknotesIcon,
      color: 'green',
    },
    {
      label: 'Net Profit (Est.)',
      value: formatCurrency(pulse.net_profit_today),
      subtitle: pulse.net_profit_today >= 0 ? 'You\'re in profit! 🎉' : 'Below cost today',
      icon: pulse.net_profit_today >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon,
      color: pulse.net_profit_today >= 0 ? 'emerald' : 'red',
    },
    {
      label: 'Udhaar Status',
      value: formatCurrency(liveReceivables || pulse.total_receivables),
      subtitle: (
        <div className="flex justify-between items-center w-full">
          <span>G: {formatCurrency(pulse.udhaar_given_today)} | C: {formatCurrency(pulse.udhaar_collected_today)}</span>
          <Link 
            to="/payments" 
            className="text-cyan-400 hover:underline ml-2" 
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
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Today's Pulse</h2>
        <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">Live</span>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const colors = colorClasses[card.color] || colorClasses.cyan;
          const Icon = card.icon;
          
          return (
            <div 
              key={i} 
              onClick={card.onClick}
              className={`bento-card !p-5 group hover:border-white/20 transition-all duration-300 ${colors.border} ${card.onClick ? 'cursor-pointer active:scale-95' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${colors.bg}`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                {card.trend !== undefined && (
                  <div className={`flex items-center gap-1 text-xs ${card.trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {card.trend >= 0 ? (
                      <ArrowTrendingUpIcon className="w-3 h-3" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-3 h-3" />
                    )}
                    {Math.abs(card.trend)}%
                  </div>
                )}
              </div>
              
              <div className={`text-2xl font-bold ${colors.text} mb-1`}>
                {card.value}
              </div>
              
              <div className="text-xs text-gray-500 font-medium">
                {card.label}
              </div>
              
              <div className="text-[10px] text-gray-600 mt-1 truncate">
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
