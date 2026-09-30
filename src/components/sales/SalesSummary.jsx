import React, { useState } from "react";
import { getCurrencySymbol } from '../../utils/currency';
import { useQuery } from "@tanstack/react-query";
import { getSalesAnalytics, getSalesInvoices, getOverdueSalesInvoices } from "../../api/sales";
import { 
  CurrencyRupeeIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

export default function SalesSummary() {
  const [dateFilter, setDateFilter] = useState("today"); // "today", "month", "custom"
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sales_analytics_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sales_analytics_collapsed", String(next));
      } catch {
        // ignore storage error
      }
      return next;
    });
  };

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

  const { data: analyticsRes, isLoading: analyticsLoading, isFetching: analyticsFetching } = useQuery({
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
    .slice(0, 4);

  const minDate = "2024-01-01"; 
  const maxDate = todayStr;

  const selectedRevenue = analytics.total_revenue || 0;
  const selectedCount = analytics.total_invoices || 0;
  const overallMonthRevenue = analytics.this_month_revenue || 0;

  const cardTitle = dateFilter === 'today' ? "Today's Sales" : dateFilter === 'month' ? "This Month's Sales" : "Period Sales";

  const summaryCards = [
    {
      label: cardTitle,
      value: selectedCount,
      subValue: `${getCurrencySymbol()}${Number(selectedRevenue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      icon: <CurrencyRupeeIcon className="w-5 h-5 text-cyan-400" />,
      color: 'cyan',
      glow: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
      borderColor: 'border-cyan-500/20 group-hover:border-cyan-500/40',
      badgeText: dateFilter === 'today' ? 'Live Today' : 'Selected'
    },
    {
      label: 'Overall This Month',
      value: analytics.this_month_invoices || 0,
      subValue: `${getCurrencySymbol()}${Number(overallMonthRevenue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      icon: <CalendarIcon className="w-5 h-5 text-emerald-400" />,
      color: 'emerald',
      glow: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      borderColor: 'border-emerald-500/20 group-hover:border-emerald-500/40',
      badgeText: 'MTD Volume'
    },
    {
      label: 'Avg. Invoice Value',
      value: `${getCurrencySymbol()}${selectedCount > 0 ? (selectedRevenue / selectedCount).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 0}`,
      subValue: selectedCount > 0 ? `Across ${selectedCount} invoices` : 'No invoices in period',
      icon: <ChartBarIcon className="w-5 h-5 text-blue-400" />,
      color: 'blue',
      glow: 'from-blue-500/10 via-blue-500/5 to-transparent',
      borderColor: 'border-blue-500/20 group-hover:border-blue-500/40',
      badgeText: 'Average'
    },
    {
      label: 'Active Invoices',
      value: invoices.filter(inv => inv.status !== 'draft').length,
      subValue: `${invoices.filter(inv => inv.status === 'draft').length} draft in queue`,
      icon: <ShoppingBagIcon className="w-5 h-5 text-purple-400" />,
      color: 'purple',
      glow: 'from-purple-500/10 via-purple-500/5 to-transparent',
      borderColor: 'border-purple-500/20 group-hover:border-purple-500/40',
      badgeText: 'Pipeline'
    }
  ];

  return (
    <div className="space-y-5 mb-8 mt-2 transition-all duration-300">
      {/* Analytics Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/10 backdrop-blur-xl shadow-lg shadow-black/20">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
            <h3 className="text-white text-sm font-bold tracking-tight">Sales Analytics</h3>
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
              {[
                { id: "today", label: "Today" },
                { id: "month", label: "This Month" },
                { id: "custom", label: "Custom" },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDateFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    dateFilter === tab.id
                      ? "bg-white/15 text-white shadow-sm border border-white/15"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {analyticsFetching && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-bold animate-pulse">
              <SparklesIcon className="w-3 h-3" />
              <span>Updating...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isCollapsed && dateFilter === "custom" && (
            <div className="flex items-center gap-1.5 text-xs">
              <input 
                type="date"
                min={minDate}
                max={maxDate}
                className="bg-black/40 text-white text-xs border border-white/10 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-cyan-500"
                value={customRange.start}
                onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
              />
              <span className="text-gray-500 text-xs">to</span>
              <input 
                type="date"
                min={customRange.start || minDate}
                max={maxDate}
                className="bg-black/40 text-white text-xs border border-white/10 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-cyan-500"
                value={customRange.end}
                onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          )}

          <button
            type="button"
            onClick={toggleCollapse}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer select-none"
            title={isCollapsed ? "Expand Analytics" : "Collapse Analytics"}
          >
            <span>{isCollapsed ? "Show Analytics" : "Hide Analytics"}</span>
            {isCollapsed ? <ChevronDownIcon className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronUpIcon className="w-3.5 h-3.5 text-gray-400" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-5 transition-all duration-300">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map((card, i) => (
              <div 
                key={i} 
                className={`relative overflow-hidden rounded-2xl bg-[#0f0f10] border ${card.borderColor} p-5 flex flex-col justify-between group transition-all duration-300 hover:shadow-xl hover:shadow-black/40`}
              >
                {/* Background glow gradient */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.glow} rounded-full blur-2xl pointer-events-none`}></div>
                
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
                    {card.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                    {card.badgeText}
                  </span>
                </div>

                <div className="relative z-10">
                  {analyticsLoading ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-7 bg-white/10 rounded-lg w-1/2"></div>
                      <div className="h-4 bg-white/5 rounded-md w-3/4"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-black text-white tracking-tight tabular-nums mb-1">
                        {card.value}
                      </div>
                      <div className="text-sm font-semibold text-cyan-300 tabular-nums mb-1">
                        {card.subValue}
                      </div>
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        {card.label}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Secondary Row: Top Customers & Action Required */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Top Customers */}
            <div className="lg:col-span-2 rounded-2xl bg-[#0f0f10] border border-white/10 p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white tracking-tight">Top Customers</h4>
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    By Volume
                  </span>
                </div>
                <span className="text-xs text-gray-400">Total Billed</span>
              </div>

              <div className="space-y-2.5">
                {analyticsLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10"></div>
                        <div className="h-4 bg-white/10 rounded w-32"></div>
                      </div>
                      <div className="h-4 bg-white/10 rounded w-20"></div>
                    </div>
                  ))
                ) : topCustomers.length > 0 ? (
                  topCustomers.map(([customer, amount], index) => {
                    const initials = customer
                      .split(" ")
                      .slice(0, 2)
                      .map(w => w[0])
                      .join("")
                      .toUpperCase() || "C";

                    return (
                      <div 
                        key={customer} 
                        className="flex justify-between items-center p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            index === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 
                            index === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' : 
                            index === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/30' :
                            'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {initials}
                          </div>
                          <div className="truncate">
                            <span className="text-sm font-semibold text-white truncate block">{customer}</span>
                            <span className="text-[10px] text-gray-400 font-medium">Rank #{index + 1}</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-cyan-300 tabular-nums shrink-0 ml-4">
                          {getCurrencySymbol()}{Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500 text-xs">No customer sales data available yet</div>
                )}
              </div>
            </div>

            {/* Overdue Invoices Alert */}
            <div className="rounded-2xl bg-[#0f0f10] border border-white/10 p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-rose-400" />
                  <h4 className="text-sm font-bold text-white tracking-tight">Action Required</h4>
                </div>
                {overdueCount > 0 && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30">
                    {overdueCount} Overdue
                  </span>
                )}
              </div>

              {overdueCount > 0 ? (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-2 overflow-y-auto max-h-52 pr-1 custom-scrollbar">
                    {overduePreview.map((invoice) => (
                      <div 
                        key={invoice.id} 
                        className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-2.5 hover:bg-rose-500/10 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-white truncate">#{invoice.invoice_number || 'Invoice'}</p>
                          <span className="text-[10px] font-semibold text-rose-300 whitespace-nowrap bg-rose-500/20 px-1.5 py-0.5 rounded">
                            {invoice.days_overdue}d overdue
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[11px]">
                          <span className="text-gray-300 truncate max-w-[140px]">{invoice.customer_name || 'Customer'}</span>
                          <span className="text-rose-300 font-bold tabular-nums">
                            {getCurrencySymbol()}{Number(invoice.outstanding_amount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {overdueCount > overduePreview.length && (
                    <div className="mt-2 text-center text-[10px] text-gray-500 font-medium">
                      +{overdueCount - overduePreview.length} more overdue invoices
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center my-auto">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2 border border-emerald-500/20">
                    <CurrencyRupeeIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-white text-xs font-bold">Collections Healthy</p>
                  <p className="text-gray-400 text-[11px] mt-0.5">No overdue customer invoices</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}