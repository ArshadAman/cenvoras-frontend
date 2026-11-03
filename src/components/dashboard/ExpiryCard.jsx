import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/api';
import { ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

const DAY_OPTIONS = [7, 14, 30, 60, 90];

export default function ExpiryCard() {
  const [showModal, setShowModal] = useState(false);
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ['expiry-dashboard-summary', days],
    queryFn: () => api.get(`/inventory/reports/expiry-summary/?days=${days}`).then(res => res.data),
    staleTime: 60000,
  });

  const count = data?.count || 0;
  const totalValue = data?.total_value || 0;
  const items = data?.items || [];

  return (
    <>
      {/* Card */}
      <div
        onClick={() => setShowModal(true)}
        className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 flex flex-col justify-between group hover:border-[var(--accent-primary)]/40 transition-all cursor-pointer shadow-sm"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-xl bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/20 text-[var(--status-warning)]">
            <ClockIcon className="w-6 h-6" />
          </div>
          {count > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--status-warning)]/20 text-[var(--status-warning)] font-bold border border-[var(--status-warning)]/40 animate-pulse">
              ⚠ ACTION
            </span>
          )}
        </div>
        <div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[var(--text-primary)] mb-1 tracking-tight font-mono font-tabular">
            {isLoading ? '—' : count}
          </div>
          <div className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">
            Expiring in {days} days
          </div>
          {count > 0 && (
            <div className="text-xs text-[var(--status-warning)] mt-1 font-semibold font-mono">
              {getCurrencySymbol()}{Number(totalValue).toLocaleString('en-IN')} at risk
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl flex flex-col animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border border-[var(--status-warning-border)]">
                  <ClockIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                    Products Expiring Soon
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {count} {count === 1 ? 'batch' : 'batches'} · Value at risk: <span className="text-[var(--status-warning)] font-semibold font-mono">{getCurrencySymbol()}{Number(totalValue).toLocaleString('en-IN')}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
                title="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Days Filter */}
            <div className="px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/20 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[var(--text-muted)] mr-1 font-medium">Show expiring in:</span>
              {DAY_OPTIONS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    days === d
                      ? 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border border-[var(--status-warning-border)]'
                      : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1 custom-scrollbar">
              {items.length === 0 ? (
                <div className="p-10 text-center text-[var(--text-muted)]">
                  <ClockIcon className="w-10 h-10 mx-auto mb-2 opacity-30 text-[var(--status-warning)]" />
                  No products expiring within {days} days
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--bg-primary)]/40 border-b border-[var(--border-subtle)]">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Batch</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Expiry Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Days Left</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Qty</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[var(--bg-primary)]/30 transition-colors">
                        <td className="px-6 py-3 text-[var(--text-primary)] font-medium">{item.product_name}</td>
                        <td className="px-6 py-3 text-[var(--text-muted)] font-mono text-xs">{item.batch_number}</td>
                        <td className="px-6 py-3 text-[var(--text-secondary)]">{item.expiry_date}</td>
                        <td className="px-6 py-3">
                          <span className={`font-bold ${
                            item.days_left < 0 ? 'text-[var(--status-danger)]' :
                            item.days_left <= 7 ? 'text-[var(--status-danger)] animate-pulse' :
                            'text-[var(--status-warning)]'
                          }`}>
                            {item.days_left < 0 ? `${Math.abs(item.days_left)}d overdue` : `${item.days_left}d`}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right text-[var(--text-secondary)] font-mono">{item.quantity}</td>
                        <td className="px-6 py-3 text-right text-[var(--status-warning)] font-bold font-mono">
                          {getCurrencySymbol()}{Number(item.value).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[var(--bg-primary)]/40 border-t border-[var(--border-subtle)] flex justify-between items-center">
              <div className="text-xs text-[var(--text-muted)]">
                Total at risk: <span className="text-[var(--text-primary)] font-semibold font-mono">{getCurrencySymbol()}{Number(totalValue).toLocaleString('en-IN')}</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary px-4 py-2 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
