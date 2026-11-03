import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getStockValuation } from "../../api/reports";
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from "react-router-dom";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

export default function StockValuation() {
  const { data, isLoading } = useQuery({
    queryKey: ["stockValuation"],
    queryFn: getStockValuation,
  });

  return (
    <>
      <div className="p-6 md:p-10 animate-fade-up">
        <Link to="/reports" className="flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors">
            <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Reports
        </Link>
        
        <div className="flex justify-between items-end mb-6">
            <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Stock Valuation</h1>
                <p className="text-sm text-[var(--text-secondary)]">Inventory value based on weighted average cost.</p>
            </div>
            {data && (
                <div className="text-right">
                    <p className="text-sm text-[var(--text-secondary)] uppercase font-bold">Total Value</p>
                    <p className="text-3xl font-black text-[var(--status-success)]">{getCurrencySymbol()}{Number(data.total_value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                <small className="mt-1 block text-xs text-[var(--text-muted)]">excluding GST</small>
                </div>
            )}
        </div>

        <div className="bento-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Product</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Stock</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Avg Cost</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="4" className="p-8 text-center text-[var(--text-muted)]">Loading valuation...</td></tr>
                ) : data?.items?.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-[var(--text-muted)]">No stock found.</td></tr>
                ) : (
                  data?.items?.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="p-4 text-sm text-[var(--text-primary)] font-medium">{item.name}</td>
                      <td className="p-4 text-sm text-[var(--text-secondary)] text-right">{item.stock}</td>
                      <td className="p-4 text-sm text-[var(--text-secondary)] text-right">{getCurrencySymbol()}{Number(item.avg_cost).toFixed(2)}</td>
                      <td className="p-4 text-sm text-[var(--status-success)] font-bold text-right">{getCurrencySymbol()}{Number(item.total_value).toLocaleString('en-IN')}</td>
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
