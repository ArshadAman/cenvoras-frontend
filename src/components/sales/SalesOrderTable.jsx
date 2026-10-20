import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSalesOrders, deleteSalesOrder } from "../../api/sales_order";
import { format } from "date-fns";
import { toast } from "react-toastify";
import Pagination from "../common/Pagination";
import SalesOrderConvertModal from "./SalesOrderConvertModal";
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathRoundedSquareIcon,
} from "@heroicons/react/24/outline";
import { getCurrencySymbol } from "../../utils/currency";

export default function SalesOrderTable({ 
  onEdit, 
  onView, 
  onDelete, 
  initialSearch = "", 
  highlightedOrderId = null 
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(initialSearch || "");
  const [page, setPage] = useState(1);
  const [convertOrder, setConvertOrder] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });

  React.useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["salesOrders", search, page],
    queryFn: () => getSalesOrders({ search, page }),
  });

  if (error) {
    return <div className="text-[var(--status-danger)] text-center p-4">Error loading orders</div>;
  }

  const orders = Array.isArray(data) ? data : data?.results || data?.data || [];
  const totalPages = data?.total_pages || 1;
  const currentPage = data?.current_page || page;

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const handleConvert = (order) => {
    setConvertOrder(order);
  };

  const filteredOrders = orders
    .filter(order => 
      order.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      order.po_number?.toLowerCase().includes(search.toLowerCase()) ||
      (order.customer_display_name || order.customer_name || '')?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const { key, direction } = sortConfig;
      const factor = direction === "asc" ? 1 : -1;
      if (key === "date") return factor * (new Date(a.date || 0) - new Date(b.date || 0));
      if (key === "order_number") return factor * String(a.order_number || "").localeCompare(String(b.order_number || ""), undefined, { numeric: true });
      if (key === "customer") return factor * String(a.customer_display_name || a.customer_name || "").localeCompare(String(b.customer_display_name || b.customer_name || ""));
      if (key === "amount") return factor * (Number(a.total_amount || 0) - Number(b.total_amount || 0));
      if (key === "status") return factor * String(a.stage || "").localeCompare(String(b.stage || ""));
      return 0;
    });

  return (
    <div className="lg:bg-[var(--bg-surface)] rounded-2xl p-0 lg:p-6 lg:border lg:border-[var(--border-subtle)] bg-transparent border-none shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 px-4 lg:px-0 gap-4">
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-4 pr-4 py-2 border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-[var(--accent-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] w-64 text-sm"
        />
      </div>

      <>
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-[var(--border-subtle)]">
              <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
                <tr className="border-b border-[var(--border-subtle)]">
                  <th 
                    onClick={() => handleSort("order_number")}
                    className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Order #</span>
                      {sortConfig.key === "order_number" && (
                        <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("date")}
                    className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      {sortConfig.key === "date" && (
                        <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("customer")}
                    className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Customer</span>
                      {sortConfig.key === "customer" && (
                        <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("amount")}
                    className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Amount</span>
                      {sortConfig.key === "amount" && (
                        <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("status")}
                    className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {sortConfig.key === "status" && (
                        <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredOrders.map(order => {
                    const isHighlighted = highlightedOrderId && (String(order.id) === String(highlightedOrderId));
                    return (
                      <tr 
                        key={order.id} 
                        className={`border-b transition-colors ${
                          isHighlighted 
                            ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/40 ring-1 ring-[var(--accent-primary)]/40' 
                            : 'border-[var(--border-subtle)] hover:bg-[var(--bg-primary)]'
                        }`}
                      >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-[var(--text-primary)] font-medium flex items-center gap-2">
                              <span>{order.order_number}</span>
                              {isHighlighted && (
                                <span className="px-2 py-0.5 text-xs font-bold uppercase bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 rounded-full">
                                  Referenced
                                </span>
                              )}
                            </div>
                            {order.po_number && (
                              <div className="text-xs text-[var(--text-secondary)] font-mono mt-0.5 flex items-center gap-1.5">
                                <span className="font-semibold">PO: {order.po_number}</span>
                                {order.po_date && (
                                  <span className="text-[var(--text-muted)] font-normal">
                                    ({format(new Date(order.po_date), 'dd/MM/yyyy')})
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">{order.date ? format(new Date(order.date), 'dd/MM/yyyy') : '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-[var(--text-primary)]">{order.customer_display_name || order.customer_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-[var(--text-primary)] font-bold">{getCurrencySymbol()}{Number(order.total_amount).toLocaleString()}</td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                                order.stage === 'completed' ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border-[var(--status-success)]/30' : 
                                order.stage === 'shipped' ? 'bg-[var(--status-info)]/15 text-[var(--status-info)] border-[var(--status-info)]/30' : 
                                order.stage === 'cancelled' ? 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border-[var(--status-danger)]/30' : 
                                'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border-[var(--status-warning)]/30'
                              }`}>
                                  {order.stage === 'shipped' ? 'Partially Shipped' : (order.stage || 'new')}
                              </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => onView && onView(order)}
                                title="View Proforma Invoice"
                                aria-label="View Proforma Invoice"
                                className="p-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all drop-shadow-sm"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onEdit(order)}
                                title="Edit Sales Order"
                                aria-label="Edit Sales Order"
                                className="p-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all drop-shadow-sm"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>
                              {!order.is_invoiced && (
                                <button
                                  type="button"
                                  onClick={() => handleConvert(order)}
                                  title="Convert to Delivery Challan / Invoice"
                                  aria-label="Convert to Delivery Challan / Invoice"
                                  className="p-1.5 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/25 transition-all drop-shadow-sm"
                                >
                                  <ArrowPathRoundedSquareIcon className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (order.has_challans || order.has_invoices) {
                                    toast.error("Cannot delete Sales Order because a Delivery Challan or Sales Invoice has already been generated from it.");
                                    return;
                                  }
                                  onDelete(order);
                                }}
                                title={order.has_challans || order.has_invoices ? "Cannot delete: Linked Delivery Challan or Invoice exists" : "Delete Sales Order"}
                                aria-label="Delete Sales Order"
                                className={`p-1.5 rounded-lg border transition-all drop-shadow-sm ${
                                  order.has_challans || order.has_invoices
                                    ? "opacity-40 cursor-not-allowed bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)]"
                                    : "bg-[var(--status-danger)]/10 text-[var(--status-danger)] border border-[var(--status-danger)]/20 hover:bg-[var(--status-danger)]/20 hover:text-[var(--status-danger)]"
                                }`}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                      </tr>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                       <tr><td colSpan="6" className="text-center py-8 text-[var(--text-muted)]">No sales orders found</td></tr>
                  )}
              </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="lg:hidden space-y-3 px-2 mb-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
              No sales orders found.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isHighlighted = highlightedOrderId && (String(order.id) === String(highlightedOrderId));
              return (
              <div 
                key={order.id} 
                className={`rounded-xl border p-4 transition-all duration-300 ${
                  isHighlighted 
                    ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/40 ring-1 ring-[var(--accent-primary)]/40' 
                    : 'bg-[var(--bg-surface)] border-[var(--border-subtle)]'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <span>{order.order_number}</span>
                      {isHighlighted && (
                        <span className="px-2 py-0.5 text-xs font-bold uppercase bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 rounded-full">
                          Referenced
                        </span>
                      )}
                    </div>
                    {order.po_number && (
                      <div className="text-xs text-[var(--text-secondary)] font-mono mt-0.5 flex items-center gap-1">
                        <span className="font-semibold">PO: {order.po_number}</span>
                        {order.po_date && (
                          <span className="text-[var(--text-muted)] font-normal">
                            ({format(new Date(order.po_date), 'dd/MM/yyyy')})
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold mt-0.5">
                      {order.date ? format(new Date(order.date), 'dd/MM/yyyy') : '-'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-[var(--text-primary)]">{getCurrencySymbol()}{Number(order.total_amount).toLocaleString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[var(--border-subtle)] mb-4">
                   <div>
                      <div className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">Customer</div>
                      <div className="text-xs font-bold text-[var(--text-primary)] truncate">{order.customer_display_name || order.customer_name}</div>
                   </div>
                    <div className="text-right">
                       <div className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">Status</div>
                       <div className={`inline-block px-2 py-0.5 rounded-full text-xs uppercase font-bold border ${
                           order.stage === 'completed' ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border-[var(--status-success)]/30' : 
                           order.stage === 'shipped' ? 'bg-[var(--status-info)]/15 text-[var(--status-info)] border-[var(--status-info)]/30' : 
                           order.stage === 'cancelled' ? 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border-[var(--status-danger)]/30' : 
                           'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border-[var(--status-warning)]/30'
                        }`}>
                           {order.stage === 'shipped' ? 'Partially Shipped' : (order.stage || 'new')}
                       </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => onView && onView(order)}
                    title="View Proforma Invoice"
                    aria-label="View Proforma Invoice"
                    className="p-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(order)}
                    title="Edit Sales Order"
                    aria-label="Edit Sales Order"
                    className="p-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  {!order.is_invoiced && (
                    <button
                      type="button"
                      onClick={() => handleConvert(order)}
                      title="Convert to Delivery Challan / Invoice"
                      aria-label="Convert to Delivery Challan / Invoice"
                      className="p-2 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/25 transition-all"
                    >
                      <ArrowPathRoundedSquareIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (order.has_challans || order.has_invoices) {
                        toast.error("Cannot delete Sales Order because a Delivery Challan or Sales Invoice has already been generated from it.");
                        return;
                      }
                      onDelete(order);
                    }}
                    title={order.has_challans || order.has_invoices ? "Cannot delete: Linked Delivery Challan or Invoice exists" : "Delete Sales Order"}
                    aria-label="Delete Sales Order"
                    className={`p-2 rounded-lg border transition-all ${
                      order.has_challans || order.has_invoices
                        ? "opacity-40 cursor-not-allowed bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)]"
                        : "bg-[var(--status-danger)]/10 text-[var(--status-danger)] border border-[var(--status-danger)]/20 hover:bg-[var(--status-danger)]/20 hover:text-[var(--status-danger)]"
                    }`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      </>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />

      {convertOrder && (
        <SalesOrderConvertModal
          isOpen={!!convertOrder}
          onClose={() => setConvertOrder(null)}
          order={convertOrder}
        />
      )}
    </div>
  );
}
