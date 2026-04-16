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
    <div className="bg-white/5 backdrop-blur-20 rounded-lg shadow p-6 border border-white/10">
      <div className="flex items-center justify-between gap-4 mb-4">
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
        <div className="overflow-x-auto">
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
                    <button onClick={() => setQuotationStatus(q, 'approved')} className="text-green-400 hover:text-green-300">Approve</button>
                    <button onClick={() => setQuotationStatus(q, 'rejected')} className="text-amber-400 hover:text-amber-300">Reject</button>
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
