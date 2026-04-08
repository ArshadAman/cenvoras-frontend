import React from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteVendor } from "../../api/vendors";
import { toast } from "react-toastify";
import { XMarkIcon, TrashIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function VendorDeleteDialog({ isOpen, onClose, vendor }) {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: () => deleteVendor(vendor?.id),
    onSuccess: (response) => {
      toast.success(response?.message || "Vendor deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || "Failed to delete vendor");
    },
  });

  if (!isOpen || !vendor) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl shadow-2xl shadow-red-900/30 animate-fade-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
           <h3 className="text-lg font-bold text-white flex items-center gap-2">
             <TrashIcon className="w-5 h-5 text-red-500" />
             Delete Vendor
           </h3>
           <button
             onClick={onClose}
             className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
           >
             <XMarkIcon className="w-5 h-5" />
           </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-gray-300 text-sm leading-relaxed">
            Are you sure you want to delete <span className="text-white font-semibold">"{vendor.name}"</span>? 
            This action cannot be undone.
          </p>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-200/80 leading-relaxed">
              <strong className="text-yellow-400">Warning:</strong> Deleting this vendor may affect:
              <ul className="list-disc list-inside mt-2 space-y-1 text-yellow-200/60">
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
            className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium" 
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-lg shadow-red-900/30 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
               <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
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