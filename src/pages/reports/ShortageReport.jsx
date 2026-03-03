import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getShortageReport } from "../../api/reports";
import Layout from "../../components/Layout";
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Link } from "react-router-dom";

export default function ShortageReport() {
  const { data, isLoading } = useQuery({
    queryKey: ["shortageReport"],
    queryFn: getShortageReport,
  });

  const results = data?.results || [];

  return (
    <Layout>
      <div className="p-6 md:p-10 animate-fade-up">
        <Link to="/reports" className="flex items-center text-gray-400 hover:text-white mb-6">
            <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Reports
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">Shortage Management</h1>
                <p className="text-sm text-gray-400">Products below their low-stock alert threshold.</p>
            </div>
            
            {data && (
              <div className="flex gap-4">
                <div className="text-right px-4 border-r border-white/10">
                  <p className="text-xs text-gray-400 uppercase font-bold">Total Items</p>
                  <p className="text-xl font-bold text-orange-400">{data.count}</p>
                </div>
                <div className="text-right px-4">
                  <p className="text-xs text-gray-400 uppercase font-bold">Out of Stock</p>
                  <p className="text-xl font-bold text-red-400">{data.critical_count}</p>
                </div>
              </div>
            )}
        </div>

        <div className="bento-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Product</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Current Stock</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Alert Level</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Deficit</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Unit</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Severity</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading shortage data...</td></tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">🎉</span>
                        <span>All products are above their low-stock thresholds!</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  results.map((item, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm text-white font-medium">{item.product_name}</td>
                      <td className={`p-4 text-sm font-bold text-right ${item.current_stock === 0 ? 'text-red-400' : 'text-orange-400'}`}>
                        {item.current_stock}
                      </td>
                      <td className="p-4 text-sm text-gray-300 text-right">{item.alert_threshold}</td>
                      <td className="p-4 text-sm text-red-400 font-bold text-right">-{item.deficit}</td>
                      <td className="p-4 text-sm text-gray-400">{item.unit}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            item.severity === 'critical' ? 'bg-red-500/20 text-red-400' 
                            : item.severity === 'high' ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-yellow-500/20 text-yellow-400'
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
    </Layout>
  );
}
