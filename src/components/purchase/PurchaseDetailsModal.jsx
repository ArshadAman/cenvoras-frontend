import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getPurchaseBill } from "../../api/purchase";

export default function PurchaseDetailsModal({ billId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ["purchase-bill", billId],
    queryFn: () => getPurchaseBill(billId),
    enabled: !!billId,
  });

  const bill = data?.data || data?.result || data || {};

  if (!billId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-2xl font-sans">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-200">
              Purchase Invoice
            </h2>
            <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">
              #{bill.bill_number}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-700 dark:text-gray-200 font-semibold">
              Date:
            </div>
            <div className="text-base">{bill.bill_date}</div>
          </div>
        </div>
        <div className="mb-6 flex justify-between">
          <div>
            <div className="font-semibold text-gray-700 dark:text-gray-200">
              Vendor
            </div>
            <div className="text-base">{bill.vendor_name}</div>
            {bill.vendor_address && (
              <div className="text-xs text-gray-500 dark:text-gray-300">
                {bill.vendor_address}
              </div>
            )}
            {bill.vendor_gstin && (
              <div className="text-xs text-gray-500 dark:text-gray-300">
                GSTIN: {bill.vendor_gstin}
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-700 dark:text-gray-200">
              Journal
            </div>
            <div className="text-base">{bill.journal}</div>
            {bill.gst_treatment && (
              <div className="text-xs text-gray-500 dark:text-gray-300">
                GST: {bill.gst_treatment}
              </div>
            )}
          </div>
        </div>
        <div className="mb-6">
          <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Unit</th>
                <th className="px-3 py-2 text-right">Price</th>
                <th className="px-3 py-2 text-right">Discount</th>
                <th className="px-3 py-2 text-right">Tax</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill?.items && bill.items.length > 0 ? (
                bill.items.map((item, i) => (
                  <tr
                    key={i}
                    className="border-t border-gray-100 dark:border-gray-700"
                  >
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">
                      {item.product || "Product"}
                    </td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">{item.unit}</td>
                    <td className="px-3 py-2 text-right">
                      {Number(item.price).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.discount ? `${item.discount}%` : "-"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.tax ? `${item.tax}%` : "-"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {Number(item.amount).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-4 text-center text-gray-400"
                  >
                    No items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          <div className="w-full max-w-xs">
            <div className="flex justify-between py-1">
              <span className="text-gray-700 dark:text-gray-200">Subtotal</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {bill.items
                  ? bill.items
                      .reduce(
                        (sum, item) => sum + Number(item.amount || 0),
                        0
                      )
                      .toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                  : "0.00"}
              </span>
            </div>
            {/* Add more rows here for taxes, discounts, etc. if needed */}
            <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700 mt-2">
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                Total
              </span>
              <span className="font-bold text-lg text-green-700 dark:text-green-300">
                {Number(bill.total_amount || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-8">
          <button
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            onClick={onClose}
          >
            Close
          </button>
          {/* Print/Download PDF button can be added here */}
        </div>
      </div>
    </div>
  );
}