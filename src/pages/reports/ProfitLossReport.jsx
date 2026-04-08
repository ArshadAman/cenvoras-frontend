import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProfitLoss } from "../../api/reports";
import Layout from "../../components/Layout";
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from "react-router-dom";
import { format, subDays } from "date-fns";

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
    <Layout>
      <div className="p-6 md:p-10 animate-fade-up">
        <Link to="/reports" className="flex items-center text-gray-400 hover:text-white mb-6">
            <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Reports
        </Link>
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">Item-Wise Profit & Loss</h1>
                <p className="text-sm text-gray-400">Gross profit analysis based on Sales Revenue - COGS.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-end gap-4">
                 <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10">
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent text-white text-sm outline-none"
                    />
                    <span className="text-gray-500">-</span>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent text-white text-sm outline-none"
                    />
                 </div>
                 
                 {summary.total_revenue !== undefined && (
                    <div className="flex gap-4">
                        <div className="text-right px-4 border-r border-white/10">
                            <p className="text-xs text-gray-400 uppercase font-bold">Revenue</p>
                            <p className="text-xl font-bold text-white">₹{Number(summary.total_revenue).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="text-right px-4 border-r border-white/10">
                            <p className="text-xs text-gray-400 uppercase font-bold">COGS</p>
                            <p className="text-xl font-bold text-gray-400">₹{Number(summary.total_cost).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="text-right px-4">
                            <p className="text-xs text-gray-400 uppercase font-bold">Profit ({summary.overall_margin_pct}%)</p>
                            <p className={`text-xl font-bold ${summary.total_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ₹{Number(summary.total_profit).toLocaleString('en-IN')}
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
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Product</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Qty Sold</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Revenue</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">COGS</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Gross Profit</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading financial data...</td></tr>
                ) : results.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">No sales found in this period.</td></tr>
                ) : (
                  results.map((item, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm text-white font-medium">{item.product_name}</td>
                      <td className="p-4 text-sm text-gray-300 text-right">{item.qty_sold} {item.unit}</td>
                      <td className="p-4 text-sm text-gray-300 text-right">₹{Number(item.revenue).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                      <td className="p-4 text-sm text-gray-300 text-right">₹{Number(item.cost).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                      <td className={`p-4 text-sm font-bold text-right ${item.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ₹{Number(item.profit).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                      </td>
                      <td className={`p-4 text-sm font-medium text-right ${item.margin_pct >= 20 ? 'text-green-400' : item.margin_pct >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
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
    </Layout>
  );
}
