import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathRoundedSquareIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import {
  convertQuotationToSalesOrder,
  deleteQuotation,
  getQuotations,
  updateQuotation,
} from '../../api/quotation';
import QuotationConvertModal from './QuotationConvertModal';
import { getCurrencySymbol } from '../../utils/currency';
import EmptyState from '../common/EmptyState';

export default function QuotationTable({ onEdit, onView, onAddNewQuotation }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [convertTarget, setConvertTarget] = useState(null);
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', search, status],
    queryFn: () => getQuotations({ search, status }),
  });

  const rows = Array.isArray(data) ? data : data?.results || data?.data || [];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let valA = '';
      let valB = '';
      if (sortField === 'number') {
        valA = a.quotation_number || a.invoice_number || '';
        valB = b.quotation_number || b.invoice_number || '';
      } else if (sortField === 'date') {
        const timeA = new Date(a.quotation_date || a.invoice_date || 0).getTime();
        const timeB = new Date(b.quotation_date || b.invoice_date || 0).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      } else if (sortField === 'customer') {
        valA = (a.customer_name || '').toLowerCase();
        valB = (b.customer_name || '').toLowerCase();
      } else if (sortField === 'amount') {
        const numA = Number(a.total_amount || 0);
        const numB = Number(b.total_amount || 0);
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      } else if (sortField === 'status') {
        valA = (a.status || '').toLowerCase();
        valB = (b.status || '').toLowerCase();
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortField, sortOrder]);

  const deleteMutation = useMutation({
    mutationFn: deleteQuotation,
    onSuccess: () => {
      toast.success('Quotation deleted');
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, payload }) => updateQuotation(id, payload),
    onSuccess: () => {
      toast.success('Quotation status updated');
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const convertMutation = useMutation({
    mutationFn: ({ id, payload, approvedItemIds }) => convertQuotationToSalesOrder(id, payload || approvedItemIds),
    onSuccess: (resp) => {
      toast.success(`Converted to Sales Order ${resp.sales_order_number}`);
      setConvertTarget(null);
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to convert quotation');
    },
  });

  const setQuotationStatus = (quotation, nextStatus) => {
    approveMutation.mutate({ id: quotation.id, payload: { status: nextStatus } });
  };

  return (
    <div className="lg:bg-white/5 lg:backdrop-blur-20 rounded-lg lg:shadow p-0 lg:p-6 lg:border lg:border-white/10 bg-transparent border-none shadow-none backdrop-blur-none">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 px-4 lg:px-0">
        <input
          type="text"
          placeholder="Search quotations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-white/20 rounded-lg bg-white/10 text-white placeholder-gray-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border border-white/20 rounded-lg bg-[#111] text-white"
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="partially_converted">Partially Converted</option>
          <option value="converted">Converted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-gray-400">Loading quotations...</p>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-white transition-colors select-none"
                    onClick={() => handleSort('number')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Quotation #</span>
                      {sortField === 'number' ? (
                        sortOrder === 'asc' ? <ChevronUpIcon className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronDownIcon className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <ArrowsUpDownIcon className="w-3 h-3 text-gray-600 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-white transition-colors select-none"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      {sortField === 'date' ? (
                        sortOrder === 'asc' ? <ChevronUpIcon className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronDownIcon className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <ArrowsUpDownIcon className="w-3 h-3 text-gray-600 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-white transition-colors select-none"
                    onClick={() => handleSort('customer')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Customer</span>
                      {sortField === 'customer' ? (
                        sortOrder === 'asc' ? <ChevronUpIcon className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronDownIcon className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <ArrowsUpDownIcon className="w-3 h-3 text-gray-600 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-white transition-colors select-none"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Amount</span>
                      {sortField === 'amount' ? (
                        sortOrder === 'asc' ? <ChevronUpIcon className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronDownIcon className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <ArrowsUpDownIcon className="w-3 h-3 text-gray-600 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-white transition-colors select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {sortField === 'status' ? (
                        sortOrder === 'asc' ? <ChevronUpIcon className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronDownIcon className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <ArrowsUpDownIcon className="w-3 h-3 text-gray-600 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((q) => (
                  <tr key={q.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white font-medium">{q.quotation_number || q.invoice_number}</td>
                    <td className="px-4 py-3 text-gray-300">{q.quotation_date || q.invoice_date}</td>
                    <td className="px-4 py-3 text-white">{q.customer_name}</td>
                    <td className="px-4 py-3 text-cyan-400">{getCurrencySymbol()}{Number(q.total_amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-300 capitalize">{q.status}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onView?.(q)}
                          title="View Quotation"
                          aria-label="View Quotation"
                          className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/40 transition-all drop-shadow"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(q)}
                          title="Edit Quotation"
                          aria-label="Edit Quotation"
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 transition-all drop-shadow"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        {(q.status === 'draft' || q.status === 'pending') && (
                          <button
                            type="button"
                            onClick={() => setQuotationStatus(q, 'approved')}
                            title="Approve Quotation"
                            aria-label="Approve Quotation"
                            className="p-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 hover:text-green-300 transition-all drop-shadow"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {(q.status === 'draft' || q.status === 'pending' || q.status === 'approved' || q.status === 'partially_converted') && (
                          <button
                            type="button"
                            onClick={() => setQuotationStatus(q, 'rejected')}
                            title="Reject Quotation"
                            aria-label="Reject Quotation"
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-300 transition-all drop-shadow"
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {(q.status === 'approved' || q.status === 'partially_converted') && (
                          <button
                            type="button"
                            onClick={() => setConvertTarget(q)}
                            title="Convert Quotation"
                            aria-label="Convert Quotation"
                            className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all drop-shadow"
                          >
                            <ArrowPathRoundedSquareIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete quotation ${q.quotation_number}?`)) {
                              deleteMutation.mutate(q.id);
                            }
                          }}
                          title="Delete Quotation"
                          aria-label="Delete Quotation"
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 transition-all drop-shadow"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <EmptyState
                        icon={DocumentTextIcon}
                        title={search ? "No quotations match your search" : "No quotations created yet"}
                        description={search ? `No quotations matched "${search}". Try clearing filters or searching another keyword.` : "Draft detailed pricing estimates and proposals for your leads and customers."}
                        actionLabel={!search && onAddNewQuotation ? "Create Quotation" : undefined}
                        onAction={!search && onAddNewQuotation ? onAddNewQuotation : undefined}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="lg:hidden space-y-3 px-2">
            {sortedRows.length === 0 ? (
              <EmptyState
                icon={DocumentTextIcon}
                title={search ? "No matching quotations" : "No quotations yet"}
                description={search ? `No results for "${search}".` : "Start sending formal price quotes to prospective clients."}
                actionLabel={!search && onAddNewQuotation ? "New Quotation" : undefined}
                onAction={!search && onAddNewQuotation ? onAddNewQuotation : undefined}
              />
            ) : (
              sortedRows.map((q) => (
                <div key={q.id} className="bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10 p-3 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-base font-bold text-white">#{q.quotation_number || q.invoice_number}</div>
                      <div className="text-[10px] text-white/50 uppercase tracking-widest font-black">{q.quotation_date || q.invoice_date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-cyan-400">{getCurrencySymbol()}{Number(q.total_amount || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5 mb-4">
                     <div>
                        <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Customer</div>
                        <div className="text-xs font-bold text-white truncate">{q.customer_name}</div>
                     </div>
                     <div className="text-right">
                        <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Status</div>
                        <div className={`inline-block px-1.5 py-0.5 rounded text-[8px] uppercase font-black ${
                            q.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                            q.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                         }`}>
                            {q.status}
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center justify-end flex-wrap gap-2 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => onView?.(q)}
                      title="View Quotation"
                      aria-label="View Quotation"
                      className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(q)}
                      title="Edit Quotation"
                      aria-label="Edit Quotation"
                      className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    {(q.status === 'draft' || q.status === 'pending') && (
                      <button
                        type="button"
                        onClick={() => setQuotationStatus(q, 'approved')}
                        title="Approve Quotation"
                        aria-label="Approve Quotation"
                        className="p-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 hover:text-green-300 transition-all"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                      </button>
                    )}
                    {(q.status === 'draft' || q.status === 'pending' || q.status === 'approved' || q.status === 'partially_converted') && (
                      <button
                        type="button"
                        onClick={() => setQuotationStatus(q, 'rejected')}
                        title="Reject Quotation"
                        aria-label="Reject Quotation"
                        className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-300 transition-all"
                      >
                        <XCircleIcon className="w-4 h-4" />
                      </button>
                    )}
                    {(q.status === 'approved' || q.status === 'partially_converted') && (
                      <button
                        type="button"
                        onClick={() => setConvertTarget(q)}
                        title="Convert Quotation"
                        aria-label="Convert Quotation"
                        className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all"
                      >
                        <ArrowPathRoundedSquareIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete quotation ${q.quotation_number}?`)) {
                          deleteMutation.mutate(q.id);
                        }
                      }}
                      title="Delete Quotation"
                      aria-label="Delete Quotation"
                      className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-300 transition-all"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <QuotationConvertModal
        isOpen={!!convertTarget}
        quotation={convertTarget}
        onClose={() => setConvertTarget(null)}
        isSubmitting={convertMutation.isPending}
        onConfirm={(payload) => {
          if (!convertTarget) return;
          convertMutation.mutate({ id: convertTarget.id, payload });
        }}
      />
    </div>
  );
}
