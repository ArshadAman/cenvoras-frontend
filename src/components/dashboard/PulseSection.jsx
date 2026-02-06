import React from 'react';
import { 
  CurrencyRupeeIcon, 
  BanknotesIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline';

/**
 * PulseSection - Today's key business metrics at a glance
 * Shows: Sales, Cash/Bank, Net Profit, Udhaar
 */
export default function PulseSection({ data, isLoading }) {
  if (isLoading) {
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

  const pulse = data || {};

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '₹0';
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
      subtitle: `Cash: ${formatCurrency(pulse.cash_in_hand)} | UPI: ${formatCurrency(pulse.bank_collections)}`,
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
      value: formatCurrency(pulse.total_receivables),
      subtitle: `Given: ${formatCurrency(pulse.udhaar_given_today)} | Collected: ${formatCurrency(pulse.udhaar_collected_today)}`,
      icon: UserGroupIcon,
      color: 'orange',
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
              className={`bento-card !p-5 group hover:border-white/20 transition-all duration-300 ${colors.border}`}
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
    </section>
  );
}
