import React, { useState, useMemo } from "react";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import { format } from "date-fns";
import {
  PencilIcon,
  TrashIcon,
  ArrowRightCircleIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export default function PurchaseOrderTable({ onEdit, onDelete, onConvert, orders = [], isLoading }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        const matchesSearch = 
          order.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.vendor_display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const { key, direction } = sortConfig;
        const factor = direction === "asc" ? 1 : -1;
        if (key === "po_number") return factor * String(a.po_number || "").localeCompare(String(b.po_number || ""), undefined, { numeric: true });
        if (key === "created_at") return factor * (new Date(a.created_at || 0) - new Date(b.created_at || 0));
        if (key === "vendor") return factor * String(a.vendor_display_name || a.vendor_name || "").localeCompare(String(b.vendor_display_name || b.vendor_name || ""));
        if (key === "amount") return factor * (Number(a.total_amount || 0) - Number(b.total_amount || 0));
        if (key === "status") return factor * String(a.status || "").localeCompare(String(b.status || ""));
        return 0;
      });
  }, [orders, searchTerm, statusFilter, sortConfig]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8 text-[var(--text-muted)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mr-3"></div>
        Loading purchase orders...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by PO Number or Vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)] appearance-none"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="received">Received (Converted)</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <table className="min-w-full divide-y divide-[var(--border-subtle)] text-left text-sm whitespace-nowrap">
          <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
            <tr className="border-b border-[var(--border-subtle)]">
              <th 
                onClick={() => handleSort("po_number")}
                className="px-6 py-4 font-bold text-[var(--text-primary)] cursor-pointer select-none hover:text-[var(--accent-primary)] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Order Details</span>
                  {sortConfig.key === "po_number" && (
                    <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort("vendor")}
                className="px-6 py-4 font-bold text-[var(--text-primary)] cursor-pointer select-none hover:text-[var(--accent-primary)] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Vendor</span>
                  {sortConfig.key === "vendor" && (
                    <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort("amount")}
                className="px-6 py-4 font-bold text-[var(--text-primary)] text-right cursor-pointer select-none hover:text-[var(--accent-primary)] transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Amount</span>
                  {sortConfig.key === "amount" && (
                    <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort("status")}
                className="px-6 py-4 font-bold text-[var(--text-primary)] text-center cursor-pointer select-none hover:text-[var(--accent-primary)] transition-colors"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Status</span>
                  {sortConfig.key === "status" && (
                    <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-4 font-bold text-[var(--text-primary)] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-[var(--text-muted)]">
                  No purchase orders found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[var(--bg-primary)] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-[var(--text-primary)]">{order.po_number || "Draft"}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">
                      {order.created_at ? format(new Date(order.created_at), "dd/MM/yyyy") : "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-[var(--text-primary)]">{order.vendor_display_name || order.vendor_name || "Unknown"}</div>
                    {order.expected_date && (
                      <div className="text-xs text-[var(--text-muted)] mt-1">
                        Expected: {format(new Date(order.expected_date), "dd/MM/yyyy")}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-[var(--text-primary)] tabular-nums">
                      {getCurrencySymbol()}{parseFloat(order.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      order.status === 'received' ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30' :
                      order.status === 'cancelled' ? 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30' :
                      order.status === 'sent' ? 'bg-[var(--status-info)]/15 text-[var(--status-info)] border border-[var(--status-info)]/30' :
                      'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30'
                    }`}>
                      {order.status || 'draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {order.status !== 'received' && (
                        <button
                          onClick={() => onConvert(order)}
                          className="p-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--text-on-accent)] transition-transform active:scale-95"
                          title="Convert to Bill"
                        >
                          <ArrowRightCircleIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(order)}
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
                        title="Edit Order"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDelete(order)}
                        disabled={order.status !== 'draft' && order.status !== 'cancelled'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          order.status !== 'draft' && order.status !== 'cancelled'
                            ? 'text-[var(--text-muted)] cursor-not-allowed opacity-50'
                            : 'text-[var(--status-danger)] border border-[var(--status-danger)]/20 hover:bg-[var(--status-danger)]/10'
                        }`}
                        title={order.status !== 'draft' && order.status !== 'cancelled' ? "Only draft or cancelled orders can be deleted" : "Delete Order"}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Fallback for touch devices where hover doesn't work well */}
                    <div className="md:hidden flex justify-end">
                      <button className="p-1.5 text-[var(--text-muted)]">
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
