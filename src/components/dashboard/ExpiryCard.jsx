import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/api';
import { ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
        className={`bento-card !p-6 flex flex-col justify-between group hover:border-white/20 transition-all cursor-pointer hover:scale-[1.02]`}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
            <ClockIcon className="w-6 h-6" />
          </div>
          {count > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold animate-pulse">
              ⚠ ACTION
            </span>
          )}
        </div>
        <div>
          <div className="text-2xl font-bold text-white mb-1 tracking-tight">
            {isLoading ? '—' : count}
          </div>
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            Expiring in {days} days
          </div>
          {count > 0 && (
            <div className="text-xs text-orange-400 mt-1 font-medium">
              ₹{Number(totalValue).toLocaleString('en-IN')} at risk
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-3xl max-h-[80vh] overflow-y-auto bg-[#111] border border-white/10 rounded-2xl shadow-2xl shadow-orange-900/20 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-orange-500/5 to-red-500/5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-orange-400" />
                  Products Expiring Soon
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {count} batches · Total value at risk: ₹{Number(totalValue).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Days Filter */}
            <div className="px-6 py-3 border-b border-white/5 flex items-center gap-2">
              <span className="text-xs text-gray-500 mr-1">Show expiring in:</span>
              {DAY_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    days === d
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {items.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  <ClockIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No products expiring within {days} days
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-white/[0.03] border-b border-white/10">
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Batch</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Expiry Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Days Left</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                        <td className="px-6 py-3 text-white font-medium">{item.product_name}</td>
                        <td className="px-6 py-3 text-gray-400 font-mono text-xs">{item.batch_number}</td>
                        <td className="px-6 py-3 text-gray-300">{item.expiry_date}</td>
                        <td className="px-6 py-3">
                          <span className={`font-bold ${
                            item.days_left < 0 ? 'text-red-400' :
                            item.days_left <= 7 ? 'text-red-400 animate-pulse' :
                            'text-orange-400'
                          }`}>
                            {item.days_left < 0 ? `${Math.abs(item.days_left)}d overdue` : `${item.days_left}d`}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-300">{item.quantity}</td>
                        <td className="px-6 py-3 text-orange-400 font-bold">₹{Number(item.value).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
