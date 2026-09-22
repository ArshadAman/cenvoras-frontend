import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDeliveryChallans, deleteDeliveryChallan, convertToInvoice } from "../../api/delivery_challan";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { 
  EyeIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  ArrowPathRoundedSquareIcon,
  TruckIcon,
  DocumentCheckIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  ArrowTopRightOnSquareIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";
import { getCurrencySymbol } from "../../utils/currency";

const COLUMN_OPTIONS = [
  { id: "date", label: "Date" },
  { id: "customer", label: "Customer" },
  { id: "sales_order", label: "Ref Order" },
  { id: "transport", label: "Transport / Vehicle" },
  { id: "items", label: "Items" },
  { id: "total_amount", label: "Total Value" },
  { id: "status", label: "Status" },
];

export default function DeliveryChallanTable({ onEdit, onView, onConvertSuccess }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilterTab, setStatusFilterTab] = useState("all"); // "all", "open", "invoiced", "cancelled"
  const [page, setPage] = useState(1);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem("challan_table_columns");
      if (saved) {
        return {
          date: true,
          customer: true,
          sales_order: true,
          transport: true,
          items: true,
          total_amount: true,
          status: true,
          ...JSON.parse(saved),
        };
      }
    } catch (e) {
      console.error("Failed to load saved columns", e);
    }
    return {
      date: true,
      customer: true,
      sales_order: true,
      transport: true,
      items: true,
      total_amount: true,
      status: true,
    };
  });

  const toggleColumn = (id) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("challan_table_columns", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save columns", e);
      }
      return next;
    });
  };

  const handleOpenSalesOrder = (salesOrder, salesOrderNumber) => {
    if (!salesOrder && !salesOrderNumber) return;
    const orderId = typeof salesOrder === "object" ? salesOrder.id : salesOrder;
    const orderNum = salesOrderNumber || (typeof salesOrder === "object" ? salesOrder.order_number : "");
    const params = new URLSearchParams();
    if (orderId) params.set("orderId", String(orderId));
    if (orderNum) params.set("orderNumber", String(orderNum));
    navigate(`/sales-orders?${params.toString()}`);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["deliveryChallans", search, statusFilterTab, page],
    queryFn: () => getDeliveryChallans({ 
      search: search || undefined, 
      status: statusFilterTab !== "all" ? statusFilterTab : undefined,
      page 
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDeliveryChallan,
    onSuccess: () => {
      toast.success("Delivery Challan deleted and stock restored");
      queryClient.invalidateQueries({ queryKey: ["deliveryChallans"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || "Failed to delete challan");
    }
  });

  const convertMutation = useMutation({
    mutationFn: convertToInvoice,
    onSuccess: (resp) => {
      toast.success(`Successfully converted to Invoice #${resp.invoice_number}!`);
      queryClient.invalidateQueries({ queryKey: ["deliveryChallans"] });
      queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      if (onConvertSuccess) {
        onConvertSuccess(resp);
      }
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err.message ||
        "Failed to convert challan to invoice";
      toast.error(msg);
    }
  });

  const handleConvert = (challan) => {
    if (challan.is_billed || challan.status === 'invoiced') {
      toast.info("This challan has already been converted to an invoice.");
      return;
    }
    if (window.confirm(`Convert Delivery Challan #${challan.challan_number} to a Sales Invoice? Inventory will not be double-deducted.`)) {
      convertMutation.mutate(challan.id);
    }
  };

  const handleDelete = (challan) => {
    if (challan.is_billed || challan.status === 'invoiced') {
      toast.warning("Cannot delete an invoiced challan directly. Please cancel the linked invoice first.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete Delivery Challan #${challan.challan_number}? Stock will be returned to inventory.`)) {
      deleteMutation.mutate(challan.id);
    }
  };

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold text-white mb-1">Error loading delivery challans</h3>
        <p className="text-sm text-red-300 mb-4">{error.message}</p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["deliveryChallans"] })}
          className="btn-secondary text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const challansRaw = Array.isArray(data)
    ? data
    : data?.data || data?.results || [];

  const filteredChallans = challansRaw
    .filter((challan) => {
      const q = search.toLowerCase();
      const matchesSearch =
        challan.challan_number?.toLowerCase().includes(q) ||
        challan.customer_name?.toLowerCase().includes(q) ||
        challan.vehicle_number?.toLowerCase().includes(q) ||
        challan.sales_order_number?.toLowerCase().includes(q) ||
        challan.sales_order_details?.order_number?.toLowerCase().includes(q) ||
        String(challan.sales_order || "").toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilterTab === "all") return true;
      if (statusFilterTab === "invoiced") return challan.is_billed || challan.status === "invoiced";
      if (statusFilterTab === "open") return !challan.is_billed && challan.status !== "invoiced" && challan.status !== "cancelled";
      if (statusFilterTab === "cancelled") return challan.status === "cancelled";
      return true;
    })
    .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));

  const statusTabs = [
    { id: "all", label: "All Challans" },
    { id: "open", label: "Open / Dispatched" },
    { id: "invoiced", label: "Invoiced" },
    { id: "cancelled", label: "Cancelled" },
  ];

  const visibleColumnCount = 2 + Object.values(visibleColumns).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl overflow-x-auto no-scrollbar">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilterTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilterTab === tab.id
                  ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Columns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search challan, order #, vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 bg-[#111] text-white text-sm placeholder-gray-500 outline-none"
            />
          </div>

          {/* Column Visibility Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnDropdown((prev) => !prev)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-colors"
              title="Toggle Columns"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Columns</span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {showColumnDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowColumnDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-[#161616] border border-white/15 rounded-xl shadow-2xl p-2 z-30 backdrop-blur-xl">
                  <div className="px-2 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/10 mb-1">
                    Toggle Columns
                  </div>
                  <div className="space-y-1">
                    {COLUMN_OPTIONS.map((col) => (
                      <label
                        key={col.id}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-xs text-gray-200 select-none"
                      >
                        <input
                          type="checkbox"
                          checked={!!visibleColumns[col.id]}
                          onChange={() => toggleColumn(col.id)}
                          className="rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-left">
              <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider rounded-l-lg">
                Challan #
              </th>
              {visibleColumns.date && (
                <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Date
                </th>
              )}
              {visibleColumns.customer && (
                <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
              )}
              {visibleColumns.sales_order && (
                <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Ref Order
                </th>
              )}
              {visibleColumns.transport && (
                <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Transport / Vehicle
                </th>
              )}
              {visibleColumns.items && (
                <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Items
                </th>
              )}
              {visibleColumns.total_amount && (
                <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Total Value
                </th>
              )}
              {visibleColumns.status && (
                <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              )}
              <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider rounded-r-lg text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={visibleColumnCount} className="px-6 py-12 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  </div>
                </td>
              </tr>
            ) : filteredChallans.length === 0 ? (
              <tr>
                <td colSpan={visibleColumnCount} className="px-6 py-12 text-center text-gray-400">
                  No delivery challans found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredChallans.map((challan) => {
                const isInvoiced = challan.is_billed || challan.status === "invoiced";
                return (
                  <tr
                    key={challan.id}
                    className="bg-transparent border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <TruckIcon className="w-4 h-4 text-cyan-400" />
                        #{challan.challan_number}
                      </div>
                      {challan.converted_invoice && (
                        <div className="text-[11px] text-emerald-400 mt-0.5">
                          Inv #{challan.converted_invoice}
                        </div>
                      )}
                    </td>
                    {visibleColumns.date && (
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-400">
                        {challan.date ? format(new Date(challan.date), "MMM dd, yyyy") : "—"}
                      </td>
                    )}
                    {visibleColumns.customer && (
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-white">{challan.customer_name}</div>
                        {challan.customer_gstin && (
                          <div className="text-[11px] text-gray-500 font-mono">
                            {challan.customer_gstin}
                          </div>
                        )}
                      </td>
                    )}
                    {visibleColumns.sales_order && (
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {challan.sales_order || challan.sales_order_number ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSalesOrder(challan.sales_order, challan.sales_order_number);
                            }}
                            className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 border border-purple-500/30 hover:border-purple-400/50 transition-all font-mono text-xs font-semibold cursor-pointer shadow-sm shadow-purple-500/5"
                            title={`Click to open Sales Order ${challan.sales_order_number || ''} in Sales Orders page`}
                          >
                            <ClipboardDocumentListIcon className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                            <span>{challan.sales_order_number || challan.sales_order_details?.order_number || `SO #${String(challan.sales_order).slice(0, 8)}`}</span>
                            <ArrowTopRightOnSquareIcon className="w-3 h-3 text-purple-400/70 group-hover:text-purple-200 transition-colors" />
                          </button>
                        ) : (
                          <span className="text-gray-500 text-xs italic">—</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.transport && (
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {challan.vehicle_number ? (
                          <div className="text-sm text-gray-200 font-mono font-medium">
                            {challan.vehicle_number}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs italic">Not specified</span>
                        )}
                        {challan.transport_mode && (
                          <div className="text-[10px] uppercase text-gray-400 tracking-wider">
                            Mode: {challan.transport_mode}
                          </div>
                        )}
                      </td>
                    )}
                    {visibleColumns.items && (
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-300">
                        {challan.items?.length || 0} item{challan.items?.length === 1 ? "" : "s"}
                      </td>
                    )}
                    {visibleColumns.total_amount && (
                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-cyan-400">
                        {getCurrencySymbol()}
                        {Number(challan.total_amount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {isInvoiced ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <DocumentCheckIcon className="w-3.5 h-3.5" />
                            Invoiced
                          </span>
                        ) : challan.status === "cancelled" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] uppercase font-bold tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                            Cancelled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] uppercase font-bold tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            Open / Dispatched
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onView(challan)}
                          title="View Preview & PDF"
                          className="px-2.5 py-1.5 bg-white/5 text-gray-300 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-xs font-medium flex items-center gap-1"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                          View
                        </button>

                        {!isInvoiced && (
                          <>
                            <button
                              onClick={() => onEdit(challan)}
                              title="Edit Challan"
                              className="px-2.5 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/20 transition-colors text-xs font-medium flex items-center gap-1"
                            >
                              <PencilSquareIcon className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleConvert(challan)}
                              title="Convert to Sales Invoice (No double stock decrement)"
                              className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors text-xs font-medium flex items-center gap-1"
                            >
                              <ArrowPathRoundedSquareIcon className="w-3.5 h-3.5" />
                              Convert
                            </button>
                            <button
                              onClick={() => handleDelete(challan)}
                              title="Delete Challan & Restore Stock"
                              className="px-2.5 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors text-xs font-medium flex items-center gap-1"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
          </div>
        ) : filteredChallans.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white/5 rounded-xl border border-white/10">
            No delivery challans found.
          </div>
        ) : (
          filteredChallans.map((challan) => {
            const isInvoiced = challan.is_billed || challan.status === "invoiced";
            return (
              <div
                key={challan.id}
                className="bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10 p-4 space-y-4 hover:bg-white/10 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-bold text-white flex items-center gap-1.5">
                      <TruckIcon className="w-4 h-4 text-cyan-400" />
                      #{challan.challan_number}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {challan.date ? format(new Date(challan.date), "dd MMM, yyyy") : "—"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-cyan-400">
                      {getCurrencySymbol()}
                      {Number(challan.total_amount || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="mt-1">
                      {isInvoiced ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Invoiced
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          Open
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/5 text-xs">
                  {visibleColumns.customer && (
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-bold">Customer</span>
                      <span className="text-white font-medium truncate block">{challan.customer_name}</span>
                    </div>
                  )}
                  {visibleColumns.transport && (
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-bold">Vehicle</span>
                      <span className="text-white font-mono">{challan.vehicle_number || "—"}</span>
                    </div>
                  )}
                  {visibleColumns.items && (
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-bold">Items</span>
                      <span className="text-white">{challan.items?.length || 0} items</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">E-Way Bill</span>
                    <span className="text-white font-mono">{challan.eway_bill_number || "—"}</span>
                  </div>
                </div>

                {/* Ref Sales Order (Mobile) */}
                {visibleColumns.sales_order && (challan.sales_order || challan.sales_order_number) && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <span className="text-[10px] text-purple-300/80 font-bold uppercase tracking-wider flex items-center gap-1">
                      <ClipboardDocumentListIcon className="w-3.5 h-3.5 text-purple-400" />
                      Ref Sales Order
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenSalesOrder(challan.sales_order, challan.sales_order_number)}
                      className="text-xs font-mono font-bold text-purple-300 hover:text-purple-100 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-colors"
                      title="Click to open this Sales Order"
                    >
                      <span>{challan.sales_order_number || challan.sales_order_details?.order_number || `SO #${String(challan.sales_order).slice(0, 8)}`}</span>
                      <ArrowTopRightOnSquareIcon className="w-3 h-3 text-purple-400" />
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onView(challan)}
                    className="flex-1 min-w-[70px] py-2 bg-white/5 text-white border border-white/10 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-white/10"
                  >
                    <EyeIcon className="w-3.5 h-3.5" /> View
                  </button>

                  {!isInvoiced && (
                    <>
                      <button
                        onClick={() => onEdit(challan)}
                        className="flex-1 min-w-[70px] py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-cyan-500/20"
                      >
                        <PencilSquareIcon className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleConvert(challan)}
                        className="flex-1 min-w-[80px] py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-500/20"
                      >
                        <ArrowPathRoundedSquareIcon className="w-3.5 h-3.5" /> Convert
                      </button>
                      <button
                        onClick={() => handleDelete(challan)}
                        className="py-2 px-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold flex items-center justify-center hover:bg-red-500/20"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
