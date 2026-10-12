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
    return <div className="text-red-500 text-center p-4">Error loading orders</div>;
  }

  const orders = Array.isArray(data) ? data : data?.results || data?.data || [];
  const totalPages = data?.total_pages || 1;
  const currentPage = data?.current_page || page;

  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });

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
    <div className="lg:bg-white/5 lg:backdrop-filter lg:backdrop-blur-20 rounded-lg lg:shadow p-0 lg:p-6 lg:border lg:border-white/10 bg-transparent border-none shadow-none backdrop-blur-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 px-4 lg:px-0 gap-4">
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-4 pr-4 py-2 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-300 bg-white/10 text-white placeholder-white/70 w-64"
        />
      </div>

      <>
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th 
                    onClick={() => handleSort("order_number")}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Order #</span>
                      {sortConfig.key === "order_number" && (
                        <span className="text-cyan-400 font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("date")}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      {sortConfig.key === "date" && (
                        <span className="text-cyan-400 font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("customer")}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Customer</span>
                      {sortConfig.key === "customer" && (
                        <span className="text-cyan-400 font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("amount")}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Amount</span>
                      {sortConfig.key === "amount" && (
                        <span className="text-cyan-400 font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("status")}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {sortConfig.key === "status" && (
                        <span className="text-cyan-400 font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                  {filteredOrders.map(order => {
                    const isHighlighted = highlightedOrderId && (String(order.id) === String(highlightedOrderId));
                    return (
                      <tr 
                        key={order.id} 
                        className={`border-b transition-colors ${
                          isHighlighted 
                            ? 'bg-purple-500/20 border-purple-500/40 ring-1 ring-purple-500/50' 
                            : 'bg-transparent border-white/5 hover:bg-white/5'
                        }`}
                      >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-white font-medium flex items-center gap-2">
                              <span>{order.order_number}</span>
                              {isHighlighted && (
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-purple-500/30 text-purple-200 border border-purple-400/40 rounded-full">
                                  Referenced
                                </span>
                              )}
                            </div>
                            {order.po_number && (
                              <div className="text-[11px] text-amber-400/90 font-mono mt-0.5 flex items-center gap-1.5">
                                <span className="font-semibold">PO: {order.po_number}</span>
                                {order.po_date && (
                                  <span className="text-gray-400 font-normal">
                                    ({format(new Date(order.po_date), 'dd/MM/yyyy')})
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-400">{order.date ? format(new Date(order.date), 'dd/MM/yyyy') : '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-white">{order.customer_display_name || order.customer_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-cyan-400 font-bold">{getCurrencySymbol()}{Number(order.total_amount).toLocaleString()}</td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider border ${
                                order.stage === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                                order.stage === 'shipped' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 
                                order.stage === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                                'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
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
                                className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/40 transition-all drop-shadow"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onEdit(order)}
                                title="Edit Sales Order"
                                aria-label="Edit Sales Order"
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 transition-all drop-shadow"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>
                              {order.stage !== 'completed' && (
                                <button
                                  type="button"
                                  onClick={() => handleConvert(order)}
                                  title="Convert to Delivery Challan / Invoice"
                                  aria-label="Convert to Delivery Challan / Invoice"
                                  className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/40 transition-all drop-shadow"
                                >
                                  <ArrowPathRoundedSquareIcon className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onDelete(order)}
                                title="Delete Sales Order"
                                aria-label="Delete Sales Order"
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 transition-all drop-shadow"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                      </tr>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                       <tr><td colSpan="6" className="text-center py-8 text-gray-500">No sales orders found</td></tr>
                  )}
              </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="lg:hidden space-y-3 px-2 mb-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10">
              No sales orders found.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isHighlighted = highlightedOrderId && (String(order.id) === String(highlightedOrderId));
              return (
              <div 
                key={order.id} 
                className={`backdrop-filter backdrop-blur-10 rounded-xl border p-3 transition-all duration-300 ${
                  isHighlighted 
                    ? 'bg-purple-500/20 border-purple-500/50 ring-1 ring-purple-500/50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      <span>{order.order_number}</span>
                      {isHighlighted && (
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-purple-500/30 text-purple-200 border border-purple-400/40 rounded-full">
                          Referenced
                        </span>
                      )}
                    </div>
                    {order.po_number && (
                      <div className="text-[10px] text-amber-400/90 font-mono mt-0.5 flex items-center gap-1">
                        <span className="font-semibold">PO: {order.po_number}</span>
                        {order.po_date && (
                          <span className="text-gray-400 font-normal">
                            ({format(new Date(order.po_date), 'dd/MM/yyyy')})
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-[10px] text-white/50 uppercase tracking-widest font-black mt-0.5">
                      {order.date ? format(new Date(order.date), 'dd/MM/yyyy') : '-'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-cyan-400">{getCurrencySymbol()}{Number(order.total_amount).toLocaleString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5 mb-4">
                   <div>
                      <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Customer</div>
                      <div className="text-xs font-bold text-white truncate">{order.customer_display_name || order.customer_name}</div>
                   </div>
                    <div className="text-right">
                       <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Status</div>
                       <div className={`inline-block px-1.5 py-0.5 rounded text-[8px] uppercase font-black ${
                           order.stage === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                           order.stage === 'shipped' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 
                           order.stage === 'cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                           'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                           {order.stage === 'shipped' ? 'Partially Shipped' : (order.stage || 'new')}
                       </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => onView && onView(order)}
                    title="View Proforma Invoice"
                    aria-label="View Proforma Invoice"
                    className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(order)}
                    title="Edit Sales Order"
                    aria-label="Edit Sales Order"
                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  {order.stage !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => handleConvert(order)}
                      title="Convert to Delivery Challan / Invoice"
                      aria-label="Convert to Delivery Challan / Invoice"
                      className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all"
                    >
                      <ArrowPathRoundedSquareIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(order)}
                    title="Delete Sales Order"
                    aria-label="Delete Sales Order"
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-300 transition-all"
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
