import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getPurchaseBill } from "../../api/purchase";

export default function PurchaseDetailsModal({ billId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ["purchase-bill", billId],
    queryFn: () => getPurchaseBill(billId),
    enabled: !!billId,
  });

  if (!billId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xl">
        <h2 className="text-xl font-bold mb-4">Purchase Bill Details</h2>
        {isLoading ? (
          <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded" />
        ) : (
          <>
            <div className="mb-2">
              <strong>Bill Number:</strong> {data.bill_number}
            </div>
            <div className="mb-2">
              <strong>Bill Date:</strong> {data.bill_date}
            </div>
            <div className="mb-2">
              <strong>Vendor:</strong> {data.vendor_name}
            </div>
            <div className="mb-2">
              <strong>Total Amount:</strong> {data.total_amount}
            </div>
            <div className="mb-2">
              <strong>Items:</strong>
              <ul className="list-disc ml-6">
                {data.items.map((item, i) => (
                  <li key={i}>
                    {item.product_detail?.name || "Product"} - {item.quantity} {item.unit} × {item.price} = {item.amount}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-3 py-1 rounded bg-gray-200" onClick={onClose}>Close</button>
              {/* Print/Download PDF can be added here */}
            </div>
          </>
        )}
      </div>
    </div>
  );
}