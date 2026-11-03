import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProfitLoss } from "../../api/reports";
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from "react-router-dom";
import { format, subDays } from "date-fns";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

export default function ProfitLossReport() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data, isLoading } = useQuery({
    queryKey: ["plReport", startDate, endDate],
    queryFn: () => getProfitLoss(startDate, endDate),
  });

  const results = data?.results || [];
  const summary = data?.summary || {};

  return (
    <>
      <div className="p-6 md:p-10 animate-fade-up">
        <Link to="/reports" className="flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors">
            <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Reports
        </Link>
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Item-Wise Profit & Loss</h1>
                <p className="text-sm text-[var(--text-secondary)]">Gross profit analysis based on Sales Revenue - COGS.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-end gap-4">
                 <div className="flex items-center gap-2 bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--border-subtle)]">
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent text-[var(--text-primary)] text-sm outline-none px-1"
                    />
                    <span className="text-[var(--text-muted)]">-</span>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent text-[var(--text-primary)] text-sm outline-none px-1"
                    />
                 </div>
                 
                 {summary.total_revenue !== undefined && (
                    <div className="flex gap-4">
                        <div className="text-right px-4 border-r border-[var(--border-subtle)]">
                            <p className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider">Revenue</p>
                            <p className="text-xl font-bold text-[var(--text-primary)]">{getCurrencySymbol()}{Number(summary.total_revenue).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="text-right px-4 border-r border-[var(--border-subtle)]">
                            <p className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider">COGS</p>
                            <p className="text-xl font-bold text-[var(--text-secondary)]">{getCurrencySymbol()}{Number(summary.total_cost).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="text-right px-4">
                            <p className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider">Profit ({summary.overall_margin_pct}%)</p>
                            <p className={`text-xl font-bold ${summary.total_profit >= 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'}`}>
                                {getCurrencySymbol()}{Number(summary.total_profit).toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                 )}
            </div>
        </div>

        <div className="bento-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Product</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Qty Sold</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Revenue</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">COGS</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Gross Profit</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="p-8 text-center text-[var(--text-muted)]">Loading financial data...</td></tr>
                ) : results.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-[var(--text-muted)]">No sales found in this period.</td></tr>
                ) : (
                  results.map((item, idx) => (
                    <tr key={idx} className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="p-4 text-sm text-[var(--text-primary)] font-medium">{item.product_name}</td>
                      <td className="p-4 text-sm text-[var(--text-secondary)] text-right">{item.qty_sold} {item.unit}</td>
                      <td className="p-4 text-sm text-[var(--text-secondary)] text-right">{getCurrencySymbol()}{Number(item.revenue).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                      <td className="p-4 text-sm text-[var(--text-secondary)] text-right">{getCurrencySymbol()}{Number(item.cost).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                      <td className={`p-4 text-sm font-bold text-right ${item.profit >= 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'}`}>
                        {getCurrencySymbol()}{Number(item.profit).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                      </td>
                      <td className={`p-4 text-sm font-semibold text-right ${item.margin_pct >= 20 ? 'text-[var(--status-success)]' : item.margin_pct >= 0 ? 'text-[var(--status-warning)]' : 'text-[var(--status-danger)]'}`}>
                        {item.margin_pct}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
