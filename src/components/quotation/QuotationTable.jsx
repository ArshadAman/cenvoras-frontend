import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  convertQuotationToSalesOrder,
  deleteQuotation,
  getQuotations,
  updateQuotation,
} from '../../api/quotation';
import QuotationConvertModal from './QuotationConvertModal';

export default function QuotationTable({ onEdit, onView }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [convertTarget, setConvertTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', search, status],
    queryFn: () => getQuotations({ search, status }),
  });

  const rows = Array.isArray(data) ? data : data?.results || data?.data || [];

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
    mutationFn: ({ id, approvedItemIds }) => convertQuotationToSalesOrder(id, approvedItemIds),
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
                <tr>
                  <th className="px-4 py-2 text-left text-gray-400">Quotation #</th>
                  <th className="px-4 py-2 text-left text-gray-400">Date</th>
                  <th className="px-4 py-2 text-left text-gray-400">Customer</th>
                  <th className="px-4 py-2 text-left text-gray-400">Amount</th>
                  <th className="px-4 py-2 text-left text-gray-400">Status</th>
                  <th className="px-4 py-2 text-left text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((q) => (
                  <tr key={q.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white font-medium">{q.quotation_number || q.invoice_number}</td>
                    <td className="px-4 py-3 text-gray-300">{q.quotation_date || q.invoice_date}</td>
                    <td className="px-4 py-3 text-white">{q.customer_name}</td>
                    <td className="px-4 py-3 text-cyan-400">Rs {Number(q.total_amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-300 capitalize">{q.status}</td>
                    <td className="px-4 py-3 flex items-center gap-3 text-xs">
                      <button onClick={() => onView?.(q)} className="text-indigo-300 hover:text-indigo-200">View</button>
                      <button onClick={() => onEdit(q)} className="text-cyan-400 hover:text-cyan-300">Edit</button>
                      {(q.status === 'draft' || q.status === 'pending') && (
                        <button onClick={() => setQuotationStatus(q, 'approved')} className="text-green-400 hover:text-green-300">Approve</button>
                      )}
                      {(q.status === 'draft' || q.status === 'pending' || q.status === 'approved' || q.status === 'partially_converted') && (
                        <button onClick={() => setQuotationStatus(q, 'rejected')} className="text-amber-400 hover:text-amber-300">Reject</button>
                      )}
                      {(q.status === 'approved' || q.status === 'partially_converted') && (
                        <button onClick={() => setConvertTarget(q)} className="text-cyan-300 hover:text-cyan-200">Convert</button>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete quotation ${q.quotation_number}?`)) {
                            deleteMutation.mutate(q.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No quotations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="lg:hidden space-y-3 px-2">
            {rows.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10">
                No quotations found.
              </div>
            ) : (
              rows.map((q) => (
                <div key={q.id} className="bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10 p-3 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-base font-bold text-white">#{q.quotation_number || q.invoice_number}</div>
                      <div className="text-[10px] text-white/50 uppercase tracking-widest font-black">{q.quotation_date || q.invoice_date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-cyan-400">Rs {Number(q.total_amount || 0).toLocaleString()}</div>
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

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => onView?.(q)} className="flex-1 min-w-[60px] px-2 py-2 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-center">View</button>
                    <button onClick={() => onEdit(q)} className="flex-1 min-w-[60px] px-2 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/20 transition-all text-[10px] font-black uppercase tracking-widest text-center">Edit</button>
                    {(q.status === 'approved' || q.status === 'partially_converted') && (
                      <button onClick={() => setConvertTarget(q)} className="flex-1 min-w-[60px] px-2 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-all text-[10px] font-black uppercase tracking-widest text-center">Convert</button>
                    )}
                    <button onClick={() => { if (window.confirm(`Delete quotation ${q.quotation_number}?`)) deleteMutation.mutate(q.id); }} className="flex-1 min-w-[60px] px-2 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest text-center">Delete</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(q.status === 'draft' || q.status === 'pending') && (
                      <button onClick={() => setQuotationStatus(q, 'approved')} className="flex-1 min-w-[60px] px-2 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all text-[10px] font-black uppercase tracking-widest text-center">Approve</button>
                    )}
                    {(q.status === 'draft' || q.status === 'pending' || q.status === 'approved' || q.status === 'partially_converted') && (
                      <button onClick={() => setQuotationStatus(q, 'rejected')} className="flex-1 min-w-[60px] px-2 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-all text-[10px] font-black uppercase tracking-widest text-center">Reject</button>
                    )}
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
        onConfirm={(approvedItemIds) => {
          if (!convertTarget) return;
          convertMutation.mutate({ id: convertTarget.id, approvedItemIds });
        }}
      />
    </div>
  );
}
