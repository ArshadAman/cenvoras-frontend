import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPurchaseBills } from "../../api/purchase";
import { format } from "date-fns";

export default function PurchaseTable({ onEdit, onView, onDelete }) {
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-bill_date"); // default: newest first
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["purchase-bills", { search, ordering, page }],
    queryFn: () =>
      getPurchaseBills({ search, ordering, page }),
    keepPreviousData: true,
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="Search Bill Number or Vendor"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          value={ordering}
          onChange={e => setOrdering(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="-bill_date">Newest</option>
          <option value="bill_date">Oldest</option>
          <option value="-total_amount">Amount (High to Low)</option>
          <option value="total_amount">Amount (Low to High)</option>
        </select>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2">Bill Number</th>
              <th className="text-left py-2">Bill Date</th>
              <th className="text-left py-2">Vendor</th>
              <th className="text-left py-2">Items</th>
              <th className="text-right py-2">Total Amount</th>
              <th className="text-center py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-4 animate-pulse bg-gray-100 dark:bg-gray-700" />
                  </tr>
                ))
              : (Array.isArray(data) ? data : data?.results || []).map(bill => (
                  <tr key={bill.id} className="border-b">
                    <td>{bill.bill_number}</td>
                    <td>{bill.bill_date}</td>
                    <td>{bill.vendor_name}</td>
                    <td>
                      {bill.items && bill.items.length > 0 ? (
                        bill.items.map(item => (
                          <div key={item.id}>
                            {item.product_detail?.name || "Product"} — Qty: {item.quantity} {item.unit}
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400">No items</span>
                      )}
                    </td>
                    <td className="text-right">{bill.total_amount}</td>
                    <td className="text-center">
                      <button className="text-blue-600 hover:underline mr-2" onClick={() => onView(bill.id)}>View</button>
                      <button className="text-green-600 hover:underline mr-2" onClick={() => onEdit(bill)}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => onDelete(bill.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex justify-end mt-4 gap-2">
        <button
          className="px-2 py-1 border rounded"
          disabled={page === 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <span className="px-2 py-1">{page}</span>
        <button
          className="px-2 py-1 border rounded"
          disabled={!data?.next}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}