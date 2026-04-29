import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import Layout from '../components/Layout';
import { ShieldCheckIcon, ExclamationTriangleIcon, ClockIcon, XCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', icon: ShieldCheckIcon },
  warning: { label: 'Expiring Soon', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: ExclamationTriangleIcon },
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: ClockIcon },
  expired: { label: 'Expired', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20', icon: XCircleIcon },
};

export default function Warranty() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['warranty-report', search],
    queryFn: () => api.get('/inventory/reports/warranty/', { params: search ? { search } : {} }).then(res => res.data),
  });

  const stats = data || { count: 0, active_count: 0, warning_count: 0, critical_count: 0, expired_count: 0, results: [] };
  const items = stats.results || [];

  const filteredItems = filter === 'all' ? items : items.filter(i => i.status === filter);

  return (
    <Layout>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
            <ShieldCheckIcon className="w-8 h-8 text-cyan-400" />
            Warranty Tracker
          </h1>
          <p className="text-gray-400 text-sm">Track warranty status for all sold products</p>
        </div>

        <div className="bento-card !p-4 flex items-center gap-3">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number or customer name"
            className="w-full bg-transparent text-white placeholder-gray-500 outline-none"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="text-xs text-cyan-400 hover:text-cyan-300">
              Clear
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active', count: stats.active_count, color: 'text-green-400', bg: 'from-green-500/10 to-green-600/5' },
            { label: 'Expiring Soon', count: stats.warning_count, color: 'text-yellow-400', bg: 'from-yellow-500/10 to-yellow-600/5' },
            { label: 'Critical', count: stats.critical_count, color: 'text-red-400', bg: 'from-red-500/10 to-red-600/5' },
            { label: 'Expired', count: stats.expired_count, color: 'text-gray-400', bg: 'from-gray-500/10 to-gray-600/5' },
          ].map(card => (
            <div key={card.label} className={`bento-card !p-5 bg-gradient-to-br ${card.bg}`}>
              <div className={`text-3xl font-bold ${card.color} mb-1`}>{isLoading ? '—' : card.count}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {['all', 'active', 'warning', 'critical', 'expired'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === tab
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-900/30'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              {tab === 'all' ? 'All' : STATUS_CONFIG[tab]?.label || tab}
            </button>
          ))}
        </div>

        {/* Warranty Table */}
        <div className="bento-card !p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Loading warranty data...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <ShieldCheckIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No warranty records found</p>
              <p className="text-xs mt-1 text-gray-600">Warranty tracking starts when you sell products that have a warranty duration set</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/10">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Warranty Period</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Start</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">End</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Countdown</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, idx) => {
                    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;
                    const Icon = cfg.icon;
                    return (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                        <td className="px-6 py-4 text-white font-medium">{item.product_name}</td>
                        <td className="px-6 py-4 text-gray-300">{item.customer_name}</td>
                        <td className="px-6 py-4 text-gray-400 font-mono text-xs">{item.invoice_number}</td>
                        <td className="px-6 py-4 text-gray-300">{item.warranty_months} months</td>
                        <td className="px-6 py-4 text-gray-400">{item.warranty_start}</td>
                        <td className="px-6 py-4 text-gray-400">{item.warranty_end}</td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${cfg.color}`}>
                            {item.countdown}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
