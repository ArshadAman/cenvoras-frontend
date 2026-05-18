import React from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSalesInvoice } from "../../api/sales";
import { toast } from "react-toastify";
import { XMarkIcon, TrashIcon } from "@heroicons/react/24/outline";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

export default function SalesDeleteDialog({ isOpen, onClose, invoice }) {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: () => deleteSalesInvoice(invoice?.id),
    onSuccess: () => {
      toast.success("Sales invoice deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl shadow-2xl shadow-red-900/30 animate-fade-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
           <h3 className="text-lg font-bold text-white flex items-center gap-2">
             <TrashIcon className="w-5 h-5 text-red-500" />
             Delete Sales Invoice
           </h3>
           <button
             onClick={onClose}
             className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
           >
             <XMarkIcon className="w-5 h-5" />
           </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            Are you sure you want to delete this sales invoice?
          </p>
          
          {/* Invoice Details */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Invoice Number:</span>
              <span className="text-white font-medium">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Customer:</span>
              <span className="text-white">{invoice.customer_name || invoice.customer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total:</span>
              <span className="text-cyan-400 font-bold">{getCurrencySymbol()}{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Paid:</span>
              <span className="text-green-400 font-bold">{getCurrencySymbol()}{amountPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Outstanding:</span>
              <span className="text-amber-400 font-bold">{getCurrencySymbol()}{outstanding.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Payment Status:</span>
              <span className="text-white font-medium">{invoice.payment_status || 'pending'}</span>
            </div>
          </div>
          
          <p className="text-xs text-red-400 mt-4">
            This action <span className="font-semibold">cannot be undone</span>.
          </p>
        </div>

        {/* Actions */}
        <div className="p-5 pt-0 flex justify-end gap-3">
          <button 
            className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-lg shadow-red-900/30 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            onClick={() => mutation.mutate()}
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? (
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