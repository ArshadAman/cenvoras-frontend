import React from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCustomer } from "../../api/customers";
import { toast } from "react-toastify";
import { XMarkIcon, TrashIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function CustomerDeleteDialog({ isOpen, onClose, customer }) {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: () => deleteCustomer(customer?.id),
    onSuccess: (response) => {
      toast.success(response?.message || "Customer deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || "Failed to delete customer");
    },
  });

  if (!isOpen || !customer) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl animate-fade-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
           <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
             <TrashIcon className="w-5 h-5 text-[var(--status-danger-text)]" />
             Delete Customer
           </h3>
           <button
             onClick={onClose}
             className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
           >
             <XMarkIcon className="w-5 h-5" />
           </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            Are you sure you want to delete <span className="text-[var(--text-primary)] font-semibold">"{customer.name}"</span>? 
            This action cannot be undone.
          </p>

          {/* Warning */}
          <div className="bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] rounded-xl p-4 flex gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-[var(--status-warning-text)] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[var(--status-warning-text)] leading-relaxed">
              <strong className="font-bold">Warning:</strong> Deleting this customer may affect:
              <ul className="list-disc list-inside mt-2 space-y-1 opacity-90">
                <li>Associated sales invoices</li>
                <li>Transaction history</li>
                <li>Reporting data</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 pt-0 flex justify-end gap-3">
          <button 
            className="btn-secondary text-sm" 
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border border-[var(--status-danger-border)] hover:opacity-90 rounded-xl transition-all shadow-sm text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
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