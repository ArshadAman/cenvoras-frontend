import React, { useState } from "react";
import { getCurrencySymbol } from '../../utils/currency';
import { getTodayKolkata, getKolkataMonthBounds } from '../../utils/date';
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

  const todayStr = getTodayKolkata();
  const { from: monthStartStr } = getKolkataMonthBounds();
  const [customRange, setCustomRange] = useState({ start: todayStr, end: todayStr });

  const getDates = () => {
    if (dateFilter === "today") return { start_date: todayStr, end_date: todayStr };
    if (dateFilter === "month") {
      return { start_date: monthStartStr, end_date: todayStr };
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
  // Prefer net (incl. GST − credit notes) — same as dashboard / AI sales_mtd
  const overallMonthRevenue =
    analytics.this_month_revenue_net
    ?? analytics.sales_mtd?.net
    ?? analytics.this_month_revenue
    ?? 0;

  const cardTitle = dateFilter === 'today' ? "Today's Sales" : dateFilter === 'month' ? "This Month's Sales" : "Period Sales";

  const summaryCards = [
    {
      label: cardTitle,
      value: selectedCount,
      subValue: `${getCurrencySymbol()}${Number(selectedRevenue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      icon: <CurrencyRupeeIcon className="w-5 h-5 text-[var(--accent-primary)]" />,
      badgeText: dateFilter === 'today' ? 'Live Today' : 'Selected'
    },
    {
      label: 'Overall This Month',
      value: analytics.this_month_invoices || 0,
      subValue: `${getCurrencySymbol()}${Number(overallMonthRevenue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      icon: <CalendarIcon className="w-5 h-5 text-[var(--status-success)]" />,
      badgeText: 'MTD Volume'
    },
    {
      label: 'Avg. Invoice Value',
      value: `${getCurrencySymbol()}${selectedCount > 0 ? (selectedRevenue / selectedCount).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 0}`,
      subValue: selectedCount > 0 ? `Across ${selectedCount} invoices` : 'No invoices in period',
      icon: <ChartBarIcon className="w-5 h-5 text-[var(--status-info)]" />,
      badgeText: 'Average'
    },
    {
      label: 'Active Invoices',
      value: invoices.filter(inv => inv.status !== 'draft').length,
      subValue: `${invoices.filter(inv => inv.status === 'draft').length} draft in queue`,
      icon: <ShoppingBagIcon className="w-5 h-5 text-[var(--accent-primary)]" />,
      badgeText: 'Pipeline'
    }
  ];

  return (
    <div className="space-y-5 mb-8 mt-2 transition-all duration-300">
      {/* Analytics Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse"></div>
            <h3 className="text-[var(--text-primary)] text-sm font-bold tracking-tight">Sales Analytics</h3>
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-1.5 bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border-subtle)]">
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
                      ? "bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {analyticsFetching && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--status-info)]/15 border border-[var(--status-info)]/30 text-[var(--status-info)] text-[10px] font-bold animate-pulse">
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
                className="bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 outline-none focus:border-[var(--accent-primary)]"
                value={customRange.start}
                onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
              />
              <span className="text-[var(--text-muted)] text-xs">to</span>
              <input 
                type="date"
                min={customRange.start || minDate}
                max={maxDate}
                className="bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 outline-none focus:border-[var(--accent-primary)]"
                value={customRange.end}
                onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          )}

          <button
            type="button"
            onClick={toggleCollapse}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl transition-all cursor-pointer select-none"
            title={isCollapsed ? "Expand Analytics" : "Collapse Analytics"}
          >
            <span>{isCollapsed ? "Show Analytics" : "Hide Analytics"}</span>
            {isCollapsed ? <ChevronDownIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> : <ChevronUpIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
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
                className="relative overflow-hidden rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 flex flex-col justify-between group transition-all duration-300 hover:border-[var(--border-default)] shadow-sm"
              >
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <div className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                    {card.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-0.5 rounded-md border border-[var(--border-subtle)]">
                    {card.badgeText}
                  </span>
                </div>

                <div className="relative z-10">
                  {analyticsLoading ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-7 bg-[var(--bg-surface-hover)] rounded-lg w-1/2"></div>
                      <div className="h-4 bg-[var(--bg-surface-hover)] rounded-md w-3/4"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-black text-[var(--text-primary)] tracking-tight font-mono font-tabular mb-1">
                        {card.value}
                      </div>
                      <div className="text-sm font-semibold text-[var(--text-secondary)] font-mono font-tabular mb-1">
                        {card.subValue}
                      </div>
                      <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
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
            <div className="lg:col-span-2 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">Top Customers</h4>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                    By Volume
                  </span>
                </div>
                <span className="text-xs text-[var(--text-muted)]">Total Billed</span>
              </div>

              <div className="space-y-2.5">
                {analyticsLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-hover)]"></div>
                        <div className="h-4 bg-[var(--bg-surface-hover)] rounded w-32"></div>
                      </div>
                      <div className="h-4 bg-[var(--bg-surface-hover)] rounded w-20"></div>
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
                        className="flex justify-between items-center p-2.5 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition-all"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            index === 0 ? 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30' : 
                            index === 1 ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30' : 
                            index === 2 ? 'bg-[var(--status-info)]/15 text-[var(--status-info)] border border-[var(--status-info)]/30' :
                            'bg-[var(--text-secondary)]/15 text-[var(--text-secondary)] border border-[var(--text-secondary)]/30'
                          }`}>
                            {initials}
                          </div>
                          <div className="truncate">
                            <span className="text-sm font-semibold text-[var(--text-primary)] truncate block">{customer}</span>
                            <span className="text-[10px] text-[var(--text-muted)] font-medium">Rank #{index + 1}</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums shrink-0 ml-4">
                          {getCurrencySymbol()}{Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-[var(--text-muted)] text-xs">No customer sales data available yet</div>
                )}
              </div>
            </div>

            {/* Overdue Invoices Alert */}
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-[var(--status-danger)]" />
                  <h4 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">Action Required</h4>
                </div>
                {overdueCount > 0 && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-[var(--status-danger)] bg-[var(--status-danger)]/15 px-2 py-0.5 rounded-full border border-[var(--status-danger)]/30">
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
                        className="rounded-xl border border-[var(--status-danger)]/30 bg-[var(--status-danger)]/10 p-2.5 hover:bg-[var(--status-danger)]/15 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-[var(--text-primary)] truncate">#{invoice.invoice_number || 'Invoice'}</p>
                          <span className="text-[10px] font-semibold text-[var(--status-danger)] whitespace-nowrap bg-[var(--status-danger)]/20 px-1.5 py-0.5 rounded">
                            {invoice.days_overdue}d overdue
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[11px]">
                          <span className="text-[var(--text-secondary)] truncate max-w-[140px]">{invoice.customer_name || 'Customer'}</span>
                          <span className="text-[var(--status-danger)] font-bold tabular-nums">
                            {getCurrencySymbol()}{Number(invoice.outstanding_amount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {overdueCount > overduePreview.length && (
                    <div className="mt-2 text-center text-[10px] text-[var(--text-muted)] font-medium">
                      +{overdueCount - overduePreview.length} more overdue invoices
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center my-auto">
                  <div className="w-10 h-10 bg-[var(--status-success)]/10 rounded-full flex items-center justify-center mb-2 border border-[var(--status-success)]/20">
                    <CurrencyRupeeIcon className="w-5 h-5 text-[var(--status-success)]" />
                  </div>
                  <p className="text-[var(--text-primary)] text-xs font-bold">Collections Healthy</p>
                  <p className="text-[var(--text-muted)] text-[11px] mt-0.5">No overdue customer invoices</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}