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
    <div className="rounded-2xl p-0 lg:p-6 bg-transparent">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 px-4 lg:px-0">
        <input
          type="text"
          placeholder="Search quotations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 px-4 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="partially_converted">Partially Converted</option>
          <option value="converted">Converted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-[var(--text-secondary)] text-sm">Loading quotations...</p>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--bg-primary)]/40">
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                    onClick={() => handleSort('number')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Quotation #</span>
                      {sortField === 'number' ? (
                        sortOrder === 'asc' ? <ChevronUpIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> : <ChevronDownIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      ) : (
                        <ArrowsUpDownIcon className="w-3 h-3 text-[var(--text-muted)] opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      {sortField === 'date' ? (
                        sortOrder === 'asc' ? <ChevronUpIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> : <ChevronDownIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      ) : (
                        <ArrowsUpDownIcon className="w-3 h-3 text-[var(--text-muted)] opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                    onClick={() => handleSort('customer')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Customer</span>
                      {sortField === 'customer' ? (
                        sortOrder === 'asc' ? <ChevronUpIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> : <ChevronDownIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      ) : (
                        <ArrowsUpDownIcon className="w-3 h-3 text-[var(--text-muted)] opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Amount</span>
                      {sortField === 'amount' ? (
                        sortOrder === 'asc' ? <ChevronUpIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> : <ChevronDownIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      ) : (
                        <ArrowsUpDownIcon className="w-3 h-3 text-[var(--text-muted)] opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {sortField === 'status' ? (
                        sortOrder === 'asc' ? <ChevronUpIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> : <ChevronDownIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      ) : (
                        <ArrowsUpDownIcon className="w-3 h-3 text-[var(--text-muted)] opacity-60" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-[var(--text-secondary)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((q) => (
                  <tr key={q.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-primary)]/30 transition-colors">
                    <td className="px-4 py-3 text-[var(--text-primary)] font-mono font-medium">{q.quotation_number || q.invoice_number}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{q.quotation_date || q.invoice_date}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{q.customer_name}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)] font-mono font-semibold">{getCurrencySymbol()}{Number(q.total_amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        q.status === 'approved' || q.status === 'converted' ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30' :
                        q.status === 'rejected' ? 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30' :
                        q.status === 'partially_converted' ? 'bg-[var(--status-info)]/15 text-[var(--status-info)] border border-[var(--status-info)]/30' :
                        'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30'
                      }`}>
                        {q.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onView?.(q)}
                          title="View Quotation"
                          aria-label="View Quotation"
                          className="p-1.5 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/20 transition-all"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(q)}
                          title="Edit Quotation"
                          aria-label="Edit Quotation"
                          className="p-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-all"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        {(q.status === 'draft' || q.status === 'pending') && (
                          <button
                            type="button"
                            onClick={() => setQuotationStatus(q, 'approved')}
                            title="Approve Quotation"
                            aria-label="Approve Quotation"
                            className="p-1.5 rounded-lg bg-[var(--status-success)]/10 text-[var(--status-success)] border border-[var(--status-success)]/30 hover:bg-[var(--status-success)]/20 transition-all"
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
                            className="p-1.5 rounded-lg bg-[var(--status-warning)]/10 text-[var(--status-warning)] border border-[var(--status-warning)]/30 hover:bg-[var(--status-warning)]/20 transition-all"
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
                            className="p-1.5 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)]/25 transition-all"
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
                          className="p-1.5 rounded-lg bg-[var(--status-danger)]/10 text-[var(--status-danger)] border border-[var(--status-danger)]/30 hover:bg-[var(--status-danger)]/20 transition-all"
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
                <div key={q.id} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-base font-bold text-[var(--text-primary)] font-mono">#{q.quotation_number || q.invoice_number}</div>
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-mono">{q.quotation_date || q.invoice_date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[var(--text-primary)] font-mono">{getCurrencySymbol()}{Number(q.total_amount || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[var(--border-subtle)] mb-4">
                     <div>
                        <div className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">Customer</div>
                        <div className="text-xs font-bold text-[var(--text-primary)] truncate">{q.customer_name}</div>
                     </div>
                     <div className="text-right">
                        <div className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">Status</div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          q.status === 'approved' || q.status === 'converted' ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30' : 
                          q.status === 'rejected' ? 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30' : 
                          'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30'
                        }`}>
                          {q.status?.replace('_', ' ')}
                        </span>
                     </div>
                  </div>

                  <div className="flex items-center justify-end flex-wrap gap-2 pt-2 border-t border-[var(--border-subtle)]">
                    <button
                      type="button"
                      onClick={() => onView?.(q)}
                      title="View Quotation"
                      aria-label="View Quotation"
                      className="p-2 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/20 transition-all"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(q)}
                      title="Edit Quotation"
                      aria-label="Edit Quotation"
                      className="p-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-all"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    {(q.status === 'draft' || q.status === 'pending') && (
                      <button
                        type="button"
                        onClick={() => setQuotationStatus(q, 'approved')}
                        title="Approve Quotation"
                        aria-label="Approve Quotation"
                        className="p-2 rounded-lg bg-[var(--status-success)]/10 text-[var(--status-success)] border border-[var(--status-success)]/30 hover:bg-[var(--status-success)]/20 transition-all"
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
                        className="p-2 rounded-lg bg-[var(--status-warning)]/10 text-[var(--status-warning)] border border-[var(--status-warning)]/30 hover:bg-[var(--status-warning)]/20 transition-all"
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
                        className="p-2 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)]/25 transition-all"
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
                      className="p-2 rounded-lg bg-[var(--status-danger)]/10 text-[var(--status-danger)] border border-[var(--status-danger)]/30 hover:bg-[var(--status-danger)]/20 transition-all"
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
