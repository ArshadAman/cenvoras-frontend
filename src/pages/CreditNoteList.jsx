import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCreditNotes, deleteCreditNote } from "../api/gst";
import { ArrowUturnLeftIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const fmt = (v) => parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

import CreditNoteForm from "../components/returns/CreditNoteForm"; // Add Import
import { getCurrencySymbol, formatCurrency } from '../utils/currency';

export default function CreditNoteList() {
  const [showForm, setShowForm] = useState(false); // Add State
  const queryClient = useQueryClient();

  const { data: notesResult, isLoading } = useQuery({
    queryKey: ["credit-notes"],
    queryFn: getCreditNotes,
  });

  const notes = Array.isArray(notesResult) ? notesResult : notesResult?.results || [];

  const deleteMutation = useMutation({
    mutationFn: deleteCreditNote,
    onSuccess: () => {
      queryClient.invalidateQueries(["credit-notes"]);
      toast.success("Credit note deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const reasonLabels = {
    return: "Goods Returned",
    defective: "Defective",
    discount: "Post-Sale Discount",
    rate_diff: "Rate Difference",
    other: "Other",
  };

  const reasonColors = {
    return: "bg-[var(--status-info-bg)] text-[var(--status-info-text)] border border-[var(--status-info-border)]",
    defective: "bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border border-[var(--status-danger-border)]",
    discount: "bg-[var(--status-success-bg)] text-[var(--status-success-text)] border border-[var(--status-success-border)]",
    rate_diff: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border border-[var(--status-warning-border)]",
    other: "bg-[var(--border-subtle)]/20 text-[var(--text-secondary)] border border-[var(--border-subtle)]",
  };

  return (
    <>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">Credit Notes</h1>
            <p className="text-[var(--text-muted)] text-sm">Sales returns — goods returned by customers.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <PlusIcon className="w-4 h-4" /> New Credit Note
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border-subtle)] text-left">
              <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">CN Number</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Reason</th>
                  <th className="px-6 py-4 font-semibold">Items</th>
                  <th className="px-6 py-4 font-semibold text-right">Amount</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {isLoading ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-[var(--text-muted)] text-sm">Loading credit notes...</td></tr>
                ) : notes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-[var(--text-muted)] text-sm">
                      <ArrowUturnLeftIcon className="w-8 h-8 mx-auto mb-2 opacity-40 text-[var(--text-muted)]" />
                      No credit notes recorded yet.
                    </td>
                  </tr>
                ) : (
                  notes.map((cn) => (
                    <tr key={cn.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-[var(--text-primary)] font-semibold text-sm">
                          {cn.credit_note_number?.startsWith('CN-') ? cn.credit_note_number : `CN-${cn.credit_note_number}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">{cn.date}</td>
                      <td className="px-6 py-4 text-[var(--text-primary)] font-medium text-sm">{cn.customer_name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${reasonColors[cn.reason] || reasonColors.other}`}>
                          {reasonLabels[cn.reason] || cn.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">{cn.items?.length || 0} items</td>
                      <td className="px-6 py-4 text-right text-[var(--text-primary)] font-semibold text-sm tabular-nums">
                        {getCurrencySymbol()}{fmt(cn.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => { if (confirm('Delete this credit note?')) deleteMutation.mutate(cn.id); }}
                          className="p-1.5 text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)] rounded-lg transition-colors"
                          title="Delete Credit Note"
                          aria-label="Delete Credit Note"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="lg:hidden p-4 space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-[var(--text-muted)] text-sm">Loading credit notes...</div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)] text-sm bg-[var(--bg-primary)]/40 rounded-xl border border-[var(--border-subtle)] p-6">
                <ArrowUturnLeftIcon className="w-8 h-8 mx-auto mb-2 opacity-40 text-[var(--text-muted)]" />
                No credit notes found.
              </div>
            ) : (
              notes.map((cn) => {
                let formattedDate = cn.date;
                try {
                  if (cn.date) {
                    const d = new Date(cn.date);
                    formattedDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                  }
                } catch (e) { formattedDate = cn.date; }

                return (
                  <div key={cn.id} className="bg-[var(--bg-primary)]/60 border border-[var(--border-subtle)] rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="text-[var(--accent-primary)] font-bold text-xs tracking-wider uppercase mb-1">
                          {cn.credit_note_number?.startsWith('CN-') ? cn.credit_note_number : `CN-${cn.credit_note_number}`}
                        </div>
                        <div className="text-[var(--text-primary)] font-semibold text-base">{cn.customer_name}</div>
                        <div className="text-[var(--text-muted)] text-xs mt-0.5">{formattedDate}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${reasonColors[cn.reason] || reasonColors.other}`}>
                        {reasonLabels[cn.reason] || cn.reason}
                      </span>
                    </div>

                    <div className="flex justify-between items-end pt-3 border-t border-[var(--border-subtle)]">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-0.5 font-medium">Amount</div>
                        <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{getCurrencySymbol()}{fmt(cn.total_amount)}</div>
                      </div>
                      <button
                        onClick={() => { if (confirm('Delete this credit note?')) deleteMutation.mutate(cn.id); }}
                        className="p-2 bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger-border)] rounded-lg hover:opacity-80 transition-opacity"
                        title="Delete Credit Note"
                        aria-label="Delete Credit Note"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      {showForm && (
        <CreditNoteForm isOpen={showForm} onClose={() => setShowForm(false)} />
      )}

      
    </>
  );
}

