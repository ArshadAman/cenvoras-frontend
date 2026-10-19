import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProduct } from "../../api/inventory";
import { createPortal } from "react-dom";
import { XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import useEscKey from "../../hooks/useEscStack";

export default function ProductDeleteDialog({ product, onClose, onSuccess }) {
  useEscKey(onClose, Boolean(product), 20);
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState(null);
  
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["lowStockProducts"] });
      queryClient.invalidateQueries({ queryKey: ["stockValuation"] });
      if (data?.archived) {
        toast.info(data.message || "Product archived to preserve transaction history.", { autoClose: 4000 });
      } else {
        toast.success("Product deleted successfully!", { autoClose: 3000 });
      }
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      console.error("Failed to delete product:", err);
      const msg = err.response?.data?.error || err.response?.data?.detail || "Failed to delete product. Please try again.";
      setErrorMessage(msg);
      toast.error(msg, { toastId: `delete-error-${product?.id}`, autoClose: 4000 });
    },
  });

  const handleDelete = () => {
    if (product?.id) {
      setErrorMessage(null);
      deleteMutation.mutate(product.id);
    }
  };

  if (!product) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xl animate-fade-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
           <div className="flex items-center gap-3">
             <div className="bg-[var(--status-danger-bg)] p-2 rounded-xl border border-[var(--status-danger-border)]">
               <svg className="w-6 h-6 text-[var(--status-danger-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
               </svg>
             </div>
             <h3 className="text-xl font-bold text-[var(--text-primary)]">Delete Product</h3>
           </div>
           <button
             onClick={onClose}
             className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
           >
             <XMarkIcon className="w-5 h-5" />
           </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            Are you sure you want to delete the following product? This action cannot be undone and will remove all associated data.
          </p>
          
          <div className="bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-subtle)]">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Product:</span>
                <span className="font-semibold text-[var(--text-primary)]">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">SKU:</span>
                <span className="text-[var(--text-primary)] font-mono">{product.sku}</span>
              </div>
              {product.current_stock && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Stock:</span>
                  <span className="text-[var(--text-primary)]">
                    {product.current_stock} {product.unit}
                  </span>
                </div>
              )}
            </div>
          </div>

           <div className="bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] rounded-xl p-3 flex gap-3 text-[var(--status-warning-text)]">
             <div className="mt-0.5">
               <svg className="h-5 w-5 text-[var(--status-warning-text)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
               </svg>
             </div>
             <p className="text-xs leading-relaxed">
               <strong>Warning:</strong> Deleting this product will also remove all associated stock movement history and purchase records.
             </p>
           </div>

           {errorMessage && (
             <div className="bg-[var(--status-danger-bg)] border border-[var(--status-danger-border)] rounded-xl p-3 flex items-start gap-3 animate-fade-in">
               <ExclamationTriangleIcon className="w-5 h-5 text-[var(--status-danger-text)] shrink-0 mt-0.5" />
               <p className="text-xs text-[var(--status-danger-text)] leading-relaxed font-medium">
                 {errorMessage}
               </p>
             </div>
           )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex gap-3 justify-end">
           <button
            onClick={onClose}
            className="btn-secondary text-sm"
            disabled={deleteMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border border-[var(--status-danger-border)] hover:opacity-90 rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm font-semibold"
          >
            {deleteMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                Deleting...
              </>
            ) : (
              "Delete Product"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
