import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getExpiryReport } from "../../api/reports";
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Link } from "react-router-dom";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

export default function ExpiryReport() {
  const [days, setDays] = useState(90);
  
  const { data, isLoading } = useQuery({
    queryKey: ["expiryReport", days],
    queryFn: () => getExpiryReport(days),
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
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-1">Expiry Stock Report</h1>
                <p className="text-sm text-[var(--text-secondary)]">Batches expiring within the selected timeframe.</p>
            </div>
            
            <div className="flex items-center gap-4">
              {data && (
                <div className="text-right">
                  <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Value at Risk</p>
                  <p className="text-xl font-bold text-[var(--status-danger)]">{getCurrencySymbol()}{Number(data.total_value_at_risk || 0).toLocaleString('en-IN')}</p>
                </div>
              )}
              <div className="flex items-center gap-3 bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--border-subtle)]">
                <span className="text-sm text-[var(--text-secondary)]">Show expiring in:</span>
                <select 
                    value={days} 
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none"
                >
                    <option value="30" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">30 Days</option>
                    <option value="60" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">60 Days</option>
                    <option value="90" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">90 Days</option>
                    <option value="180" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">6 Months</option>
                    <option value="365" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">1 Year</option>
                </select>
              </div>
            </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase">Product</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase">Batch No</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase">Expiry Date</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase text-right">Days Left</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase text-right">Qty</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase text-right">Value ({getCurrencySymbol()})</th>
                  <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {isLoading ? (
                  <tr><td colSpan="7" className="p-8 text-center text-[var(--text-muted)]">Loading report...</td></tr>
                ) : results.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-[var(--text-muted)]">No expiring batches found in this window.</td></tr>
                ) : (
                  results.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="p-4 text-sm text-[var(--text-primary)] font-medium">{item.product_name}</td>
                      <td className="p-4 text-sm text-[var(--accent-primary)] font-mono">{item.batch_number}</td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">{item.expiry_date}</td>
                      <td className={`p-4 text-sm font-bold text-right ${item.days_until_expiry < 0 ? 'text-[var(--status-danger)]' : item.days_until_expiry <= 30 ? 'text-[var(--status-warning)]' : 'text-[var(--status-warning)]'}`}>
                        {item.days_until_expiry < 0 ? `${Math.abs(item.days_until_expiry)}d ago` : `${item.days_until_expiry}d`}
                      </td>
                      <td className="p-4 text-sm text-[var(--text-primary)] text-right font-medium">{item.quantity}</td>
                      <td className="p-4 text-sm text-[var(--text-secondary)] text-right font-mono">{getCurrencySymbol()}{Number(item.value).toLocaleString('en-IN')}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase ${
                            item.status === 'expired' ? 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30' 
                            : item.status === 'critical' ? 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30'
                            : 'bg-[var(--status-warning)]/10 text-[var(--status-warning)] border border-[var(--status-warning)]/20'
                        }`}>
                            {item.status}
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
