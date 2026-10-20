import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDeliveryChallans, deleteDeliveryChallan, convertToInvoice, bulkConvertToInvoice, bulkDeleteDeliveryChallans } from "../../api/delivery_challan";
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
  ChevronDownIcon,
  CurrencyRupeeIcon
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

export default function DeliveryChallanTable({ onEdit, onView, onViewInvoice, onConvertSuccess }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilterTab, setStatusFilterTab] = useState("all"); // "all", "open", "invoiced", "cancelled"
  const [page] = useState(1);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [selectedChallans, setSelectedChallans] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });

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

  const bulkConvertMutation = useMutation({
    mutationFn: bulkConvertToInvoice,
    onSuccess: (resp) => {
      toast.success(resp?.message || `Successfully converted ${selectedChallans.size} Challans to Invoice!`);
      setSelectedChallans(new Set());
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
        "Failed to convert challans";
      toast.error(msg);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteDeliveryChallans,
    onSuccess: (resp) => {
      toast.success(resp?.message || `Successfully deleted ${selectedChallans.size} delivery challan(s)!`);
      setSelectedChallans(new Set());
      queryClient.invalidateQueries({ queryKey: ["deliveryChallans"] });
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err.message ||
        "Failed to delete selected delivery challans";
      toast.error(msg);
    }
  });

  const handleBulkConvert = () => {
    if (selectedChallans.size === 0) return;
    const selectedList = filteredChallans.filter((c) => selectedChallans.has(c.id));
    const alreadyBilled = selectedList.filter((c) => c.is_billed || c.status === "invoiced");
    if (alreadyBilled.length > 0) {
      toast.error(`Challan(s) ${alreadyBilled.map((c) => c.challan_number).join(", ")} have already been converted.`);
      return;
    }
    const customerKeys = new Set(selectedList.map((c) => c.customer?.id || c.customer_name || ""));
    if (customerKeys.size > 1) {
      toast.error("Please select Delivery Challans for the same customer to convert into a single Sales Invoice.");
      return;
    }
    if (window.confirm(`Convert ${selectedChallans.size} selected Delivery Challans into a single consolidated Sales Invoice?`)) {
      bulkConvertMutation.mutate(Array.from(selectedChallans));
    }
  };

  const handleBulkDelete = () => {
    if (selectedChallans.size === 0) return;
    const selectedList = filteredChallans.filter((c) => selectedChallans.has(c.id));
    const alreadyBilled = selectedList.filter((c) => c.is_billed || c.status === "invoiced");
    if (alreadyBilled.length > 0) {
      toast.error(`Cannot delete challan(s) ${alreadyBilled.map((c) => c.challan_number).join(", ")} because they are already converted to an invoice.`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedChallans.size} selected Delivery Challan(s)? Stock will be restored and linked Sales Orders updated.`)) {
      bulkDeleteMutation.mutate(Array.from(selectedChallans));
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const toggleSelectAll = () => {
    if (selectedChallans.size === filteredChallans.length && filteredChallans.length > 0) {
      setSelectedChallans(new Set());
    } else {
      setSelectedChallans(new Set(filteredChallans.map((c) => c.id)));
    }
  };

  const toggleSelectChallan = (id) => {
    setSelectedChallans((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
      <div className="bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/20 rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Error loading delivery challans</h3>
        <p className="text-sm text-[var(--status-danger)] mb-4">{error.message}</p>
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
      if (statusFilterTab === "draft") return challan.status === "draft";
      if (statusFilterTab === "open") return challan.status === "open" && !challan.is_billed;
      if (statusFilterTab === "invoiced") return Boolean(challan.converted_invoice && (challan.is_billed || challan.status === "invoiced" || challan.status === "billed"));
      return true;
    })
    .sort((a, b) => {
      const dir = sortConfig.direction === "asc" ? 1 : -1;
      if (sortConfig.key === "date") {
        return (new Date(a.date || a.created_at) - new Date(b.date || b.created_at)) * dir;
      }
      if (sortConfig.key === "challan_number") {
        return String(a.challan_number || "").localeCompare(String(b.challan_number || "")) * dir;
      }
      if (sortConfig.key === "customer_name") {
        return String(a.customer_name || "").localeCompare(String(b.customer_name || "")) * dir;
      }
      if (sortConfig.key === "total_amount") {
        return (Number(a.total_amount || 0) - Number(b.total_amount || 0)) * dir;
      }
      if (sortConfig.key === "status") {
        return String(a.status || "").localeCompare(String(b.status || "")) * dir;
      }
      return 0;
    });

  const statusTabs = [
    { id: "all", label: "All Challans" },
    { id: "draft", label: "Drafts" },
    { id: "open", label: "Open / Dispatched" },
    { id: "invoiced", label: "Invoiced" },
  ];

  const visibleColumnCount = 3 + Object.values(visibleColumns).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filter Tabs & Bulk Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl overflow-x-auto no-scrollbar">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilterTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilterTab === tab.id
                    ? "bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {selectedChallans.size > 0 && (
            <div className="flex items-center gap-2 animate-fade-in">
              <button
                type="button"
                onClick={handleBulkConvert}
                disabled={bulkConvertMutation.isPending || bulkDeleteMutation.isPending}
                className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                title="Convert selected delivery challans into a single consolidated Sales Invoice"
              >
                <CurrencyRupeeIcon className="w-4 h-4" />
                <span>Convert to Invoice ({selectedChallans.size})</span>
              </button>

              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending || bulkConvertMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30 hover:bg-[var(--status-danger)]/25 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                title="Bulk delete selected delivery challans and restore inventory"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Delete Selected ({selectedChallans.size})</span>
              </button>
            </div>
          )}
        </div>

        {/* Search & Columns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search challan, order #, vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-[var(--accent-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)]"
            />
          </div>

          {/* Column Visibility Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnDropdown((prev) => !prev)}
              className="flex items-center gap-2 px-3.5 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl text-sm font-medium transition-colors"
              title="Toggle Columns"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="hidden sm:inline">Columns</span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>

            {showColumnDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowColumnDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl p-2 z-30">
                  <div className="px-2 py-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)] mb-1">
                    Toggle Columns
                  </div>
                  <div className="space-y-1">
                    {COLUMN_OPTIONS.map((col) => (
                      <label
                        key={col.id}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-primary)]/40 cursor-pointer text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] select-none"
                      >
                        <input
                          type="checkbox"
                          checked={!!visibleColumns[col.id]}
                          onChange={() => toggleColumn(col.id)}
                          className="rounded border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/50 cursor-pointer"
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
            <tr className="bg-[var(--bg-primary)]/40 border-b border-[var(--border-subtle)] text-left">
              <th className="px-4 py-3.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider rounded-l-lg w-10 text-center">
                <input
                  type="checkbox"
                  checked={filteredChallans.length > 0 && selectedChallans.size === filteredChallans.length}
                  onChange={toggleSelectAll}
                  className="rounded border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/50 cursor-pointer"
                  title="Select All"
                />
              </th>
              <th
                onClick={() => handleSort("challan_number")}
                className="px-5 py-3.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Challan #</span>
                  {sortConfig.key === "challan_number" && (
                    <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              {visibleColumns.date && (
                <th
                  onClick={() => handleSort("date")}
                  className="px-5 py-3.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    {sortConfig.key === "date" && (
                      <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              )}
              {visibleColumns.customer && (
                <th
                  onClick={() => handleSort("customer_name")}
                  className="px-5 py-3.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Customer</span>
                    {sortConfig.key === "customer_name" && (
                      <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              )}
              {visibleColumns.sales_order && (
                <th className="px-5 py-3.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Ref Order
                </th>
              )}
              {visibleColumns.transport && (
                <th className="px-5 py-3.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Transport / Vehicle
                </th>
              )}
              {visibleColumns.items && (
                <th className="px-5 py-3.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Items
                </th>
              )}
              {visibleColumns.total_amount && (
                <th
                  onClick={() => handleSort("total_amount")}
                  className="px-5 py-3.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Total Value</span>
                    {sortConfig.key === "total_amount" && (
                      <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              )}
              {visibleColumns.status && (
                <th
                  onClick={() => handleSort("status")}
                  className="px-5 py-3.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {sortConfig.key === "status" && (
                      <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              )}
              <th className="px-5 py-3.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider rounded-r-lg text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={visibleColumnCount} className="px-6 py-12 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
                  </div>
                </td>
              </tr>
            ) : filteredChallans.length === 0 ? (
              <tr>
                <td colSpan={visibleColumnCount} className="px-6 py-12 text-center text-[var(--text-muted)]">
                  No delivery challans found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredChallans.map((challan) => {
                const isInvoiced = Boolean(challan.converted_invoice && (challan.is_billed || challan.status === "invoiced" || challan.status === "billed"));
                const isDraft = challan.status === "draft";
                const isSelected = selectedChallans.has(challan.id);
                return (
                  <tr
                    key={challan.id}
                    className={`bg-transparent border-b border-[var(--border-subtle)] hover:bg-[var(--bg-primary)]/30 transition-colors ${
                      isSelected ? "bg-[var(--accent-primary)]/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectChallan(challan.id)}
                        className="rounded border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/50 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <TruckIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                        #{challan.challan_number}
                      </div>
                      {challan.converted_invoice && (
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onViewInvoice) {
                                onViewInvoice(challan.converted_invoice);
                              } else {
                                navigate(`/sales?invoice=${challan.converted_invoice}`);
                              }
                            }}
                            className="text-xs font-mono font-semibold text-[var(--status-success)] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                            title="Click to view converted invoice"
                          >
                            <span>Inv #{challan.converted_invoice_number || challan.converted_invoice}</span>
                            <ArrowTopRightOnSquareIcon className="w-3 h-3 text-[var(--status-success)]" />
                          </button>
                        </div>
                      )}
                    </td>
                    {visibleColumns.date && (
                      <td className="px-5 py-3.5 whitespace-nowrap text-[var(--text-secondary)]">
                        {challan.date ? format(new Date(challan.date), "dd/MM/yyyy") : "—"}
                      </td>
                    )}
                    {visibleColumns.customer && (
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-[var(--text-primary)]">{challan.customer_name}</div>
                        {challan.customer_gstin && (
                          <div className="text-xs text-[var(--text-muted)] font-mono">
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
                            className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/25 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 transition-all font-mono text-xs font-semibold cursor-pointer shadow-sm"
                            title={`Click to open Sales Order ${challan.sales_order_number || ''} in Sales Orders page`}
                          >
                            <ClipboardDocumentListIcon className="w-3.5 h-3.5 text-[var(--accent-primary)] group-hover:scale-110 transition-transform" />
                            <span>{challan.sales_order_number || challan.sales_order_details?.order_number || `SO #${String(challan.sales_order).slice(0, 8)}`}</span>
                            <ArrowTopRightOnSquareIcon className="w-3 h-3 text-[var(--accent-primary)] transition-colors" />
                          </button>
                        ) : (
                          <span className="text-[var(--text-muted)] text-xs italic">—</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.transport && (
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {challan.vehicle_number ? (
                          <div className="text-sm text-[var(--text-primary)] font-mono font-medium">
                            {challan.vehicle_number}
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)] text-xs italic">Not specified</span>
                        )}
                        {challan.transport_mode && (
                          <div className="text-xs uppercase text-[var(--text-muted)] tracking-wider">
                            Mode: {challan.transport_mode}
                          </div>
                        )}
                      </td>
                    )}
                    {visibleColumns.items && (
                      <td className="px-5 py-3.5 whitespace-nowrap text-[var(--text-secondary)]">
                        {challan.items?.length || 0} item{challan.items?.length === 1 ? "" : "s"}
                      </td>
                    )}
                    {visibleColumns.total_amount && (
                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-[var(--text-primary)]">
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
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs uppercase font-bold tracking-wider bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30">
                            <DocumentCheckIcon className="w-3.5 h-3.5" />
                            Invoiced
                          </span>
                        ) : isDraft ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs uppercase font-bold tracking-wider bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30">
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs uppercase font-bold tracking-wider bg-[var(--status-info)]/15 text-[var(--status-info)] border border-[var(--status-info)]/30">
                            Open / Dispatched
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onView(challan)}
                          title="View Preview & PDF"
                          aria-label="View Preview & PDF"
                          className="p-1.5 bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-lg hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>

                        {!isInvoiced && (
                          <>
                            <button
                              type="button"
                              onClick={() => onEdit(challan)}
                              title="Edit Challan"
                              aria-label="Edit Challan"
                              className="p-1.5 bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-lg hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            {!isDraft && (
                              <button
                                type="button"
                                onClick={() => handleConvert(challan)}
                                title="Convert to Sales Invoice (No double stock decrement)"
                                aria-label="Convert to Sales Invoice"
                                className="p-1.5 bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 rounded-lg hover:bg-[var(--accent-primary)]/25 transition-colors"
                              >
                                <ArrowPathRoundedSquareIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(challan)}
                              title={isDraft ? "Delete Draft" : "Delete Challan & Restore Stock"}
                              aria-label={isDraft ? "Delete Draft" : "Delete Challan & Restore Stock"}
                              className="p-1.5 bg-[var(--status-danger)]/10 text-[var(--status-danger)] border border-[var(--status-danger)]/20 rounded-lg hover:bg-[var(--status-danger)]/20 hover:text-[var(--status-danger)] transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto"></div>
          </div>
        ) : filteredChallans.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
            No delivery challans found.
          </div>
        ) : (
          filteredChallans.map((challan) => {
            const isInvoiced = Boolean(challan.converted_invoice && (challan.is_billed || challan.status === "invoiced" || challan.status === "billed"));
            const isDraft = challan.status === "draft";
            const isSelected = selectedChallans.has(challan.id);
            return (
              <div
                key={challan.id}
                className={`bg-[var(--bg-surface)] rounded-xl border p-4 space-y-4 transition-all ${
                  isSelected ? "border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/5" : "border-[var(--border-subtle)]"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectChallan(challan.id)}
                      className="mt-1 rounded border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/50 cursor-pointer"
                    />
                    <div>
                      <div className="text-base font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <TruckIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                        #{challan.challan_number}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {challan.date ? format(new Date(challan.date), "dd/MM/yyyy") : "—"}
                      </div>
                      {challan.converted_invoice && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewInvoice) {
                              onViewInvoice(challan.converted_invoice);
                            } else {
                              navigate(`/sales?invoice=${challan.converted_invoice}`);
                            }
                          }}
                          className="mt-1 text-xs font-mono font-semibold text-[var(--status-success)] hover:underline flex items-center gap-1 transition-colors"
                          title="Click to view converted invoice"
                        >
                          <span>Inv #{challan.converted_invoice_number || challan.converted_invoice}</span>
                          <ArrowTopRightOnSquareIcon className="w-3 h-3 text-[var(--status-success)]" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-[var(--text-primary)]">
                      {getCurrencySymbol()}
                      {Number(challan.total_amount || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="mt-1">
                      {isInvoiced ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs uppercase font-bold tracking-wider bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30">
                          Invoiced
                        </span>
                      ) : isDraft ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs uppercase font-bold tracking-wider bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30">
                          Draft
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs uppercase font-bold tracking-wider bg-[var(--status-info)]/15 text-[var(--status-info)] border border-[var(--status-info)]/30">
                          Open
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-[var(--border-subtle)] text-xs">
                  {visibleColumns.customer && (
                    <div>
                      <span className="text-[var(--text-muted)] block text-xs uppercase font-bold">Customer</span>
                      <span className="text-[var(--text-primary)] font-medium truncate block">{challan.customer_name}</span>
                    </div>
                  )}
                  {visibleColumns.transport && (
                    <div>
                      <span className="text-[var(--text-muted)] block text-xs uppercase font-bold">Vehicle</span>
                      <span className="text-[var(--text-primary)] font-mono">{challan.vehicle_number || "—"}</span>
                    </div>
                  )}
                  {visibleColumns.items && (
                    <div>
                      <span className="text-[var(--text-muted)] block text-xs uppercase font-bold">Items</span>
                      <span className="text-[var(--text-primary)]">{challan.items?.length || 0} items</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[var(--text-muted)] block text-xs uppercase font-bold">E-Way Bill</span>
                    <span className="text-[var(--text-primary)] font-mono">{challan.eway_bill_number || "—"}</span>
                  </div>
                </div>

                {/* Ref Sales Order (Mobile) */}
                {visibleColumns.sales_order && (challan.sales_order || challan.sales_order_number) && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30">
                    <span className="text-xs text-[var(--accent-primary)] font-bold uppercase tracking-wider flex items-center gap-1">
                      <ClipboardDocumentListIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      Ref Sales Order
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenSalesOrder(challan.sales_order, challan.sales_order_number)}
                      className="text-xs font-mono font-bold text-[var(--accent-primary)] hover:underline flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 transition-colors"
                      title="Click to open this Sales Order"
                    >
                      <span>{challan.sales_order_number || challan.sales_order_details?.order_number || `SO #${String(challan.sales_order).slice(0, 8)}`}</span>
                      <ArrowTopRightOnSquareIcon className="w-3 h-3 text-[var(--accent-primary)]" />
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => onView(challan)}
                    title="View Preview & PDF"
                    aria-label="View Preview & PDF"
                    className="p-2 bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-lg hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>

                  {!isInvoiced && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(challan)}
                        title="Edit Challan"
                        aria-label="Edit Challan"
                        className="p-2 bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-lg hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      {!isDraft && (
                        <button
                          type="button"
                          onClick={() => handleConvert(challan)}
                          title="Convert to Sales Invoice (No double stock decrement)"
                          aria-label="Convert to Sales Invoice"
                          className="p-2 bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 rounded-lg hover:bg-[var(--accent-primary)]/25 transition-colors"
                        >
                          <ArrowPathRoundedSquareIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(challan)}
                        title={isDraft ? "Delete Draft" : "Delete Challan & Restore Stock"}
                        aria-label={isDraft ? "Delete Draft" : "Delete Challan & Restore Stock"}
                        className="p-2 bg-[var(--status-danger)]/10 text-[var(--status-danger)] border border-[var(--status-danger)]/20 rounded-lg hover:bg-[var(--status-danger)]/20 hover:text-[var(--status-danger)] transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
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
