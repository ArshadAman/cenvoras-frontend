import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSalesInvoices, deleteSalesInvoice, exportSalesInvoicesCsv, getSalesCsvJobStatus, downloadSalesCsv } from "../../api/sales";
import { format } from "date-fns";
import { toast } from "react-toastify";
import AdvancedSalesFilters from "./AdvancedSalesFilters";
import { 
  ArrowDownTrayIcon, 
  EyeIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  CurrencyDollarIcon, 
  BanknotesIcon, 
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { useEffect } from "react";
import PaymentForm from "../ledger/PaymentForm";
import { getCurrencySymbol } from '../../utils/currency';

const COLUMN_OPTIONS = [
  { id: "customer", label: "Customer" },
  { id: "po_number", label: "Purchase Order" },
  { id: "untaxed_amount", label: "Amount (Before Tax)" },
  { id: "total_amount", label: "Total Amount" },
  { id: "status", label: "Status" },
  { id: "items", label: "Items" },
];

const DEFAULT_COLUMN_WIDTHS = {
  checkbox: 44,
  invoice_number: 125,
  invoice_date: 105,
  customer: 190,
  po_number: 130,
  untaxed_amount: 130,
  total_amount: 145,
  status: 95,
  items: 75,
  actions: 145,
};

export default function SalesTable({
  onEdit,
  onView,
  onDelete,
  initialStatusFilter = "all",
  hideStatusTabs = false,
  documentType = "invoice",
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-invoice_date"); // default: newest first
  const [page] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [statusFilterTab, setStatusFilterTab] = useState(initialStatusFilter); // "all", "final", "draft"
  const [dateFilter] = useState({ start: "", end: "" });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "invoice_date", direction: "desc" });
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem("sales_table_columns");
      if (saved) {
        return {
          customer: true,
          po_number: true,
          untaxed_amount: true,
          total_amount: true,
          status: true,
          items: true,
          ...JSON.parse(saved),
        };
      }
    } catch (e) {
      console.error("Failed to load saved columns", e);
    }
    return {
      customer: true,
      po_number: true,
      untaxed_amount: true,
      total_amount: true,
      status: true,
      items: true,
    };
  });

  const toggleColumn = (id) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("sales_table_columns", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save columns", e);
      }
      return next;
    });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const [colWidths, setColWidths] = useState(() => {
    try {
      const saved = localStorage.getItem("cenvoras_sales_table_col_widths");
      if (saved) {
        return { ...DEFAULT_COLUMN_WIDTHS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to load saved column widths", e);
    }
    return DEFAULT_COLUMN_WIDTHS;
  });

  const handleMouseDownResize = (e, colKey) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[colKey] || DEFAULT_COLUMN_WIDTHS[colKey] || 100;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const minWidth = colKey === "checkbox" ? 36 : 50;
      const newWidth = Math.max(minWidth, startWidth + deltaX);
      setColWidths((prev) => {
        const updated = { ...prev, [colKey]: newWidth };
        try {
          localStorage.setItem("cenvoras_sales_table_col_widths", JSON.stringify(updated));
        } catch (err) {
          console.error("Failed to save column widths", err);
        }
        return updated;
      });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleDoubleClickReset = (colKey) => {
    setColWidths((prev) => {
      const updated = { ...prev, [colKey]: DEFAULT_COLUMN_WIDTHS[colKey] };
      try {
        localStorage.setItem("cenvoras_sales_table_col_widths", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save column widths", err);
      }
      return updated;
    });
  };

  const renderResizeHandle = (colKey) => (
    <div
      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-cyan-400/50 active:bg-cyan-400 transition-colors z-20 group"
      onMouseDown={(e) => handleMouseDownResize(e, colKey)}
      onDoubleClick={() => handleDoubleClickReset(colKey)}
      title="Drag to resize, double-click to reset"
    >
      <div className="w-0.5 h-full mx-auto bg-transparent group-hover:bg-cyan-400/70" />
    </div>
  );

  const [isExporting, setIsExporting] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: { start: "", end: "" },
    amountRange: { min: "", max: "" },
    customer: "",
    status: "all",
    hasOverdue: false,
  });

  useEffect(() => {
    setStatusFilterTab(initialStatusFilter);
  }, [initialStatusFilter]);

  const docLabel = documentType === "quotation" ? "quotation" : "invoice";
  const docLabelPlural = documentType === "quotation" ? "quotations" : "invoices";
  const canEditInvoice = (invoice) => String(invoice?.payment_status || 'pending').toLowerCase() === 'pending';
  const editInvoiceTooltip = (invoice) => canEditInvoice(invoice)
    ? 'Edit invoice'
    : 'Only pending invoices can be edited.';
  const getDeleteTooltip = (invoice) => {
    const paymentStatus = String(invoice?.payment_status || 'pending').toLowerCase();
    return paymentStatus === 'pending'
      ? 'Delete invoice'
      : 'Only pending invoices can be deleted.';
  };

  const canDeleteInvoice = (invoice) => String(invoice?.payment_status || 'pending').toLowerCase() === 'pending';
  const canRecordPayment = (invoice) => {
    const paymentStatus = String(invoice?.payment_status || 'pending').toLowerCase();
    return invoice?.status === 'final' && ['pending', 'partial_paid'].includes(paymentStatus);
  };

  const openPaymentForInvoice = (invoice) => {
    if (!canRecordPayment(invoice)) return;
    setPaymentInvoice(invoice);
  };

  const closePaymentModal = () => setPaymentInvoice(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["salesInvoices", search, ordering, page, statusFilterTab],
    queryFn: () => getSalesInvoices({ search, ordering, page, status: statusFilterTab }),
  });

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold text-white mb-1">Error loading {docLabelPlural}</h3>
        <p className="text-sm text-red-300 mb-4">{error.message}</p>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="btn-secondary text-sm"
        >
          Clear Auth & Re-login
        </button>
      </div>
    );
  }

  // Get the raw invoices array from API response
  const invoicesRaw = Array.isArray(data)
    ? data
    : data?.data || data?.results || [];

  // Frontend search and filter
  const filteredInvoices = invoicesRaw
    .filter(invoice => {
      // Search by invoice number or customer (case-insensitive)
      const searchLower = search.toLowerCase();
      const matchesSearch = invoice.invoice_number?.toLowerCase().includes(searchLower) ||
        invoice.customer_name?.toLowerCase().includes(searchLower);
      
      // Date range filter (use advanced filters if available, otherwise basic)
      const dateRange = advancedFilters.dateRange.start || advancedFilters.dateRange.end 
        ? advancedFilters.dateRange 
        : dateFilter;
      
      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        const invoiceDate = new Date(invoice.invoice_date);
        if (dateRange.start) {
          matchesDate = matchesDate && invoiceDate >= new Date(dateRange.start);
        }
        if (dateRange.end) {
          matchesDate = matchesDate && invoiceDate <= new Date(dateRange.end);
        }
      }
      
      // Amount range filter
      let matchesAmount = true;
      if (advancedFilters.amountRange.min || advancedFilters.amountRange.max) {
        const invoiceAmount = parseFloat(invoice.total_amount || 0);
        if (advancedFilters.amountRange.min) {
          matchesAmount = matchesAmount && invoiceAmount >= parseFloat(advancedFilters.amountRange.min);
        }
        if (advancedFilters.amountRange.max) {
          matchesAmount = matchesAmount && invoiceAmount <= parseFloat(advancedFilters.amountRange.max);
        }
      }
      
      // Customer filter
      let matchesCustomer = true;
      if (advancedFilters.customer) {
        matchesCustomer = invoice.customer_name?.toLowerCase().includes(advancedFilters.customer.toLowerCase());
      }
      
      // Overdue filter
      let matchesOverdue = true;
      if (advancedFilters.hasOverdue) {
        const today = new Date();
        const dueDateValue = invoice.due_date || invoice.invoice_date;
        const dueDate = new Date(dueDateValue);
        matchesOverdue = !Number.isNaN(dueDate.getTime()) && dueDate < today;
      }
      
      return matchesSearch && matchesDate && matchesAmount && matchesCustomer && matchesOverdue;
    })
    .sort((a, b) => {
      const { key, direction } = sortConfig;
      const factor = direction === "asc" ? 1 : -1;
      if (key === "invoice_date") {
        return factor * (new Date(a.invoice_date || 0) - new Date(b.invoice_date || 0));
      }
      if (key === "invoice_number") {
        return factor * String(a.invoice_number || "").localeCompare(String(b.invoice_number || ""), undefined, { numeric: true });
      }
      if (key === "customer_name") {
        return factor * String(a.customer_name || "").localeCompare(String(b.customer_name || ""));
      }
      if (key === "total_amount") {
        return factor * (Number(a.total_amount || 0) - Number(b.total_amount || 0));
      }
      if (key === "untaxed_amount") {
        const getUntaxed = (inv) => inv.items?.reduce((sum, item) => {
          const q = parseFloat(item.quantity || 0);
          const p = parseFloat(item.price || 0);
          const d = parseFloat(item.discount || 0);
          const base = q * p;
          return sum + (base - (base * d) / 100);
        }, 0) || 0;
        return factor * (getUntaxed(a) - getUntaxed(b));
      }
      if (key === "po_number") {
        return factor * String(a.po_number || "").localeCompare(String(b.po_number || ""));
      }
      if (key === "status") {
        return factor * String(a.status || "").localeCompare(String(b.status || ""));
      }
      return 0;
    });

  // Bulk operations functions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedInvoices(new Set(filteredInvoices.map(invoice => invoice.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectBill = (invoiceId, checked) => {
    const newSelected = new Set(selectedInvoices);
    if (checked) {
      newSelected.add(invoiceId);
    } else {
      newSelected.delete(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.size === 0) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedInvoices.size} sales invoices?`);
    if (confirmed) {
      try {
        const deletePromises = Array.from(selectedInvoices).map(invoiceId => 
          deleteSalesInvoice(invoiceId)
        );
        
        await Promise.all(deletePromises);
        
        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
        
        toast.success(`Successfully deleted ${selectedInvoices.size} sales invoices!`);
        setSelectedInvoices(new Set());
        setShowBulkActions(false);
      } catch (error) {
        console.error('Bulk delete error:', error);
        toast.error('Error deleting some invoices. Please try again.');
      }
    }
  };

  const waitForSalesCsvJob = async (taskId) => {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const statusData = await getSalesCsvJobStatus(taskId);
      if (statusData.state === 'SUCCESS') {
        return statusData;
      }
      if (statusData.state === 'FAILURE') {
        throw new Error(statusData.error || 'Failed to generate CSV');
      }
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    throw new Error('CSV export is taking too long. Please try again later.');
  };

  // Export functions
  const exportToCSV = async () => {
    const selectedIds = Array.from(selectedInvoices);
    const params = {
      search,
      ordering,
      status: statusFilterTab,
      date_start: advancedFilters.dateRange.start || dateFilter.start || undefined,
      date_end: advancedFilters.dateRange.end || dateFilter.end || undefined,
      amount_min: advancedFilters.amountRange.min || undefined,
      amount_max: advancedFilters.amountRange.max || undefined,
      customer: advancedFilters.customer || undefined,
      has_overdue: advancedFilters.hasOverdue ? 'true' : undefined,
      selected_ids: selectedIds.length > 0 ? selectedIds.join(',') : undefined,
    };

    setIsExporting(true);
    let downloaded = false;

    // 1. Try background task
    try {
      const queued = await exportSalesInvoicesCsv(params);
      if (queued instanceof Blob) {
        const url = window.URL.createObjectURL(queued);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-invoices-${new Date().toLocaleDateString('sv-SE')}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Sales CSV exported successfully.');
        downloaded = true;
      } else if (queued?.task_id) {
        toast.info('Sales CSV export queued. Preparing download...');
        await waitForSalesCsvJob(queued.task_id);
        const blob = await downloadSalesCsv(queued.task_id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-invoices-${new Date().toLocaleDateString('sv-SE')}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Sales CSV exported successfully.');
        downloaded = true;
      }
    } catch (apiError) {
      console.warn('Background CSV job failed, attempting direct sync download...', apiError);
    }

    // 2. If not downloaded yet, try direct synchronous export (?direct=1)
    if (!downloaded) {
      try {
        const blob = await exportSalesInvoicesCsv({ ...params, direct: 1 });
        if (blob instanceof Blob) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `sales-invoices-${new Date().toLocaleDateString('sv-SE')}.csv`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          toast.success('Sales CSV exported successfully.');
          downloaded = true;
        }
      } catch (directErr) {
        console.warn('Direct export failed, attempting client-side CSV fallback...', directErr);
      }
    }

    // 3. Fallback to client-side CSV generation
    if (!downloaded) {
      try {
        const dataToExport = selectedIds.length > 0
          ? filteredInvoices.filter(inv => selectedIds.includes(inv.id))
          : filteredInvoices;

        if (!dataToExport || dataToExport.length === 0) {
          toast.warn('No invoices to export.');
          return;
        }

        const headers = ['Invoice No', 'Date', 'Customer', 'Purchase Order', 'Status', 'Payment Status', 'Subtotal', 'Round Off', 'Total Amount'];
        const rows = dataToExport.map(inv => [
          `"${inv.invoice_number || ''}"`,
          `"${inv.invoice_date || ''}"`,
          `"${(inv.customer_name || '').replace(/"/g, '""')}"`,
          `"${inv.po_number || ''}"`,
          `"${inv.status || ''}"`,
          `"${inv.payment_status || ''}"`,
          `"${inv.untaxed_amount || ''}"`,
          `"${inv.round_off || '0.00'}"`,
          `"${inv.total_amount || '0.00'}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `sales-invoices-${new Date().toLocaleDateString('sv-SE')}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Sales CSV exported successfully.');
      } catch (fallbackErr) {
        console.error('All CSV export attempts failed:', fallbackErr);
        toast.error('Unable to export sales CSV.');
      }
    }

    setIsExporting(false);
  };

  // Removed global isLoading return to avoid unmounting search bar
  return (
    <div className="lg:bg-white/5 lg:backdrop-filter lg:backdrop-blur-20 rounded-lg lg:shadow p-0 lg:p-6 lg:border lg:border-white/10 bg-transparent border-none shadow-none backdrop-blur-none">
      {/* Status Tabs */}
      {!hideStatusTabs && (
        <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl mb-6 w-fit max-w-full overflow-x-auto no-scrollbar mx-4 lg:mx-0">
          {['all', 'final', 'draft'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilterTab(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap ${
                statusFilterTab === tab 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                : 'text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              {tab}s
            </button>
          ))}
        </div>
      )}

      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 px-4 lg:px-0">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder={`Search ${docLabelPlural}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-white/30 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 bg-white/10 backdrop-filter backdrop-blur-10 text-white placeholder-white/70 w-full sm:w-64"
            />
            <svg className="w-5 h-5 text-white/70 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-3 py-2 border border-white/30 rounded-lg hover:bg-white/20 bg-white/10 backdrop-filter backdrop-blur-10 text-sm font-medium text-white drop-shadow-lg"
          >
            Filters
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-3 py-2 border border-emerald-300/40 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-100 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors"
              title="Customize Columns"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-cyan-400" />
              <span>Columns</span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400" />
            </button>
            {showColumnDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl p-3 z-50 backdrop-blur-xl">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
                  Visible Columns
                </div>
                <div className="space-y-1.5">
                  {COLUMN_OPTIONS.map((col) => (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-xs text-gray-200 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.id]}
                        onChange={() => toggleColumn(col.id)}
                        className="rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-500/50"
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Show overdue Bills only Quick Toggle */}
          <button
            type="button"
            onClick={() => setAdvancedFilters(prev => ({ ...prev, hasOverdue: !prev.hasOverdue }))}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer select-none ${
              advancedFilters.hasOverdue
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-900/30 ring-1 ring-rose-500/40'
                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
            title="Filter to show only overdue bills"
          >
            <ExclamationTriangleIcon className={`w-3.5 h-3.5 ${advancedFilters.hasOverdue ? 'text-rose-400' : 'text-gray-400'}`} />
            <span>Show overdue Bills only</span>
            {advancedFilters.hasOverdue && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
            )}
          </button>
          
          {selectedInvoices.size > 0 && (
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="px-3 py-2 bg-blue-500/30 text-white border border-blue-300/50 rounded-lg hover:bg-blue-500/50 backdrop-filter backdrop-blur-10 drop-shadow-lg text-sm"
            >
              Actions ({selectedInvoices.size})
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <AdvancedSalesFilters
          filters={advancedFilters}
          onChange={setAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
        />
      )}

      {/* Bulk Actions */}
      {showBulkActions && selectedInvoices.size > 0 && (
        <div className="mb-4 p-4 bg-blue-500/20 backdrop-filter backdrop-blur-10 rounded-lg border border-blue-300/50">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium drop-shadow-lg">
              {selectedInvoices.size} {docLabelPlural} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="px-3 py-1 bg-green-500/30 text-white border border-green-300/50 rounded hover:bg-green-500/50 backdrop-filter backdrop-blur-10 drop-shadow-lg text-sm"
              >
                Export CSV
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-500/30 text-white border border-red-300/50 rounded hover:bg-red-500/50 backdrop-filter backdrop-blur-10 drop-shadow-lg text-sm"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table for desktop, Cards for mobile */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm border-separate border-spacing-y-2">
            <colgroup>
              <col style={{ width: `${colWidths.checkbox}px` }} />
              <col style={{ width: `${colWidths.invoice_number}px` }} />
              <col style={{ width: `${colWidths.invoice_date}px` }} />
              {visibleColumns.customer && <col style={{ width: `${colWidths.customer}px` }} />}
              {visibleColumns.po_number && <col style={{ width: `${colWidths.po_number}px` }} />}
              {visibleColumns.untaxed_amount && <col style={{ width: `${colWidths.untaxed_amount}px` }} />}
              {visibleColumns.total_amount && <col style={{ width: `${colWidths.total_amount}px` }} />}
              {visibleColumns.status && <col style={{ width: `${colWidths.status}px` }} />}
              {visibleColumns.items && <col style={{ width: `${colWidths.items}px` }} />}
              <col style={{ width: `${colWidths.actions}px` }} />
            </colgroup>
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="relative px-3 py-3 text-left rounded-l-lg select-none">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10"
                  />
                  {renderResizeHandle("checkbox")}
                </th>
                <th 
                  onClick={() => handleSort("invoice_number")}
                  className="relative px-3.5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span>Invoice No.</span>
                    {sortConfig.key === "invoice_number" && (
                      <span className="text-cyan-400 font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                  {renderResizeHandle("invoice_number")}
                </th>
                <th 
                  onClick={() => handleSort("invoice_date")}
                  className="relative px-3.5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span>Date</span>
                    {sortConfig.key === "invoice_date" && (
                      <span className="text-cyan-400 font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                  {renderResizeHandle("invoice_date")}
                </th>
                {visibleColumns.customer && (
                  <th 
                    onClick={() => handleSort("customer_name")}
                    className="relative px-3.5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span>Customer</span>
                      {sortConfig.key === "customer_name" && (
                        <span className="text-cyan-400 font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                    {renderResizeHandle("customer")}
                  </th>
                )}
                {visibleColumns.po_number && (
                  <th 
                    onClick={() => handleSort("po_number")}
                    className="relative px-3.5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span>Purchase Order</span>
                      {sortConfig.key === "po_number" && (
                        <span className="text-cyan-400 font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                    {renderResizeHandle("po_number")}
                  </th>
                )}
                {visibleColumns.untaxed_amount && (
                  <th 
                    onClick={() => handleSort("untaxed_amount")}
                    className="relative px-3.5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span>Amount (Before Tax)</span>
                      {sortConfig.key === "untaxed_amount" && (
                        <span className="text-cyan-400 font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                    {renderResizeHandle("untaxed_amount")}
                  </th>
                )}
                {visibleColumns.total_amount && (
                  <th 
                    onClick={() => handleSort("total_amount")}
                    className="relative px-3.5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span>Total Amount (With Tax)</span>
                      {sortConfig.key === "total_amount" && (
                        <span className="text-cyan-400 font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                    {renderResizeHandle("total_amount")}
                  </th>
                )}
                {visibleColumns.status && (
                  <th 
                    onClick={() => handleSort("status")}
                    className="relative px-3.5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span>Status</span>
                      {sortConfig.key === "status" && (
                        <span className="text-cyan-400 font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                    {renderResizeHandle("status")}
                  </th>
                )}
                {visibleColumns.items && (
                  <th className="relative px-3.5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider select-none">
                    <div className="truncate">Items</div>
                    {renderResizeHandle("items")}
                  </th>
                )}
                <th className="relative px-3.5 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider rounded-r-lg select-none">
                  <span>Actions</span>
                  {renderResizeHandle("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="10" className="px-6 py-12 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  </div>
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-6 py-12 text-center text-gray-400">
                  No invoices found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => {
                const compactRowStyle = { paddingTop: '1.0px', paddingBottom: '1.0px', margin: 0, lineHeight: 1.25 };
                return (
              <tr key={invoice.id} style={compactRowStyle} className="bg-transparent border-b border-white/5 hover:bg-white/5 transition-colors">
                <td style={compactRowStyle} className="px-3 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.has(invoice.id)}
                    onChange={(e) => handleSelectBill(invoice.id, e.target.checked)}
                    className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10 cursor-pointer"
                  />
                </td>
                <td style={compactRowStyle} className="px-3.5 whitespace-nowrap">
                  <div className="text-sm font-medium text-white truncate" title={`#${invoice.invoice_number}`}>
                    #{invoice.invoice_number}
                  </div>
                </td>
                <td style={compactRowStyle} className="px-3.5 whitespace-nowrap">
                  <div className="text-sm text-gray-400 truncate">
                    {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'dd/MM/yyyy') : '-'}
                  </div>
                </td>
                {visibleColumns.customer && (
                  <td style={compactRowStyle} className="px-3.5 whitespace-nowrap">
                    <div className="text-sm text-white truncate" title={invoice.customer_name}>
                      {invoice.customer_name}
                    </div>
                  </td>
                )}
                {visibleColumns.po_number && (
                  <td style={compactRowStyle} className="px-3.5 whitespace-nowrap">
                    <div className="text-sm text-gray-300 truncate" title={invoice.po_number || '-'}>
                      {invoice.po_number || '-'}
                    </div>
                  </td>
                )}
                {visibleColumns.untaxed_amount && (
                  <td style={compactRowStyle} className="px-3.5 whitespace-nowrap">
                    <div className="text-sm font-medium text-white truncate">
                      {getCurrencySymbol()}{(() => {
                        // Calculate untaxed amount from items factoring in discounts
                        const untaxedAmount = invoice.items?.reduce((sum, item) => {
                          const quantity = parseFloat(item.quantity || 0);
                          const price = parseFloat(item.price || 0);
                          const discount = parseFloat(item.discount || 0);
                          const lineBase = quantity * price;
                          return sum + (lineBase - (lineBase * discount) / 100);
                        }, 0) || 0;
                        return Number(untaxedAmount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        });
                      })()}
                    </div>
                  </td>
                )}
                {visibleColumns.total_amount && (
                  <td style={compactRowStyle} className="px-3.5 whitespace-nowrap">
                    {(() => {
                      const roundOff = parseFloat(invoice.round_off || 0) || 0;
                      const calculations = invoice.items?.reduce((acc, item) => {
                        const quantity = parseFloat(item.quantity || 0);
                        const price = parseFloat(item.price || 0);
                        const discount = parseFloat(item.discount || 0);
                        const tax = parseFloat(item.tax || 0);
                        const lineBase = quantity * price;
                        const taxable = lineBase - (lineBase * discount) / 100;
                        const taxAmount = (taxable * tax) / 100;
                        return {
                          taxable: acc.taxable + taxable,
                          taxAmount: acc.taxAmount + taxAmount
                        };
                      }, { taxable: 0, taxAmount: 0 }) || { taxable: 0, taxAmount: 0 };

                      const computedTotal = calculations.taxable + calculations.taxAmount + roundOff;
                      const totalAmountWithTax = invoice.total_amount != null
                        ? parseFloat(invoice.total_amount)
                        : computedTotal;

                      return (
                        <div className="truncate">
                          <div className="text-sm font-bold text-cyan-400">
                            {getCurrencySymbol()}{Number(totalAmountWithTax).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </div>
                          {roundOff !== 0 && (
                            <div className="text-[11px] text-amber-300 font-medium">
                              Round off: {roundOff >= 0 ? '+' : ''}{getCurrencySymbol()}{roundOff.toFixed(2)}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                )}
                {visibleColumns.status && (
                  <td style={compactRowStyle} className="px-3.5 whitespace-nowrap">
                    {(() => {
                      const isDraft = invoice.status === 'draft' || String(invoice.invoice_number || '').startsWith('DFT-') || String(invoice.invoice_number || '').startsWith('D-');
                      if (isDraft) {
                        return (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            Draft
                          </span>
                        );
                      }
                      const isPaid = String(invoice.payment_status || '').toLowerCase() === 'paid';
                      return (
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                          isPaid ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {isPaid ? 'Paid' : 'Not Paid'}
                        </span>
                      );
                    })()}
                  </td>
                )}
                {visibleColumns.items && (
                  <td style={compactRowStyle} className="px-3.5 whitespace-nowrap text-sm text-gray-400 truncate">
                    {invoice.items?.length || 0} items
                  </td>
                )}
                <td style={compactRowStyle} className="px-3.5 whitespace-nowrap text-sm font-medium text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onView(invoice)}
                      title={`View ${docLabel}`}
                      className="p-1 bg-white/5 text-gray-300 border border-white/10 rounded-md hover:bg-white/15 hover:text-white transition-colors"
                    >
                      <EyeIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (canEditInvoice(invoice)) {
                          onEdit(invoice);
                        }
                      }}
                      disabled={!canEditInvoice(invoice)}
                      title={editInvoiceTooltip(invoice)}
                      aria-disabled={!canEditInvoice(invoice)}
                      className={`p-1 border rounded-md transition-colors ${
                        canEditInvoice(invoice)
                          ? 'bg-white/5 text-cyan-300 border-white/10 hover:bg-white/15'
                          : 'bg-white/5 text-gray-600 border-white/5 cursor-not-allowed opacity-40'
                      }`}
                    >
                      <PencilSquareIcon className="w-3.5 h-3.5" />
                    </button>
                    {documentType !== "quotation" && (
                      <button
                        type="button"
                        onClick={() => openPaymentForInvoice(invoice)}
                        disabled={!canRecordPayment(invoice)}
                        title={canRecordPayment(invoice)
                          ? 'Record payment for this invoice'
                          : 'Available only for final invoices with pending or partial payment status.'}
                        aria-disabled={!canRecordPayment(invoice)}
                        className={`p-1 border rounded-md transition-colors ${
                          canRecordPayment(invoice)
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/25'
                            : 'bg-white/5 text-gray-600 border-white/5 cursor-not-allowed opacity-40'
                        }`}
                      >
                        <BanknotesIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (canDeleteInvoice(invoice)) {
                          onDelete(invoice);
                        }
                      }}
                      disabled={!canDeleteInvoice(invoice)}
                      title={getDeleteTooltip(invoice)}
                      aria-disabled={!canDeleteInvoice(invoice)}
                      className={`p-1 border rounded-md transition-colors ${
                        canDeleteInvoice(invoice)
                          ? 'bg-red-500/10 text-red-300 border-red-500/20 hover:bg-red-500/25'
                          : 'bg-white/5 text-gray-600 border-white/5 cursor-not-allowed opacity-40'
                      }`}
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-3 px-2">
        {isLoading ? (
          <div className="flex justify-center items-center py-12 bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10">
            No invoices found matching your criteria.
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
          <div key={invoice.id} className="bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10 p-3 hover:bg-white/10 transition-all duration-300">
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedInvoices.has(invoice.id)}
                  onChange={(e) => handleSelectBill(invoice.id, e.target.checked)}
                  className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10"
                />
                <div>
                  <div className="text-base font-bold text-white">
                    #{invoice.invoice_number}
                  </div>
                  <div className="text-[10px] text-white/50 uppercase tracking-widest font-black">
                    {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'dd/MM/yyyy') : '-'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {(() => {
                  const roundOff = parseFloat(invoice.round_off || 0) || 0;
                  const calculations = invoice.items?.reduce((acc, item) => {
                    const quantity = parseFloat(item.quantity || 0);
                    const price = parseFloat(item.price || 0);
                    const discount = parseFloat(item.discount || 0);
                    const tax = parseFloat(item.tax || 0);
                    const lineBase = quantity * price;
                    const taxable = lineBase - (lineBase * discount) / 100;
                    const taxAmount = (taxable * tax) / 100;
                    return {
                      taxable: acc.taxable + taxable,
                      taxAmount: acc.taxAmount + taxAmount
                    };
                  }, { taxable: 0, taxAmount: 0 }) || { taxable: 0, taxAmount: 0 };

                  const computedTotal = calculations.taxable + calculations.taxAmount + roundOff;
                  const totalAmountWithTax = invoice.total_amount != null
                    ? parseFloat(invoice.total_amount)
                    : computedTotal;

                  return (
                    <div>
                      <div className="text-lg font-black text-cyan-400">
                        {getCurrencySymbol()}{Number(totalAmountWithTax).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                      {roundOff !== 0 && (
                        <div className="text-[10px] text-amber-300 font-bold text-right">
                          Round off: {roundOff >= 0 ? '+' : ''}{getCurrencySymbol()}{roundOff.toFixed(2)}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Card Content Grid */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5 mb-4">
               <div>
                  <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Customer</div>
                  <div className="text-xs font-bold text-white truncate">{invoice.customer_name}</div>
                  {invoice.po_number && (
                    <div className="text-[10px] text-gray-400 mt-0.5">PO: {invoice.po_number}</div>
                  )}
               </div>
               <div className="text-right">
                  <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Status</div>
                  {(() => {
                    const isDraft = invoice.status === 'draft' || String(invoice.invoice_number || '').startsWith('DFT-') || String(invoice.invoice_number || '').startsWith('D-');
                    if (isDraft) {
                      return (
                        <div className="inline-block px-1.5 py-0.5 rounded text-[8px] uppercase font-black bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          Draft
                        </div>
                      );
                    }
                    const isPaid = String(invoice.payment_status || '').toLowerCase() === 'paid';
                    return (
                      <div className={`inline-block px-1.5 py-0.5 rounded text-[8px] uppercase font-black ${
                        isPaid ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {isPaid ? 'Paid' : 'Not Paid'}
                      </div>
                    );
                  })()}
               </div>
            </div>

            {/* Card Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onView(invoice)}
                className="flex-1 min-w-[70px] px-3 py-2.5 bg-white/5 text-white border border-white/10 rounded-xl hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95"
              >
                <EyeIcon className="w-3.5 h-3.5" />
                View
              </button>
              
              {canRecordPayment(invoice) && (
                <button
                  type="button"
                  onClick={() => openPaymentForInvoice(invoice)}
                  className="flex-1 min-w-[70px] px-3 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <CurrencyDollarIcon className="w-3.5 h-3.5" />
                  Pay
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (canEditInvoice(invoice)) {
                    onEdit(invoice);
                  }
                }}
                disabled={!canEditInvoice(invoice)}
                className={`flex-none p-2.5 rounded-xl transition-all border active:scale-95 ${
                  canEditInvoice(invoice)
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20'
                    : 'bg-white/5 text-gray-500 border-white/10 opacity-50'
                }`}
              >
                <PencilSquareIcon className="w-4 h-4" />
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (canDeleteInvoice(invoice)) {
                    onDelete(invoice);
                  }
                }}
                disabled={!canDeleteInvoice(invoice)}
                className={`flex-none p-2.5 rounded-xl transition-all border active:scale-95 ${
                  canDeleteInvoice(invoice)
                    ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                    : 'bg-white/5 text-gray-500 border-white/10 opacity-50'
                }`}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )))}
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-white/60 drop-shadow-md"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-white drop-shadow-lg">No sales bills</h3>
          <p className="mt-1 text-sm text-white/70 drop-shadow-md">
            Get started by creating a new sales bill.
          </p>
        </div>
      )}

      {paymentInvoice && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={closePaymentModal} />
          <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BanknotesIcon className="w-6 h-6 text-green-400" />
                  Record Payment
                </h2>
                <p className="text-xs text-gray-400 mt-1">Invoice #{paymentInvoice.invoice_number}</p>
              </div>
              <button onClick={closePaymentModal} className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <PaymentForm
              initialInvoice={paymentInvoice}
              onSuccess={closePaymentModal}
              onCancel={closePaymentModal}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}