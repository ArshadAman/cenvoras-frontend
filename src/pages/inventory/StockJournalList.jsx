import React, { useState } from "react"; // Fixed import path
import { useQuery } from "@tanstack/react-query";
import { getStockJournals } from "../../api/stock_journal";
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import StockJournalForm from "../../components/inventory/StockJournalForm";
import StockJournalDetailsModal from "../../components/inventory/StockJournalDetailsModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useResizableColumns from "../../hooks/useResizableColumns";
import { LIST_THEAD, LIST_TH } from "../../components/common/tableHeaderClasses";

const DEFAULT_COLUMN_WIDTHS = {
  voucher: 180,
  type: 140,
  warehouse: 160,
  items: 90,
  notes: 220,
};

export default function StockJournalList() {
  const [showForm, setShowForm] = useState(false);
  const [viewDetailsJournal, setViewDetailsJournal] = useState(null);
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { colWidths, renderResizeHandle } = useResizableColumns(
    "cenvoras_stock_journal_list_col_widths",
    DEFAULT_COLUMN_WIDTHS
  );

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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">Stock Journals</h1>
            <p className="text-[var(--text-muted)] text-sm">Inventory adjustments, write-offs, and transfers.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <PlusIcon className="w-4 h-4" /> New Adjustment
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                    type="text"
                    placeholder="Search by ID, Product, or Voucher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
                <input 
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                    title="From Date"
                />
                <span className="text-[var(--text-muted)]">-</span>
                <input 
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                    title="To Date"
                />
                {(searchTerm || dateFrom || dateTo) && (
                    <button 
                        onClick={() => { setSearchTerm(''); setDateFrom(''); setDateTo(''); }}
                        className="text-xs text-[var(--accent-primary)] hover:opacity-80 px-2"
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed divide-y divide-[var(--border-subtle)] cursor-pointer">
              <colgroup>
                <col style={{ width: `${colWidths.voucher}px` }} />
                <col style={{ width: `${colWidths.type}px` }} />
                <col style={{ width: `${colWidths.warehouse}px` }} />
                <col style={{ width: `${colWidths.items}px` }} />
                <col style={{ width: `${colWidths.notes}px` }} />
              </colgroup>
              <thead className={LIST_THEAD}>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className={LIST_TH}>
                    Date / Voucher
                    {renderResizeHandle("voucher")}
                  </th>
                  <th className={LIST_TH}>
                    Type
                    {renderResizeHandle("type")}
                  </th>
                  <th className={LIST_TH}>
                    Warehouse
                    {renderResizeHandle("warehouse")}
                  </th>
                  <th className={LIST_TH}>
                    Items
                    {renderResizeHandle("items")}
                  </th>
                  <th className={LIST_TH}>
                    Notes
                    {renderResizeHandle("notes")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {isLoading ? (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-[var(--text-muted)] text-sm">Loading stock journals...</td></tr>
                ) : journals.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-[var(--text-muted)] text-sm">No journals found matching filters.</td></tr>
                ) : (
                    journals.map((j) => (
                    <tr key={j.id} className="hover:bg-[var(--bg-primary)] transition-colors" onClick={() => setViewDetailsJournal(j)}>
                        <td className="px-6 py-4">
                            <div className="text-[var(--text-primary)] font-semibold text-sm">{j.date}</div>
                            <div className="text-xs text-[var(--text-muted)]">{j.voucher_no || j.id.slice(0,8)}</div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase
                                ${['excess', 'internal_return'].includes(j.adjustment_type) ? 'bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success-border)]' : 'bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger-border)]'}
                            `}>
                                {j.adjustment_type.replace('_', ' ')}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">{j.warehouse_name}</td>
                        <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">
                            {j.items?.length || 0} items
                            <div className="text-xs text-[var(--text-muted)] mt-0.5">
                                {j.items?.[0]?.product_name} {j.items?.length > 1 ? `+${j.items.length - 1} more` : ''}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-[var(--text-muted)] text-sm max-w-xs truncate">{j.notes}</td>
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
      
      
    </>
  );
}
