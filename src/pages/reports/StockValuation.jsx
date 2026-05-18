import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getStockValuation } from "../../api/reports";
import Layout from "../../components/Layout";
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from "react-router-dom";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

export default function StockValuation() {
  const { data, isLoading } = useQuery({
    queryKey: ["stockValuation"],
    queryFn: getStockValuation,
  });

  return (
    <Layout>
      <div className="p-6 md:p-10 animate-fade-up">
        <Link to="/reports" className="flex items-center text-gray-400 hover:text-white mb-6">
            <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Reports
        </Link>
        
        <div className="flex justify-between items-end mb-6">
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">Stock Valuation</h1>
                <p className="text-sm text-gray-400">Inventory value based on weighted average cost.</p>
            </div>
            {data && (
                <div className="text-right">
                    <p className="text-sm text-gray-400 uppercase font-bold">Total Value</p>
                    <p className="text-3xl font-black text-green-400">{getCurrencySymbol()}{Number(data.total_value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                <small className="mt-1 block text-xs text-gray-500">excluding GST</small>
                </div>
            )}
        </div>

        <div className="bento-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Product</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Stock</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Avg Cost</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading valuation...</td></tr>
                ) : data?.items?.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-gray-500">No stock found.</td></tr>
                ) : (
                  data?.items?.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm text-white font-medium">{item.name}</td>
                      <td className="p-4 text-sm text-gray-300 text-right">{item.stock}</td>
                      <td className="p-4 text-sm text-gray-300 text-right">{getCurrencySymbol()}{Number(item.avg_cost).toFixed(2)}</td>
                      <td className="p-4 text-sm text-green-400 font-bold text-right">{getCurrencySymbol()}{Number(item.total_value).toLocaleString('en-IN')}</td>
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
