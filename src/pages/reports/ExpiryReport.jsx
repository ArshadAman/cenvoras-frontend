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
        <Link to="/reports" className="flex items-center text-gray-400 hover:text-white mb-6">
            <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Reports
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">Expiry Stock Report</h1>
                <p className="text-sm text-gray-400">Batches expiring within the selected timeframe.</p>
            </div>
            
            <div className="flex items-center gap-4">
              {data && (
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase font-bold">Value at Risk</p>
                  <p className="text-xl font-bold text-red-400">{getCurrencySymbol()}{Number(data.total_value_at_risk || 0).toLocaleString('en-IN')}</p>
                </div>
              )}
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/10">
                <span className="text-sm text-gray-400">Show expiring in:</span>
                <select 
                    value={days} 
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="bg-black border border-white/20 rounded px-2 py-1 text-white text-sm focus:ring-1 focus:ring-green-500 outline-none"
                >
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                    <option value="90">90 Days</option>
                    <option value="180">6 Months</option>
                    <option value="365">1 Year</option>
                </select>
              </div>
            </div>
        </div>

        <div className="bento-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Product</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Batch No</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Expiry Date</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Days Left</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Qty</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Value ({getCurrencySymbol()})</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-500">Loading report...</td></tr>
                ) : results.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-500">No expiring batches found in this window.</td></tr>
                ) : (
                  results.map((item, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm text-white font-medium">{item.product_name}</td>
                      <td className="p-4 text-sm text-cyan-300">{item.batch_number}</td>
                      <td className="p-4 text-sm text-gray-300">{item.expiry_date}</td>
                      <td className={`p-4 text-sm font-bold text-right ${item.days_until_expiry < 0 ? 'text-red-500' : item.days_until_expiry <= 30 ? 'text-orange-400' : 'text-yellow-500'}`}>
                        {item.days_until_expiry < 0 ? `${Math.abs(item.days_until_expiry)}d ago` : `${item.days_until_expiry}d`}
                      </td>
                      <td className="p-4 text-sm text-white text-right">{item.quantity}</td>
                      <td className="p-4 text-sm text-gray-300 text-right">{getCurrencySymbol()}{Number(item.value).toLocaleString('en-IN')}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            item.status === 'expired' ? 'bg-red-500/20 text-red-400' 
                            : item.status === 'critical' ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-yellow-500/20 text-yellow-400'
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
