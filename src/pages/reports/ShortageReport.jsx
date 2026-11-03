import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getShortageReport } from "../../api/reports";
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Link } from "react-router-dom";

export default function ShortageReport() {
  const { data, isLoading } = useQuery({
    queryKey: ["shortageReport"],
    queryFn: getShortageReport,
  });

  const results = data?.results || [];

  return (
    <>
      <div className="p-6 md:p-10 animate-fade-up">
        <Link to="/reports" className="inline-flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-6 text-sm">
            <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Reports
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-1">Shortage Management</h1>
                <p className="text-sm text-[var(--text-secondary)]">Products below their low-stock alert threshold.</p>
            </div>
            
            {data && (
              <div className="flex gap-4">
                <div className="text-right px-4 border-r border-[var(--border-subtle)]">
                  <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Total Items</p>
                  <p className="text-xl font-bold text-[var(--status-warning)]">{data.count}</p>
                </div>
                <div className="text-right px-4">
                  <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Out of Stock</p>
                  <p className="text-xl font-bold text-[var(--status-danger)]">{data.critical_count}</p>
                </div>
              </div>
            )}
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase">Product</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase text-right">Current Stock</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase text-right">Alert Level</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase text-right">Deficit</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase">Unit</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {isLoading ? (
                  <tr><td colSpan="6" className="p-8 text-center text-[var(--text-muted)]">Loading shortage data...</td></tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-[var(--text-muted)]">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">🎉</span>
                        <span>All products are above their low-stock thresholds!</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  results.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="p-4 text-sm text-[var(--text-primary)] font-medium">{item.product_name}</td>
                      <td className={`p-4 text-sm font-bold text-right ${item.current_stock === 0 ? 'text-[var(--status-danger)]' : 'text-[var(--status-warning)]'}`}>
                        {item.current_stock}
                      </td>
                      <td className="p-4 text-sm text-[var(--text-secondary)] text-right">{item.alert_threshold}</td>
                      <td className="p-4 text-sm text-[var(--status-danger)] font-bold text-right">-{item.deficit}</td>
                      <td className="p-4 text-sm text-[var(--text-muted)]">{item.unit}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase ${
                            item.severity === 'critical' ? 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30' 
                            : item.severity === 'high' ? 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30'
                            : 'bg-[var(--status-warning)]/10 text-[var(--status-warning)] border border-[var(--status-warning)]/20'
                        }`}>
                            {item.severity}
                        </span>
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
