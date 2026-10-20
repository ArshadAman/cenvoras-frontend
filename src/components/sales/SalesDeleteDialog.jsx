import React from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSalesInvoice } from "../../api/sales";
import { toast } from "react-toastify";
import { XMarkIcon, TrashIcon } from "@heroicons/react/24/outline";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import useEscKey from "../../hooks/useEscStack";

export default function SalesDeleteDialog({ isOpen, onClose, invoice }) {
  useEscKey(onClose, isOpen, 20);
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: () => deleteSalesInvoice(invoice?.id),
    onSuccess: () => {
      toast.success("Sales invoice deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      queryClient.invalidateQueries({ queryKey: ["deliveryChallans"] });
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete sales invoice");
    },
  });

  if (!isOpen || !invoice) return null;

  const totalAmount = Number(invoice.total_amount || 0);
  const amountPaid = Number(invoice.amount_paid || 0);
  const outstanding = Math.max(totalAmount - amountPaid, 0);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl animate-fade-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
           <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
             <TrashIcon className="w-5 h-5 text-[var(--status-danger)]" />
             Delete Sales Invoice
           </h3>
           <button
             onClick={onClose}
             className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
           >
             <XMarkIcon className="w-5 h-5" />
           </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
            Are you sure you want to delete this sales invoice?
          </p>
          
          {/* Invoice Details */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Invoice Number:</span>
              <span className="text-[var(--text-primary)] font-medium font-mono">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Customer:</span>
              <span className="text-[var(--text-primary)] font-medium">{invoice.customer_name || invoice.customer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Total:</span>
              <span className="text-[var(--text-primary)] font-bold font-mono">{getCurrencySymbol()}{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Paid:</span>
              <span className="text-[var(--status-success)] font-bold font-mono">{getCurrencySymbol()}{amountPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Outstanding:</span>
              <span className="text-[var(--status-warning)] font-bold font-mono">{getCurrencySymbol()}{outstanding.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Payment Status:</span>
              <span className="text-[var(--text-primary)] font-medium capitalize">{invoice.payment_status || 'pending'}</span>
            </div>
          </div>
          
          <p className="text-xs text-[var(--status-danger)] mt-4">
            This action <span className="font-semibold">cannot be undone</span>.
          </p>
        </div>

        {/* Actions */}
        <div className="p-5 pt-0 flex justify-end gap-3">
          <button 
            className="btn-secondary px-4 py-2 text-sm" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger-border)] hover:opacity-90 rounded-xl transition-all shadow-sm text-sm font-semibold flex items-center gap-2 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
               <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
            ) : (
              <>
                <TrashIcon className="w-4 h-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}