import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProduct } from "../../api/inventory";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function ProductDeleteDialog({ product, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["lowStockProducts"] });
      queryClient.invalidateQueries({ queryKey: ["stockValuation"] });
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product. Please try again.");
    },
  });

  const handleDelete = () => {
    if (product?.id) {
      deleteMutation.mutate(product.id);
    }
  };

  if (!product) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bento-card !p-0 shadow-2xl shadow-red-900/20 animate-fade-up bg-[#111] border border-white/10 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
           <div className="flex items-center gap-3">
             <div className="bg-red-500/20 p-2 rounded-lg border border-red-500/30">
               <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
               </svg>
             </div>
             <h3 className="text-xl font-bold text-white">Delete Product</h3>
           </div>
           <button
             onClick={onClose}
             className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
           >
             <XMarkIcon className="w-5 h-5" />
           </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-400 text-sm leading-relaxed">
            Are you sure you want to delete the following product? This action cannot be undone and will remove all associated data.
          </p>
          
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Product:</span>
                <span className="font-semibold text-white">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">SKU:</span>
                <span className="text-white font-mono">{product.sku}</span>
              </div>
              {product.current_stock && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Stock:</span>
                  <span className="text-white">
                    {product.current_stock} {product.unit}
                  </span>
                </div>
              )}
            </div>
          </div>

           <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex gap-3">
             <div className="mt-0.5">
               <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
               </svg>
             </div>
             <p className="text-xs text-yellow-200/80 leading-relaxed">
               <strong>Warning:</strong> Deleting this product will also remove all associated stock movement history and purchase records.
             </p>
           </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-white/10 bg-white/5 flex gap-3 justify-end">
           <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
            disabled={deleteMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-lg shadow-red-900/20 flex items-center gap-2 text-sm font-medium"
          >
            {deleteMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
