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

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vendor_display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mr-3"></div>
        Loading purchase orders...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by PO Number or Vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50 appearance-none"
        >
          <option value="all" className="bg-[#111]">All Statuses</option>
          <option value="draft" className="bg-[#111]">Draft</option>
          <option value="sent" className="bg-[#111]">Sent</option>
          <option value="received" className="bg-[#111]">Received (Converted)</option>
          <option value="cancelled" className="bg-[#111]">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
            <tr>
              <th className="px-6 py-4 font-medium">Order Details</th>
              <th className="px-6 py-4 font-medium">Vendor</th>
              <th className="px-6 py-4 font-medium text-right">Amount</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No purchase orders found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/[0.04] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-cyan-400">{order.po_number || "Draft"}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {order.created_at ? format(new Date(order.created_at), "MMM d, yyyy") : "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{order.vendor_display_name || order.vendor_name || "Unknown"}</div>
                    {order.expected_date && (
                      <div className="text-xs text-gray-500 mt-1">
                        Expected: {format(new Date(order.expected_date), "MMM d, yyyy")}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-white tabular-nums">
                      {getCurrencySymbol()}{parseFloat(order.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
                      order.status === 'received' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      order.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      order.status === 'sent' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                      {order.status || 'draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {order.status !== 'received' && (
                        <button
                          onClick={() => onConvert(order)}
                          className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                          title="Convert to Bill"
                        >
                          <ArrowRightCircleIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(order)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Edit Order"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDelete(order)}
                        disabled={order.status !== 'draft' && order.status !== 'cancelled'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          order.status !== 'draft' && order.status !== 'cancelled'
                            ? 'text-gray-600 cursor-not-allowed opacity-50'
                            : 'text-red-400 hover:bg-red-500/10'
                        }`}
                        title={order.status !== 'draft' && order.status !== 'cancelled' ? "Only draft or cancelled orders can be deleted" : "Delete Order"}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Fallback for touch devices where hover doesn't work well */}
                    <div className="md:hidden flex justify-end">
                      <button className="p-1.5 text-gray-400">
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
