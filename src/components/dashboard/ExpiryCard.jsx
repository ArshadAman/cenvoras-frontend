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
        className="bg-obsidian-card border border-hairline rounded-2xl p-5 sm:p-6 flex flex-col justify-between group hover:border-hairline-hover transition-all cursor-pointer shadow-lg shadow-black/20"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ClockIcon className="w-6 h-6" />
          </div>
          {count > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 animate-pulse">
              ⚠ ACTION
            </span>
          )}
        </div>
        <div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-1 tracking-tight font-mono font-tabular">
            {isLoading ? '—' : count}
          </div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            Expiring in {days} days
          </div>
          {count > 0 && (
            <div className="text-xs text-amber-400 mt-1 font-medium font-mono">
              {getCurrencySymbol()}{Number(totalValue).toLocaleString('en-IN')} at risk
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden bg-obsidian-card border border-hairline rounded-2xl shadow-2xl shadow-amber-950/30 flex flex-col animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-hairline bg-gradient-to-r from-amber-500/10 to-orange-500/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ClockIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Products Expiring Soon
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {count} {count === 1 ? 'batch' : 'batches'} · Value at risk: <span className="text-amber-300 font-semibold font-mono">{getCurrencySymbol()}{Number(totalValue).toLocaleString('en-IN')}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Days Filter */}
            <div className="px-6 py-3 border-b border-hairline bg-white/[0.02] flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 mr-1 font-medium">Show expiring in:</span>
              {DAY_OPTIONS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    days === d
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1 custom-scrollbar">
              {items.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <ClockIcon className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-400" />
                  No products expiring within {days} days
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-white/[0.03] border-b border-hairline">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Batch</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Expiry Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Days Left</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Qty</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-6 py-3 text-white font-medium">{item.product_name}</td>
                        <td className="px-6 py-3 text-slate-400 font-mono text-xs">{item.batch_number}</td>
                        <td className="px-6 py-3 text-slate-300">{item.expiry_date}</td>
                        <td className="px-6 py-3">
                          <span className={`font-bold ${
                            item.days_left < 0 ? 'text-rose-400' :
                            item.days_left <= 7 ? 'text-rose-400 animate-pulse' :
                            'text-amber-400'
                          }`}>
                            {item.days_left < 0 ? `${Math.abs(item.days_left)}d overdue` : `${item.days_left}d`}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right text-slate-300 font-mono">{item.quantity}</td>
                        <td className="px-6 py-3 text-right text-amber-400 font-bold font-mono">
                          {getCurrencySymbol()}{Number(item.value).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white/[0.02] border-t border-hairline flex justify-between items-center">
              <div className="text-xs text-slate-400">
                Total at risk: <span className="text-white font-semibold font-mono">{getCurrencySymbol()}{Number(totalValue).toLocaleString('en-IN')}</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-colors border border-hairline"
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
