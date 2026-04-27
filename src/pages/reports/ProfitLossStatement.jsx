import React, { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { useQuery } from "@tanstack/react-query";
import { getProfitLossStatement } from "../../api/gst";
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const today = new Date().toLocaleDateString('sv-SE');
const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
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
    <Layout>
      <div className="p-6 md:p-10 space-y-6 animate-fade-up">
        <Link to="/reports" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group">
          <span className="p-1.5 bg-white/5 border border-white/10 rounded-lg group-hover:bg-white/10 transition-colors"><ArrowLeftIcon className="w-4 h-4" /></span>
          <ChartBarIcon className="w-3.5 h-3.5" /> Back to Reports
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Profit &amp; Loss Statement</h1>
          <p className="text-gray-400 text-sm">Income statement showing revenue, expenses, and net profit.</p>
        </div>

        {/* Date Filters */}
        <div className="bento-card p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">From</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">To</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bento-card p-8 text-center text-gray-500">Loading...</div>
        ) : !data ? (
          <div className="bento-card p-8 text-center text-gray-500">No data available.</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bento-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-gray-400 text-sm">Total Revenue</span>
                </div>
                <div className="text-2xl font-bold text-green-400">₹{fmt(data.revenue?.total)}</div>
              </div>
              <div className="bento-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <ArrowTrendingDownIcon className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-gray-400 text-sm">Total Expenses</span>
                </div>
                <div className="text-2xl font-bold text-red-400">₹{fmt(data.expenses?.total)}</div>
              </div>
              <div className="bento-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${isProfit ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                    {isProfit ? <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-400" /> : <ArrowTrendingDownIcon className="w-5 h-5 text-rose-400" />}
                  </div>
                  <span className="text-gray-400 text-sm">Net {isProfit ? 'Profit' : 'Loss'}</span>
                </div>
                <div className={`text-2xl font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ₹{fmt(Math.abs(netProfit))}
                </div>
                <div className="text-xs text-gray-500 mt-1">Margin: {data.profit_margin}%</div>
              </div>
            </div>

            {/* Revenue Details */}
            <div className="bento-card p-0 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/5">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" /> Revenue
                </h3>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400 text-xs uppercase">
                    <th className="p-4 font-medium">Account</th>
                    <th className="p-4 font-medium">Code</th>
                    <th className="p-4 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.revenue?.items?.length === 0 ? (
                    <tr><td colSpan="3" className="p-4 text-center text-gray-500 text-sm">No revenue entries</td></tr>
                  ) : (
                    data.revenue?.items?.map((item, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-white text-sm">{item.name}</td>
                        <td className="p-4 text-gray-400 text-sm font-mono">{item.code}</td>
                        <td className="p-4 text-right text-green-400 font-semibold">₹{fmt(item.amount)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-white/5 font-semibold">
                    <td colSpan="2" className="p-4 text-white">Total Revenue</td>
                    <td className="p-4 text-right text-green-400">₹{fmt(data.revenue?.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Expenses Details */}
            <div className="bento-card p-0 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/5">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" /> Expenses
                </h3>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400 text-xs uppercase">
                    <th className="p-4 font-medium">Account</th>
                    <th className="p-4 font-medium">Code</th>
                    <th className="p-4 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.expenses?.items?.length === 0 ? (
                    <tr><td colSpan="3" className="p-4 text-center text-gray-500 text-sm">No expense entries</td></tr>
                  ) : (
                    data.expenses?.items?.map((item, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-white text-sm">{item.name}</td>
                        <td className="p-4 text-gray-400 text-sm font-mono">{item.code}</td>
                        <td className="p-4 text-right text-red-400 font-semibold">₹{fmt(item.amount)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-white/5 font-semibold">
                    <td colSpan="2" className="p-4 text-white">Total Expenses</td>
                    <td className="p-4 text-right text-red-400">₹{fmt(data.expenses?.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Net Result */}
            <div className={`bento-card p-5 border ${isProfit ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
              <div className="flex justify-between items-center">
                <div className="text-lg font-bold text-white">Net {isProfit ? 'Profit' : 'Loss'}</div>
                <div className={`text-2xl font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ₹{fmt(Math.abs(netProfit))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
