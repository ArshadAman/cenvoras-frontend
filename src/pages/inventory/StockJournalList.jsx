import React, { useState } from "react"; // Fixed import path
import { useQuery } from "@tanstack/react-query";
import { getStockJournals } from "../../api/stock_journal";
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import StockJournalForm from "../../components/inventory/StockJournalForm";
import StockJournalDetailsModal from "../../components/inventory/StockJournalDetailsModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function StockJournalList() {
  const [showForm, setShowForm] = useState(false);
  const [viewDetailsJournal, setViewDetailsJournal] = useState(null);
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const queryParams = {
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(dateFrom && { date_from: dateFrom }),
      ...(dateTo && { date_to: dateTo }),
  };

  const { data: journalsResult, isLoading } = useQuery({ 
      queryKey: ["stock-journals", queryParams], 
      queryFn: () => getStockJournals(queryParams) 
  });
  
  const journals = Array.isArray(journalsResult) ? journalsResult : journalsResult?.data || journalsResult?.results || [];

  return (
    <>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Stock Journals</h1>
            <p className="text-gray-400 text-sm">Inventory adjustments, write-offs, and transfers.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" /> New Adjustment
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search by ID, Product, or Voucher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
                <input 
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    title="From Date"
                />
                <span className="text-gray-500">-</span>
                <input 
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    title="To Date"
                />
                {(searchTerm || dateFrom || dateTo) && (
                    <button 
                        onClick={() => { setSearchTerm(''); setDateFrom(''); setDateTo(''); }}
                        className="text-xs text-gray-400 hover:text-white px-2"
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>

        <div className="bento-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left cursor-pointer">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs uppercase bg-white/5">
                  <th className="p-4 font-medium">Date / Voucher</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Warehouse</th>
                  <th className="p-4 font-medium">Items</th>
                  <th className="p-4 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
                ) : journals.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No journals found matching filters.</td></tr>
                ) : (
                    journals.map((j) => (
                    <tr key={j.id} className="hover:bg-white/5 transition-colors" onClick={() => setViewDetailsJournal(j)}>
                        <td className="p-4">
                            <div className="text-white font-medium">{j.date}</div>
                            <div className="text-xs text-gray-500">{j.voucher_no || j.id.slice(0,8)}</div>
                        </td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium uppercase
                                ${['excess', 'internal_return'].includes(j.adjustment_type) ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
                            `}>
                                {j.adjustment_type.replace('_', ' ')}
                            </span>
                        </td>
                        <td className="p-4 text-gray-300">{j.warehouse_name}</td>
                        <td className="p-4 text-gray-400 text-sm">
                            {j.items?.length || 0} items
                            <div className="text-xs text-gray-600 mt-0.5">
                                {j.items?.[0]?.product_name} {j.items?.length > 1 ? `+${j.items.length - 1} more` : ''}
                            </div>
                        </td>
                        <td className="p-4 text-gray-500 text-sm max-w-xs truncate">{j.notes}</td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <StockJournalForm isOpen={showForm} onClose={() => setShowForm(false)} />
      )}
      
      <StockJournalDetailsModal 
        isOpen={!!viewDetailsJournal} 
        onClose={() => setViewDetailsJournal(null)} 
        journal={viewDetailsJournal} 
      />
      
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="dark" />
    </>
  );
}
