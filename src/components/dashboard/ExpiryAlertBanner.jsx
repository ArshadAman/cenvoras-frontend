import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/api';
import { 
  ClockIcon, 
  XMarkIcon, 
  ExclamationTriangleIcon, 
  ArrowRightIcon, 
  EyeIcon 
} from '@heroicons/react/24/outline';
import { getCurrencySymbol } from '../../utils/currency';

const DAY_OPTIONS = [7, 14, 30, 60, 90];

export default function ExpiryAlertBanner() {
  const navigate = useNavigate();
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

  // If loading or no batches are expiring, do not show the banner to keep UI clean
  if (isLoading || count === 0) {
    return null;
  }

  return (
    <>
      {/* Top-Level Expiry Alert Ribbon */}
      <aside aria-label="Expiry alerts" className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-black/20 animate-fade-down">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0 animate-pulse">
            <ClockIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold tracking-wider uppercase border border-amber-500/40">
                Action Required
              </span>
              <h2 className="text-sm font-bold text-white">
                {count} {count === 1 ? 'batch' : 'batches'} expiring within {days} days
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Estimated inventory at risk: <span className="font-bold text-amber-300 font-mono font-tabular">{getCurrencySymbol()}{Number(totalValue).toLocaleString('en-IN')}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <EyeIcon className="w-4 h-4" /> View Expiring Batches
          </button>
          <button
            type="button"
            onClick={() => navigate('/reports/expiry')}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-hairline hover:text-white transition-all flex items-center gap-1 active:scale-95"
          >
            Detailed Report <ArrowRightIcon className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </aside>

      {/* Detail Breakdown Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden bg-obsidian-card border border-hairline rounded-2xl shadow-2xl shadow-amber-950/30 flex flex-col animate-fade-up">
            {/* Modal Header */}
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

            {/* Days Filter Pills */}
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    navigate('/reports/expiry');
                  }}
                  className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg transition-colors border border-amber-500/40"
                >
                  Open Full Expiry Report
                </button>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-colors border border-hairline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
