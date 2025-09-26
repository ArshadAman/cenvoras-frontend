import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSalesInvoice } from "../../api/sales";
import { toast } from "react-toastify";

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Delete Sales Invoice
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Are you sure you want to delete this sales invoice?
          </p>
          
          {/* Invoice Details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-400">Invoice Number:</span>
                <span className="text-gray-900 dark:text-white">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-400">Customer:</span>
                <span className="text-gray-900 dark:text-white">{invoice.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="text-gray-900 dark:text-white font-semibold">₹{Number(invoice.total_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-400">Date:</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(invoice.invoice_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-red-600 dark:text-red-400 mb-6">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isLoading ? "Deleting..." : "Delete Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}