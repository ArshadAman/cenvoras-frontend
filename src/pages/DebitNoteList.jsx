import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDebitNotes, deleteDebitNote } from "../api/gst";
import { ArrowUturnRightIcon, TrashIcon, PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const fmt = (v) => parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

import DebitNoteForm from "../components/returns/DebitNoteForm";
import DebitNoteDetailsModal from "../components/returns/DebitNoteDetailsModal";
import { getCurrencySymbol } from '../utils/currency';
import { parseDateOnly } from '../utils/date';
import useResizableColumns from '../hooks/useResizableColumns';
import { LIST_THEAD, LIST_TH, LIST_TH_SORTABLE, LIST_TH_LABEL } from '../components/common/tableHeaderClasses';

const DEFAULT_COLUMN_WIDTHS = {
  number: 150,
  date: 120,
  vendor: 180,
  gstin: 140,
  reason: 140,
  items: 90,
  amount: 140,
  actions: 110,
};

export default function DebitNoteList() {
  const [showForm, setShowForm] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "number", direction: "desc" });
  const { colWidths, renderResizeHandle } = useResizableColumns(
    "cenvoras_debit_note_list_col_widths",
    DEFAULT_COLUMN_WIDTHS
  );
  const queryClient = useQueryClient();

  const { data: notesResult, isLoading } = useQuery({
    queryKey: ["debit-notes"],
    queryFn: getDebitNotes,
  });

  const notes = Array.isArray(notesResult) ? notesResult : notesResult?.results || [];

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedNotes = useMemo(() => {
    const factor = sortConfig.direction === "asc" ? 1 : -1;
    return [...notes].sort((a, b) => {
      if (sortConfig.key === "number") {
        return factor * String(a.debit_note_number || "").localeCompare(String(b.debit_note_number || ""), undefined, { numeric: true });
      }
      if (sortConfig.key === "date") {
        return factor * String(a.date || "").localeCompare(String(b.date || ""));
      }
      if (sortConfig.key === "vendor") {
        return factor * String(a.vendor_name || "").localeCompare(String(b.vendor_name || ""));
      }
      if (sortConfig.key === "amount") {
        return factor * (Number(a.total_amount || 0) - Number(b.total_amount || 0));
      }
      return 0;
    });
  }, [notes, sortConfig]);

  const deleteMutation = useMutation({
    mutationFn: deleteDebitNote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["debit-notes"] });
      await queryClient.refetchQueries({ queryKey: ["debit-notes"] });
      toast.success("Debit note deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const reasonLabels = {
    return: "Goods Returned",
    defective: "Defective",
    rate_diff: "Rate Difference",
    shortage: "Short Supply",
    other: "Other",
  };

  const reasonColors = {
    return: "bg-[var(--status-info-bg)] text-[var(--status-info-text)] border border-[var(--status-info-border)]",
    defective: "bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border border-[var(--status-danger-border)]",
    rate_diff: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border border-[var(--status-warning-border)]",
    shortage: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border border-[var(--status-warning-border)]",
    other: "bg-[var(--border-subtle)]/20 text-[var(--text-secondary)] border border-[var(--border-subtle)]",
  };

  const dnLabel = (dn) =>
    dn.debit_note_number?.startsWith('DN-') ? dn.debit_note_number : `DN-${dn.debit_note_number}`;

  return (
    <>
      <div className="p-6 md:p-10 space-y-8 animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">Debit Notes</h1>
            <p className="text-[var(--text-muted)] text-sm">Purchase returns — goods returned to vendors.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <PlusIcon className="w-4 h-4" /> New Debit Note
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-sm overflow-hidden">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full table-fixed divide-y divide-[var(--border-subtle)]">
              <colgroup>
                <col style={{ width: `${colWidths.number}px` }} />
                <col style={{ width: `${colWidths.date}px` }} />
                <col style={{ width: `${colWidths.vendor}px` }} />
                <col style={{ width: `${colWidths.gstin}px` }} />
                <col style={{ width: `${colWidths.reason}px` }} />
                <col style={{ width: `${colWidths.items}px` }} />
                <col style={{ width: `${colWidths.amount}px` }} />
                <col style={{ width: `${colWidths.actions}px` }} />
              </colgroup>
              <thead className={LIST_THEAD}>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th onClick={() => handleSort("number")} className={LIST_TH_SORTABLE}>
                    <div className={LIST_TH_LABEL}>
                      <span>DN Number</span>
                      {sortConfig.key === "number" && (
                        <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                    {renderResizeHandle("number")}
                  </th>
                  <th onClick={() => handleSort("date")} className={LIST_TH_SORTABLE}>
                    <div className={LIST_TH_LABEL}>
                      <span>Date</span>
                      {sortConfig.key === "date" && (
                        <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                    {renderResizeHandle("date")}
                  </th>
                  <th onClick={() => handleSort("vendor")} className={LIST_TH_SORTABLE}>
                    <div className={LIST_TH_LABEL}>
                      <span>Vendor</span>
                      {sortConfig.key === "vendor" && (
                        <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                    {renderResizeHandle("vendor")}
                  </th>
                  <th className={LIST_TH}>
                    GSTIN
                    {renderResizeHandle("gstin")}
                  </th>
                  <th className={LIST_TH}>
                    Reason
                    {renderResizeHandle("reason")}
                  </th>
                  <th className={LIST_TH}>
                    Items
                    {renderResizeHandle("items")}
                  </th>
                  <th onClick={() => handleSort("amount")} className={LIST_TH_SORTABLE}>
                    <div className={LIST_TH_LABEL}>
                      <span>Amount</span>
                      {sortConfig.key === "amount" && (
                        <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                    {renderResizeHandle("amount")}
                  </th>
                  <th className={LIST_TH}>
                    Actions
                    {renderResizeHandle("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {isLoading ? (
                  <tr><td colSpan="8" className="px-6 py-12 text-center text-[var(--text-muted)] text-sm">Loading debit notes...</td></tr>
                ) : sortedNotes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-[var(--text-muted)] text-sm">
                      <ArrowUturnRightIcon className="w-8 h-8 mx-auto mb-2 opacity-40 text-[var(--text-muted)]" />
                      No debit notes recorded yet.
                    </td>
                  </tr>
                ) : (
                  sortedNotes.map((dn) => (
                    <tr key={dn.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setViewId(dn.id)}
                          className="text-[var(--accent-primary)] font-semibold text-sm hover:underline text-left"
                        >
                          {dnLabel(dn)}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">{dn.date}</td>
                      <td className="px-6 py-4 text-[var(--text-primary)] font-medium text-sm">{dn.vendor_name}</td>
                      <td className="px-6 py-4 text-[var(--text-muted)] text-xs font-mono">{dn.vendor_gstin || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${reasonColors[dn.reason] || reasonColors.other}`}>
                          {reasonLabels[dn.reason] || dn.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">{dn.items?.length || 0} items</td>
                      <td className="px-6 py-4 text-right text-[var(--text-primary)] font-semibold text-sm tabular-nums">
                        {getCurrencySymbol()}{fmt(dn.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewId(dn.id)}
                            className="p-1.5 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-colors"
                            title="View Debit Note"
                            aria-label="View Debit Note"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => { if (confirm('Delete this debit note?')) deleteMutation.mutate(dn.id); }}
                            className="p-1.5 text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)] rounded-lg transition-colors"
                            title="Delete Debit Note"
                            aria-label="Delete Debit Note"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden p-4 space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-[var(--text-muted)] text-sm">Loading debit notes...</div>
            ) : sortedNotes.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)] text-sm bg-[var(--bg-primary)]/40 rounded-xl border border-[var(--border-subtle)] p-6">
                <ArrowUturnRightIcon className="w-8 h-8 mx-auto mb-2 opacity-40 text-[var(--text-muted)]" />
                No debit notes found.
              </div>
            ) : (
              sortedNotes.map((dn) => {
                let formattedDate = dn.date;
                try {
                  if (dn.date) {
                    const d = parseDateOnly(dn.date);
                    formattedDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                  }
                } catch (e) { formattedDate = dn.date; }

                return (
                  <div key={dn.id} className="bg-[var(--bg-primary)]/60 border border-[var(--border-subtle)] rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <button
                          type="button"
                          onClick={() => setViewId(dn.id)}
                          className="text-[var(--accent-primary)] font-bold text-xs tracking-wider uppercase mb-1 hover:underline"
                        >
                          {dnLabel(dn)}
                        </button>
                        <div className="text-[var(--text-primary)] font-semibold text-base">{dn.vendor_name}</div>
                        <div className="text-[var(--text-muted)] text-xs mt-0.5">{formattedDate}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${reasonColors[dn.reason] || reasonColors.other}`}>
                        {reasonLabels[dn.reason] || dn.reason}
                      </span>
                    </div>

                    <div className="flex justify-between items-end pt-3 border-t border-[var(--border-subtle)]">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-0.5 font-medium">Amount</div>
                        <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{getCurrencySymbol()}{fmt(dn.total_amount)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewId(dn.id)}
                          className="p-2 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 rounded-lg hover:opacity-80 transition-opacity"
                          title="View Debit Note"
                          aria-label="View Debit Note"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { if (confirm('Delete this debit note?')) deleteMutation.mutate(dn.id); }}
                          className="p-2 bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger-border)] rounded-lg hover:opacity-80 transition-opacity"
                          title="Delete Debit Note"
                          aria-label="Delete Debit Note"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <DebitNoteForm isOpen={showForm} onClose={() => setShowForm(false)} />
      )}

      <DebitNoteDetailsModal
        isOpen={!!viewId}
        debitNoteId={viewId}
        onClose={() => setViewId(null)}
      />
    </>
  );
}
