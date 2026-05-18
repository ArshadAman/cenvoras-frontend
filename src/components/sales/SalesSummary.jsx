import React, { useState } from "react";
import { 
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';useQuery } from "@tanstack/react-query";
import { getSalesAnalytics, getSalesInvoices, getOverdueSalesInvoices } from "../../api/sales";
import { 
  CurrencyRupeeIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  ShoppingBagIcon,
  ExclamationTriangleIcon 
} from "@heroicons/react/24/outline";

export default function SalesSummary() {
  const [dateFilter, setDateFilter] = useState("today"); // "today", "month", "custom"

  const formatLocalDate = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = formatLocalDate(new Date());
  const [customRange, setCustomRange] = useState({ start: todayStr, end: todayStr });

  const getDates = () => {
    if (dateFilter === "today") return { start_date: todayStr, end_date: todayStr };
    if (dateFilter === "month") {
      const d = new Date();
      d.setDate(1);
      return { start_date: formatLocalDate(d), end_date: todayStr };
    }
    if (dateFilter === "custom") {
      return { start_date: customRange.start, end_date: customRange.end };
    }
    return {};
  };

  const dates = getDates();

  const { data: analyticsRes, isLoading: analyticsLoading } = useQuery({
    queryKey: ["salesAnalytics", dates],
    queryFn: () => getSalesAnalytics(dates),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ["salesInvoices", "", "-invoice_date", 1],
    queryFn: () => getSalesInvoices({ search: "", ordering: "-invoice_date", page: 1 }),
  });

  const { data: overdueReport } = useQuery({
    queryKey: ["overdueSalesInvoicesSummary"],
    queryFn: () => getOverdueSalesInvoices({ refresh: "true" }),
  });

  const analytics = analyticsRes || {};
  const invoices = Array.isArray(invoicesData) ? invoicesData : invoicesData?.data || invoicesData?.results || [];

  const overdueInvoices = overdueReport?.results || [];
  const overdueCount = overdueReport?.count ?? overdueInvoices.length;
  const overduePreview = overdueInvoices.slice(0, 8);

  // Top customers
  const customerTotals = invoices.filter(inv => inv.status !== 'draft').reduce((acc, invoice) => {
    const customer = invoice.customer_name || 'Unknown';
    acc[customer] = (acc[customer] || 0) + parseFloat(invoice.total_amount || 0);
    return acc;
  }, {});
  
  const topCustomers = Object.entries(customerTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  const minDate = "2024-01-01"; 
  const maxDate = todayStr;

  if (analyticsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bento-card p-5 animate-pulse">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/10 rounded-xl"></div>
              <div className="ml-4 flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
                <div className="h-6 bg-white/10 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const selectedRevenue = analytics.total_revenue || 0;
  const selectedCount = analytics.total_invoices || 0;
  const overallMonthRevenue = analytics.this_month_revenue || 0;

  const cardTitle = dateFilter === 'today' ? "Today's Sales" : dateFilter === 'month' ? "This Month's Sales" : "Custom Range Sales";

  const summaryCards = [
    {
      label: cardTitle,
      value: selectedCount,
      subValue: `$${getCurrencySymbol()}${selectedRevenue.toLocaleString()}`,
      icon: <CurrencyRupeeIcon className="w-6 h-6 text-cyan-400" />,
      color: 'cyan'
    },
    {
      label: 'Overall This Month',
      value: analytics.this_month_invoices || 0,
      subValue: `$${getCurrencySymbol()}${overallMonthRevenue.toLocaleString()}`,
      icon: <CalendarIcon className="w-6 h-6 text-green-400" />,
      color: 'green'
    },
    {
      label: 'Avg. Invoice Value',
      value: `$${getCurrencySymbol()}${selectedCount > 0 ? (selectedRevenue / selectedCount).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}`,
      subValue: 'For selected period',
      icon: <ChartBarIcon className="w-6 h-6 text-blue-400" />,
      color: 'blue'
    },
    {
      label: 'Active Invoices',
      value: invoices.filter(inv => inv.status !== 'draft').length,
      subValue: 'Based on recent activity',
      icon: <ShoppingBagIcon className="w-6 h-6 text-purple-400" />,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6 mb-8 mt-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[#111] border border-white/10">
         <div className="flex items-center gap-4">
             <h3 className="text-white font-medium">Analytics Filter</h3>
             <select 
               className="bg-[#111] text-white text-sm border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500"
               value={dateFilter}
               onChange={e => setDateFilter(e.target.value)}
             >
                <option value="today">Today</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Date Range</option>
             </select>
         </div>

         {dateFilter === "custom" && (
             <div className="flex items-center gap-2">
                <input 
                  type="date"
                  min={minDate}
                  max={maxDate}
                  className="bg-[#111] text-white text-sm border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500"
                  value={customRange.start}
                  onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                />
                <span className="text-gray-500">to</span>
                <input 
                  type="date"
                  min={customRange.start || minDate}
                  max={maxDate}
                  className="bg-[#111] text-white text-sm border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500"
                  value={customRange.end}
                  onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                />
             </div>
         )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, i) => (
          <div key={i} className="bento-card p-6 flex flex-col justify-between group hover:border-white/20 transition-colors">
            <div className="flex justify-between items-start mb-4">
               <div className={`p-3 rounded-xl bg-${card.color}-400/10 border border-${card.color}-400/20`}>
                  {card.icon}
               </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white mb-1 tracking-tight">{card.value}</div>
              <div className="text-sm font-medium text-cyan-300 mb-1">{card.subValue}</div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Customers */}
        <div className="lg:col-span-2 bento-card p-6">
          <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-2">Top Customers</h3>
          <div className="space-y-4">
            {topCustomers.length > 0 ? (
              topCustomers.map(([customer, amount], index) => (
                <div key={customer} className="flex justify-between items-center p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${
                      index === 0 ? 'bg-yellow-500/80' : index === 1 ? 'bg-gray-400/80' : 'bg-orange-400/80'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white block">{customer}</span>
                      <span className="text-xs text-gray-400">Customer</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-cyan-400">
                    {getCurrencySymbol()}{amount.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No customer data available</div>
            )}
          </div>
        </div>

        {/* Overdue Alerts */}
        <div className="bento-card p-6 min-h-[24rem]">
           <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-2 flex items-center gap-2">
             <ExclamationTriangleIcon className="w-5 h-5 text-red-400" /> Action Required
           </h3>
           
           {overdueCount > 0 ? (
             <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 h-[18.5rem] flex flex-col">
               <div className="flex items-start gap-3">
                 <div className="flex-1">
                   <p className="text-red-200 font-medium mb-1">Overdue Invoices</p>
                   <p className="text-red-300/70 text-sm">
                     You have <span className="font-bold text-white">{overdueCount}</span> invoices that are overdue.
                   </p>
                    {overduePreview.length > 0 && (
                      <div className="mt-3 space-y-2 overflow-y-auto pr-1 custom-scrollbar max-h-[12.5rem]">
                        {overduePreview.map((invoice) => (
                          <div key={invoice.id} className="rounded-lg border border-red-400/20 bg-black/20 px-3 py-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-white truncate">{invoice.invoice_number || 'Invoice'}</p>
                              <p className="text-[11px] text-red-200/90 whitespace-nowrap">{invoice.days_overdue}d overdue</p>
                            </div>
                            <p className="text-xs text-red-200/90 truncate">{invoice.customer_name || 'Unknown Customer'}</p>
                            <p className="text-xs text-red-300/90">Outstanding: {getCurrencySymbol()}{Number(invoice.outstanding_amount || 0).toLocaleString()}</p>
                          </div>
                        ))}
                        {overdueCount > overduePreview.length && (
                          <p className="text-[11px] text-red-300/80">+{overdueCount - overduePreview.length} more overdue invoices</p>
                        )}
                      </div>
                    )}
                 </div>
               </div>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-3">
                  <CurrencyRupeeIcon className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-white font-medium">All caught up!</p>
                <p className="text-gray-400 text-sm mt-1">No overdue invoices found.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}