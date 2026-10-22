import React from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { getCreditNote } from "../../api/gst";
import { getCurrencySymbol } from "../../utils/currency";
import { formatDateKolkata } from "../../utils/date";
import useEscKey from "../../hooks/useEscStack";

const fmt = (v) =>
  parseFloat(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const reasonLabels = {
  return: "Goods Returned",
  defective: "Defective",
  discount: "Post-Sale Discount",
  rate_diff: "Rate Difference",
  other: "Other",
};

const MMM = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatCnDate(dateStr) {
  if (!dateStr) return "—";
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const monthIdx = parseInt(m[2], 10) - 1;
    return `${m[3]}-${MMM[monthIdx] || m[2]}-${m[1]}`;
  }
  return formatDateKolkata(dateStr, "DD-MMM-YYYY") || dateStr;
}

export default function CreditNoteDetailsModal({ isOpen, onClose, creditNoteId }) {
  useEscKey(onClose, isOpen, 15);

  const { data: note, isLoading, isError } = useQuery({
    queryKey: ["credit-note", creditNoteId],
    queryFn: () => getCreditNote(creditNoteId),
    enabled: isOpen && !!creditNoteId,
  });

  if (!isOpen) return null;

  const cnNumber = note?.credit_note_number
    ? note.credit_note_number.startsWith("CN-")
      ? note.credit_note_number
      : `CN-${note.credit_note_number}`
    : "";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fade-up border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl my-auto">
        <div className="flex justify-between items-center px-5 py-4 sm:px-6 border-b border-[var(--border-subtle)] shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight flex flex-wrap items-center gap-2">
              Credit Note Details
              {note && (
                <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-lg border bg-[var(--status-info-bg)] text-[var(--status-info-text)] border-[var(--status-info-border)]">
                  {reasonLabels[note.reason] || note.reason}
                </span>
              )}
            </h2>
            {cnNumber && (
              <p className="text-[var(--text-secondary)] text-xs mt-0.5 font-mono">{cnNumber}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-primary)] rounded-xl cursor-pointer"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-[var(--text-muted)] text-sm">Loading credit note...</div>
          ) : isError || !note ? (
            <div className="py-12 text-center text-[var(--status-danger)] text-sm">Failed to load credit note.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)]">
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Date</div>
                  <div className="font-medium text-[var(--text-primary)]">{formatCnDate(note.date)}</div>
                </div>
                <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)]">
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Customer</div>
                  <div className="font-medium text-[var(--text-primary)]">{note.customer_name || "—"}</div>
                </div>
                <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)]">
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Original Invoice</div>
                  <div className="font-medium text-[var(--text-primary)] text-sm font-mono break-all">
                    {note.original_invoice || "—"}
                  </div>
                </div>
                <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)]">
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Total</div>
                  <div className="font-semibold text-[var(--text-primary)] tabular-nums">
                    {getCurrencySymbol()}
                    {fmt(note.total_amount)}
                  </div>
                </div>
              </div>

              {note.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                    Notes
                  </h3>
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-4 text-[var(--text-secondary)] text-sm leading-relaxed">
                    {note.notes}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                  Line Items
                </h3>
                <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--bg-primary)] overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[640px]">
                    <thead>
                      <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                        <th className="p-3 font-medium">Product</th>
                        <th className="p-3 font-medium">HSN</th>
                        <th className="p-3 font-medium text-right">Qty</th>
                        <th className="p-3 font-medium text-right">Price</th>
                        <th className="p-3 font-medium text-center">Disc.</th>
                        <th className="p-3 font-medium text-center">Tax</th>
                        <th className="p-3 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {note.items?.length > 0 ? (
                        note.items.map((item) => (
                          <tr key={item.id} className="hover:bg-[var(--bg-surface)]/50">
                            <td className="p-3 text-[var(--text-primary)] font-medium">
                              {item.product_name || item.description || "—"}
                            </td>
                            <td className="p-3 text-[var(--text-secondary)] font-mono text-xs">
                              {item.hsn_sac_code || "—"}
                            </td>
                            <td className="p-3 text-right tabular-nums">{item.quantity}</td>
                            <td className="p-3 text-right tabular-nums">
                              {getCurrencySymbol()}
                              {fmt(item.price)}
                            </td>
                            <td className="p-3 text-center">
                              {parseFloat(item.discount || 0) > 0 ? `${item.discount}%` : "—"}
                            </td>
                            <td className="p-3 text-center">{Math.round(parseFloat(item.tax || 0))}%</td>
                            <td className="p-3 text-right font-medium tabular-nums">
                              {getCurrencySymbol()}
                              {fmt(item.amount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="p-4 text-center text-[var(--text-secondary)]">
                            No items on this credit note.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
