import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePurchaseBill } from "../../api/purchase";
import { toast } from "react-toastify";
import ConfirmDialog from "../common/ConfirmDialog";

export default function PurchaseDeleteDialog({ billId, onClose }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deletePurchaseBill(billId),
    onSuccess: () => {
      toast.success("Purchase bill deleted!");
      queryClient.invalidateQueries(["purchaseBills"]);
      onClose();
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete purchase bill";
      toast.error(msg);
    },
  });

  return (
    <ConfirmDialog
      isOpen={Boolean(billId)}
      onClose={onClose}
      onConfirm={() => mutation.mutate()}
      isPending={mutation.isPending}
      title="Delete Purchase Bill"
      description="Are you sure you want to delete this purchase bill? This will restore any impacted inventory journals and recalculate vendor balances. This action cannot be undone."
      confirmLabel="Delete Purchase Bill"
    />
  );
}