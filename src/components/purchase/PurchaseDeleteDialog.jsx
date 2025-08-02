import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePurchaseBill } from "../../api/purchase";
import { toast } from "react-toastify";

export default function PurchaseDeleteDialog({ billId, onClose }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deletePurchaseBill(billId),
    onSuccess: () => {
      toast.success("Purchase bill deleted!");
      queryClient.invalidateQueries(["purchase-bills"]);
      onClose();
    },
    onError: () => toast.error("Failed to delete purchase bill"),
  });

  if (!billId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">Delete Purchase Bill</h2>
        <p>Are you sure you want to delete this purchase bill?</p>
        <div className="flex justify-end gap-2 mt-6">
          <button className="px-3 py-1 rounded bg-gray-200" onClick={onClose}>Cancel</button>
          <button
            className="px-3 py-1 rounded bg-red-600 text-white"
            onClick={() => mutation.mutate()}
            disabled={mutation.isLoading}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}