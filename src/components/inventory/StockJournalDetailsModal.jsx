import React from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from '@heroicons/react/24/outline';
import { format } from "date-fns";

export default function StockJournalDetailsModal({ isOpen, onClose, journal }) {
  if (!isOpen || !journal) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden bento-card !p-0 shadow-2xl animate-fade-up border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              Stock Journal Details
              <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border
                ${['excess', 'internal_return'].includes(journal.adjustment_type) 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'}
              `}>
                {journal.adjustment_type.replace('_', ' ')}
              </span>
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Transaction ID: {journal.id}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-primary)] hover:bg-[var(--border-subtle)]/30 rounded-xl">
            <XMarkIcon className="w-6 h-6" />
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
                          item.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
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
