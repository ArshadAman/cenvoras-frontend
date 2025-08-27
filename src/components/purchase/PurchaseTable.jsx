import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPurchaseBills } from "../../api/purchase";
import { format } from "date-fns";

export default function PurchaseTable({ onEdit, onView, onDelete }) {
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-bill_date"); // default: newest first
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["purchaseBills", search, ordering, page],
    queryFn: () => getPurchaseBills({ search, ordering, page }),
  });

  console.log("Purchase Bills API data:", data); // <

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading purchase bills: {error.message}
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="ml-4 px-2 py-1 bg-red-500 text-white rounded text-xs"
        >
          Clear Auth & Re-login
        </button>
      </div>
    );
  }

  // Get the raw bills array from API response
  const billsRaw = Array.isArray(data)
    ? data
    : data?.data || data?.results || [];

  // Frontend search and filter
  const filteredBills = billsRaw
    .filter(bill => {
      // Search by bill number or vendor name (case-insensitive)
      const searchLower = search.toLowerCase();
      return (
        bill.bill_number?.toLowerCase().includes(searchLower) ||
        bill.vendor_name?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Frontend ordering
      if (ordering === "-bill_date") return new Date(b.bill_date) - new Date(a.bill_date);
      if (ordering === "bill_date") return new Date(a.bill_date) - new Date(b.bill_date);
      if (ordering === "-total_amount") return Number(b.total_amount) - Number(a.total_amount);
      if (ordering === "total_amount") return Number(a.total_amount) - Number(b.total_amount);
      return 0;
    });

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="Search Bill Number or Vendor"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
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
        <table className="min-w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="text-left py-3 px-4 rounded-l-lg">Bill Number</th>
              <th className="text-left py-3 px-4">Bill Date</th>
              <th className="text-left py-3 px-4">Vendor</th>
              <th className="text-left py-3 px-4">Items</th>
              <th className="text-right py-3 px-4">Total Amount</th>
              <th className="text-center py-3 px-4 rounded-r-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      <td
                        colSpan={6}
                        className="py-6 animate-pulse bg-gray-100 dark:bg-gray-700 rounded"
                      />
                    </tr>
                  ))
              : filteredBills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="bg-white dark:bg-gray-900 shadow rounded-lg border border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-3 px-4 font-semibold text-blue-700 dark:text-blue-200">
                      {bill.bill_number}
                    </td>
                    <td className="py-3 px-4">{bill.bill_date}</td>
                    <td className="py-3 px-4">{bill.vendor_name}</td>
                    <td className="py-3 px-4">
                      {bill.items && bill.items.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {bill.items.map((item) => (
                            <div
                              key={item.id}
                              className="bg-blue-50 dark:bg-blue-900/40 rounded-lg px-3 py-2 flex flex-col min-w-[140px] shadow-sm"
                            >
                              <span className="font-medium text-blue-800 dark:text-blue-100 truncate">
                                {item.product || "Product"}
                              </span>
                              <span className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                Qty:{" "}
                                <span className="font-semibold">
                                  {item.quantity}
                                </span>{" "}
                                {item.unit}
                                {item.price !== undefined && (
                                  <>
                                    {" "}
                                    &middot;{" "}
                                    <span>
                                      Price:{" "}
                                      <span className="font-semibold">
                                        {Number(item.price).toFixed(2)}
                                      </span>
                                    </span>
                                  </>
                                )}
                                {item.amount !== undefined && (
                                  <>
                                    {" "}
                                    &middot;{" "}
                                    <span>
                                      Amt:{" "}
                                      <span className="font-semibold">
                                        {Number(item.amount).toFixed(2)}
                                      </span>
                                    </span>
                                  </>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">No items</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-green-700 dark:text-green-300">
                      {Number(bill.total_amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-4 text-center space-x-2">
                      <button
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                        onClick={() => onView(bill.id)}
                      >
                        View
                      </button>
                      <button
                        className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                        onClick={() => onEdit(bill)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        onClick={() => onDelete(bill.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {/* No data message */}
        {!isLoading &&
          (!data ||
            (Array.isArray(data)
              ? data.length === 0
              : ((!data.data || data.data.length === 0) &&
                  (!data.results || data.results.length === 0)))) && (
          <div className="p-8 text-center text-gray-500">
            <p>No purchase bills found.</p>
            <p className="text-sm mt-2">
              Click "New Purchase" to create your first purchase bill.
            </p>
          </div>
        )}
      </div>
      {/* Pagination */}
      <div className="flex justify-end mt-4 gap-2">
        <button
          className="px-2 py-1 border rounded"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <span className="px-2 py-1">{page}</span>
        <button
          className="px-2 py-1 border rounded"
          disabled={!data?.next && !data?.data?.next}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}