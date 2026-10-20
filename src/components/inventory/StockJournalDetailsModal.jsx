import React from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from '@heroicons/react/24/outline';
import { format } from "date-fns";
import useEscKey from "../../hooks/useEscStack";

export default function StockJournalDetailsModal({ isOpen, onClose, journal }) {
  useEscKey(onClose, isOpen, 15);
  if (!isOpen || !journal) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fade-up border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl my-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 sm:px-6 sm:py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-display tracking-tight flex items-center gap-3">
              Stock Journal Details
              <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-lg border
                ${['excess', 'internal_return'].includes(journal.adjustment_type) 
                  ? 'bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)]' 
                  : 'bg-[var(--status-danger-bg)] text-[var(--status-danger)] border-[var(--status-danger-border)]'}
              `}>
                {journal.adjustment_type.replace('_', ' ')}
              </span>
            </h2>
            <p className="text-[var(--text-secondary)] text-xs mt-0.5">
              Transaction ID: <span className="font-mono">{journal.id}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-primary)] rounded-xl cursor-pointer">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)]">
              <div className="text-xs text-[var(--text-secondary)] mb-1">Date</div>
              <div className="font-medium text-[var(--text-primary)]">{journal.date}</div>
            </div>
            <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)]">
              <div className="text-xs text-[var(--text-secondary)] mb-1">Voucher No</div>
              <div className="font-medium text-[var(--text-primary)]">{journal.voucher_no || 'N/A'}</div>
            </div>
            <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)]">
              <div className="text-xs text-[var(--text-secondary)] mb-1">Warehouse</div>
              <div className="font-medium text-[var(--text-primary)]">{journal.warehouse_name}</div>
            </div>
            <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)]">
              <div className="text-xs text-[var(--text-secondary)] mb-1">Created</div>
              <div className="font-medium text-[var(--text-primary)] text-sm">
                {format(new Date(journal.created_at), "MMM d, yyyy HH:mm")}
              </div>
            </div>
          </div>

          {journal.notes && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
                Reason / Notes
              </h3>
              <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-4 text-[var(--text-secondary)] text-sm leading-relaxed">
                {journal.notes}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
              Adjusted Items
            </h3>
            <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--bg-primary)]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                    <th className="p-3 font-medium">Product</th>
                    <th className="p-3 font-medium">Batch</th>
                    <th className="p-3 font-medium text-right">Quantity Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {journal.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--bg-surface)]/50">
                      <td className="p-3 text-[var(--text-primary)] font-medium">{item.product_name}</td>
                      <td className="p-3 text-[var(--text-secondary)]">{item.batch_number}</td>
                      <td className="p-3 text-right">
                        <span className={`font-mono font-medium ${
                          item.quantity > 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'
                        }`}>
                          {item.quantity > 0 ? '+' : ''}{item.quantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!journal.items || journal.items.length === 0) && (
                    <tr>
                      <td colSpan="3" className="p-4 text-center text-[var(--text-secondary)]">No items found for this journal.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
