import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProduct } from "../../api/inventory";

export default function ProductDeleteDialog({ product, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md font-sans">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
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
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Delete Product
            </h3>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Are you sure you want to delete the following product? This action cannot be undone.
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-red-400">
            <div className="space-y-2">
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">Product:</span>
                <span className="ml-2 text-gray-700 dark:text-gray-300">{product.name}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">SKU:</span>
                <span className="ml-2 text-gray-700 dark:text-gray-300">{product.sku}</span>
              </div>
              {product.current_stock && (
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">Current Stock:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {product.current_stock} {product.unit}
                  </span>
                </div>
              )}
              {product.unit_price && (
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">Unit Price:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    ₹{parseFloat(product.unit_price).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>Warning:</strong> Deleting this product will also remove all associated stock movement history and purchase records.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
            disabled={deleteMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {deleteMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Deleting...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete Product
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
