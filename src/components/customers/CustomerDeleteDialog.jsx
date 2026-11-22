import React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCustomer } from "../../api/customers";
import { toast } from "react-toastify";
import { XMarkIcon, TrashIcon, ExclamationTriangleIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import useEscKey from "../../hooks/useEscStack";

export default function CustomerDeleteDialog({ isOpen, onClose, customer }) {
  useEscKey(onClose, isOpen, 20);
  const queryClient = useQueryClient();
  let navigate = (path) => { if (typeof window !== 'undefined') window.location.href = path; };
  try {
    const routerNav = useNavigate();
    if (routerNav) navigate = routerNav;
  } catch (e) {
    // router context not present (e.g. tests or standalone)
  }
  
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

  const blockingDocs = mutation.error?.response?.data?.blocking_documents || [];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl animate-fade-up overflow-hidden">
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

          {/* Error Message if deletion failed */}
          {mutation.isError && (
            <div className="bg-[var(--status-danger-bg)] border border-[var(--status-danger-border)] rounded-xl p-4 space-y-3 text-xs text-[var(--status-danger-text)]">
              <div className="flex gap-2.5 items-start">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-[var(--status-danger-text)]" />
                <div className="space-y-1 flex-1">
                  <strong className="font-bold text-sm block">
                    {blockingDocs.length > 0 
                      ? `Cannot delete customer — ${blockingDocs.length} linked document(s) detected:`
                      : "Cannot delete customer:"}
                  </strong>
                  <p className="leading-relaxed opacity-90">
                    {blockingDocs.length > 0 
                      ? "This customer is referenced by existing transactions. You must delete or reassign these documents before this customer can be removed:"
                      : (mutation.error?.response?.data?.message || mutation.error?.message || "Failed to delete customer.")}
                  </p>
                </div>
              </div>

              {blockingDocs.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pt-1 pr-0.5">
                  {blockingDocs.map((doc, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-subtle)] text-xs gap-2"
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <span className="font-semibold px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)] text-[11px] whitespace-nowrap">
                          {doc.type}
                        </span>
                        <span className="font-mono font-bold text-[var(--text-primary)] truncate">
                          {doc.identifier}
                        </span>
                        {doc.status && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold bg-[var(--bg-primary)] text-[var(--text-muted)] whitespace-nowrap">
                            {doc.status}
                          </span>
                        )}
                      </div>
                      {doc.route && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate(doc.route);
                          }}
                          className="text-[var(--accent-primary)] hover:underline flex items-center gap-1 font-semibold text-xs ml-2 shrink-0"
                          title={`Navigate to ${doc.type}`}
                        >
                          <span>View</span>
                          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] rounded-xl p-4 flex gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-[var(--status-warning-text)] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[var(--status-warning-text)] leading-relaxed">
              <strong className="font-bold">Warning:</strong> Deleting this customer may affect:
              <ul className="list-disc list-inside mt-2 space-y-1 opacity-90">
                <li>Associated sales invoices & challans</li>
                <li>Sales orders & quotations</li>
                <li>Transaction history & reporting</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex justify-end gap-3">
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