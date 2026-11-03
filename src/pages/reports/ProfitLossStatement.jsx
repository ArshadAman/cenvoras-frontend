import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProfitLossStatement } from "../../api/gst";
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import { getTodayKolkata, getKolkataFYStart } from '../../utils/date';
import StockWarningBanner from '../../components/reports/StockWarningBanner';

const today = getTodayKolkata();
const yearStart = getKolkataFYStart();
const fmt = (v) => parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ProfitLossStatement() {
  const [fromDate, setFromDate] = useState(yearStart);
  const [toDate, setToDate] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ["profit-loss-statement", fromDate, toDate],
    queryFn: () => getProfitLossStatement(fromDate, toDate),
  });

  const netProfit = data?.net_profit || 0;
  const isProfit = netProfit >= 0;

  return (
    <>
      <div className="p-6 md:p-10 space-y-6 animate-fade-up">
        <Link to="/reports" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group">
          <span className="p-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg group-hover:border-[var(--accent-primary)]/40 transition-colors"><ArrowLeftIcon className="w-4 h-4" /></span>
          <ChartBarIcon className="w-3.5 h-3.5" /> Back to Reports
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">Profit &amp; Loss Statement</h1>
          <p className="text-[var(--text-secondary)] text-sm">Income statement showing revenue, expenses, and net profit.</p>
        </div>

        <StockWarningBanner inventory={data?.inventory} />

        {/* Date Filters */}
        <div className="bento-card p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">From</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">To</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] outline-none" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bento-card p-8 text-center text-[var(--text-muted)] font-medium">Loading...</div>
        ) : !data ? (
          <div className="bento-card p-8 text-center text-[var(--text-muted)] font-medium">No data available.</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bento-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-[var(--status-success)]/10">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-[var(--status-success)]" />
                  </div>
                  <span className="text-[var(--text-secondary)] text-sm">Total Revenue</span>
                </div>
                <div className="text-2xl font-bold text-[var(--status-success)]">{getCurrencySymbol()}{fmt(data.revenue?.total)}</div>
              </div>
              <div className="bento-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-[var(--status-danger)]/10">
                    <ArrowTrendingDownIcon className="w-5 h-5 text-[var(--status-danger)]" />
                  </div>
                  <span className="text-[var(--text-secondary)] text-sm">Total Expenses</span>
                </div>
                <div className="text-2xl font-bold text-[var(--status-danger)]">{getCurrencySymbol()}{fmt(data.expenses?.total)}</div>
              </div>
              <div className="bento-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${isProfit ? 'bg-[var(--status-success)]/10' : 'bg-[var(--status-danger)]/10'}`}>
                    {isProfit ? <ArrowTrendingUpIcon className="w-5 h-5 text-[var(--status-success)]" /> : <ArrowTrendingDownIcon className="w-5 h-5 text-[var(--status-danger)]" />}
                  </div>
                  <span className="text-[var(--text-secondary)] text-sm">Net {isProfit ? 'Profit' : 'Loss'}</span>
                </div>
                <div className={`text-2xl font-bold ${isProfit ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'}`}>
                  {getCurrencySymbol()}{fmt(Math.abs(netProfit))}
                </div>
                <div className="text-xs text-[var(--text-muted)] font-medium mt-1">Margin: {data.profit_margin}%</div>
              </div>
            </div>

            {/* Revenue Details */}
            <div className="bento-card p-0 overflow-hidden">
              <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                <h3 className="text-[var(--text-primary)] font-semibold flex items-center gap-2">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-[var(--status-success)]" /> Revenue
                </h3>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                    <th className="p-4 font-medium">Account</th>
                    <th className="p-4 font-medium">Code</th>
                    <th className="p-4 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]/50">
                  {data.revenue?.items?.length === 0 ? (
                    <tr><td colSpan="3" className="p-4 text-center text-[var(--text-muted)] font-medium text-sm">No revenue entries</td></tr>
                  ) : (
                    data.revenue?.items?.map((item, i) => (
                      <tr key={i} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                        <td className="p-4 text-[var(--text-primary)] text-sm">{item.name}</td>
                        <td className="p-4 text-[var(--text-secondary)] text-sm font-mono">{item.code}</td>
                        <td className="p-4 text-right text-[var(--status-success)] font-semibold">{getCurrencySymbol()}{fmt(item.amount)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-[var(--bg-primary)]/50 font-semibold">
                    <td colSpan="2" className="p-4 text-[var(--text-primary)]">Total Revenue</td>
                    <td className="p-4 text-right text-[var(--status-success)]">{getCurrencySymbol()}{fmt(data.revenue?.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Expenses Details */}
            <div className="bento-card p-0 overflow-hidden">
              <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                <h3 className="text-[var(--text-primary)] font-semibold flex items-center gap-2">
                  <ArrowTrendingDownIcon className="w-4 h-4 text-[var(--status-danger)]" /> Expenses
                </h3>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                    <th className="p-4 font-medium">Account</th>
                    <th className="p-4 font-medium">Code</th>
                    <th className="p-4 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]/50">
                  {data.expenses?.items?.length === 0 ? (
                    <tr><td colSpan="3" className="p-4 text-center text-[var(--text-muted)] font-medium text-sm">No expense entries</td></tr>
                  ) : (
                    data.expenses?.items?.map((item, i) => (
                      <tr key={i} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                        <td className="p-4 text-[var(--text-primary)] text-sm">{item.name}</td>
                        <td className="p-4 text-[var(--text-secondary)] text-sm font-mono">{item.code}</td>
                        <td className="p-4 text-right text-[var(--status-danger)] font-semibold">{getCurrencySymbol()}{fmt(item.amount)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-[var(--bg-primary)]/50 font-semibold">
                    <td colSpan="2" className="p-4 text-[var(--text-primary)]">Total Expenses</td>
                    <td className="p-4 text-right text-[var(--status-danger)]">{getCurrencySymbol()}{fmt(data.expenses?.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {data.inventory && (
              <div className="bento-card p-4 text-sm text-[var(--text-secondary)] space-y-1">
                <div>Opening stock {getCurrencySymbol()}{fmt(data.inventory.opening_stock)} · Closing stock {getCurrencySymbol()}{fmt(data.inventory.closing_stock)} · Change {getCurrencySymbol()}{fmt(data.inventory.change)}</div>
                <div className="text-xs text-[var(--text-muted)]">{data.inventory.valuation}</div>
                {data.memo?.cogs_estimate != null && (
                  <div className="text-xs text-[var(--text-muted)]">Memo (not in totals): cost of goods sold estimate {getCurrencySymbol()}{fmt(data.memo.cogs_estimate)}</div>
                )}
              </div>
            )}

            {/* Net Result */}
            <div className={`bento-card p-5 border ${isProfit ? 'border-[var(--status-success)]/30' : 'border-[var(--status-danger)]/30'}`}>
              <div className="flex justify-between items-center">
                <div className="text-lg font-bold text-[var(--text-primary)]">Net {isProfit ? 'Profit' : 'Loss'}</div>
                <div className={`text-2xl font-bold ${isProfit ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'}`}>
                  {getCurrencySymbol()}{fmt(Math.abs(netProfit))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
