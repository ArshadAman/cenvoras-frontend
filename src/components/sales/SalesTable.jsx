import React, { useState, useEffect, useMemo, useRef } from "react";
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
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
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
  statusFilter,
  onStatusFilterChange,
  hideStatusTabs = false,
  documentType = "invoice",
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-invoice_date"); // default: newest first
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    try {
      const saved = localStorage.getItem("sales_table_page_size");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if ([10, 20, 25, 50, 100].includes(parsed)) return parsed;
      }
    } catch (e) {}
    return 20;
  });
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
  const tableTopRef = useRef(null);
  const [selectedInvoices, setSelectedInvoices] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [internalStatusFilter, setInternalStatusFilter] = useState(initialStatusFilter); // "all", "final", "draft"
  const isStatusControlled = statusFilter !== undefined && statusFilter !== null;
  const statusFilterTab = isStatusControlled ? statusFilter : internalStatusFilter;
  const setStatusFilterTab = (tab) => {
    if (typeof onStatusFilterChange === "function") {
      onStatusFilterChange(tab);
    }
    if (!isStatusControlled) {
      setInternalStatusFilter(tab);
    }
  };
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
      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-[var(--accent-primary)]/50 active:bg-[var(--accent-primary)] transition-colors z-20 group"
      onMouseDown={(e) => handleMouseDownResize(e, colKey)}
      onDoubleClick={() => handleDoubleClickReset(colKey)}
      title="Drag to resize, double-click to reset"
    >
      <div className="w-0.5 h-full mx-auto bg-transparent group-hover:bg-[var(--accent-primary)]/70" />
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
    if (!isStatusControlled) {
      setInternalStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter, isStatusControlled]);

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
    queryKey: ["salesInvoices", search, ordering, statusFilterTab],
    queryFn: () => getSalesInvoices({ search, ordering, status: statusFilterTab }),
  });

  if (error) {
    return (
      <div className="bg-[var(--status-danger)]/15 border border-[var(--status-danger)]/30 rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Error loading {docLabelPlural}</h3>
        <p className="text-sm text-[var(--status-danger)] mb-4">{error.message}</p>
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

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setSelectAllAcrossPages(false);
  }, [search, statusFilterTab, advancedFilters, sortConfig]);

  // Optimized pagination calculations
  const totalItems = filteredInvoices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const paginatedInvoices = useMemo(() => {
    const startIdx = (safePage - 1) * pageSize;
    return filteredInvoices.slice(startIdx, startIdx + pageSize);
  }, [filteredInvoices, safePage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, totalItems);

  const isAllCurrentPageSelected = paginatedInvoices.length > 0 && paginatedInvoices.every(inv => selectedInvoices.has(inv.id));
  const isSomeCurrentPageSelected = paginatedInvoices.some(inv => selectedInvoices.has(inv.id)) && !isAllCurrentPageSelected;

  // Bulk operations functions
  const handleSelectAll = (checked) => {
    setSelectAllAcrossPages(false);
    if (checked) {
      const pageIds = paginatedInvoices.map(invoice => invoice.id);
      setSelectedInvoices(new Set(pageIds));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectAllAcrossPages = () => {
    setSelectAllAcrossPages(true);
    setSelectedInvoices(new Set(filteredInvoices.map(invoice => invoice.id)));
  };

  const handlePageChange = (newPage) => {
    const target = Math.min(Math.max(1, newPage), totalPages);
    setPage(target);
    setSelectAllAcrossPages(false);
    if (tableTopRef.current) {
      tableTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
    setSelectAllAcrossPages(false);
    try {
      localStorage.setItem("sales_table_page_size", String(newSize));
    } catch (e) {}
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
        queryClient.invalidateQueries({ queryKey: ["deliveryChallans"] });
        queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
        
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
    <div className="rounded-2xl p-0 lg:p-6 bg-transparent border-none shadow-none backdrop-blur-none">
      {/* Status Tabs */}
      {!hideStatusTabs && (
        <div className="flex gap-1 p-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl mb-6 w-fit max-w-full overflow-x-auto no-scrollbar mx-4 lg:mx-0">
          {['all', 'final', 'draft'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilterTab(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap cursor-pointer ${
                statusFilterTab === tab 
                ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-semibold shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
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
              className="pl-10 pr-4 py-2 border border-[var(--border-subtle)] rounded-xl focus:border-[var(--accent-primary)] outline-none bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] w-full sm:w-64 text-sm font-medium"
            />
            <svg className="w-5 h-5 text-[var(--text-muted)] absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="btn-secondary px-3 py-2 text-sm"
          >
            Filters
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            disabled={isExporting}
            className="btn-secondary px-3 py-2 text-sm inline-flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-[var(--accent-primary)]" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="btn-secondary px-3 py-2 text-sm inline-flex items-center gap-1.5"
              title="Customize Columns"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Columns</span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>
            {showColumnDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl p-3 z-50">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 px-1">
                  Visible Columns
                </div>
                <div className="space-y-1.5">
                  {COLUMN_OPTIONS.map((col) => (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] cursor-pointer text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] select-none"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.id]}
                        onChange={() => toggleColumn(col.id)}
                        className="rounded border-[var(--border-subtle)] bg-[var(--bg-primary)] accent-[var(--accent-primary)] text-[var(--accent-primary)]"
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
                ? 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border-[var(--status-danger)]/30'
                : 'btn-secondary text-[var(--text-secondary)]'
            }`}
            title="Filter to show only overdue bills"
          >
            <ExclamationTriangleIcon className={`w-3.5 h-3.5 ${advancedFilters.hasOverdue ? 'text-[var(--status-danger)]' : 'text-[var(--text-muted)]'}`} />
            <span>Show overdue Bills only</span>
            {advancedFilters.hasOverdue && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-danger)] animate-pulse"></span>
            )}
          </button>
          
          {selectedInvoices.size > 0 && (
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="btn-primary px-3 py-2 text-sm"
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
        <div className="mb-4 p-4 bg-[var(--accent-primary)]/15 rounded-xl border border-[var(--accent-primary)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-primary)] font-medium">
              {selectedInvoices.size} {docLabelPlural} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="btn-secondary px-3 py-1 text-sm"
              >
                Export CSV
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-[var(--status-danger)] hover:opacity-90 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Across Pages Banner */}
      {isAllCurrentPageSelected && totalPages > 1 && (
        <div className="bg-[var(--status-info)]/15 border border-[var(--status-info)]/30 rounded-xl px-4 py-2.5 mb-3 text-xs text-[var(--status-info)] flex items-center justify-between">
          <span>
            {selectAllAcrossPages
              ? `All ${totalItems} invoices across all ${totalPages} pages are selected.`
              : `All ${paginatedInvoices.length} invoices on this page are selected.`}
          </span>
          {!selectAllAcrossPages ? (
            <button
              type="button"
              onClick={handleSelectAllAcrossPages}
              className="font-bold text-[var(--accent-primary)] hover:underline ml-2 transition-colors"
            >
              Select all {totalItems} invoices across all pages
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSelectAllAcrossPages(false);
                setSelectedInvoices(new Set());
              }}
              className="font-bold text-[var(--accent-primary)] hover:underline ml-2 transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      {/* Table for desktop, Cards for mobile */}
      <div ref={tableTopRef} className="hidden lg:block">
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
              <tr className="bg-[var(--bg-primary)]/60 border-b border-[var(--border-subtle)]">
                <th className="relative px-3 py-3 text-left rounded-l-lg select-none">
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeCurrentPageSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-[var(--border-subtle)] bg-[var(--bg-primary)] accent-[var(--accent-primary)]"
                  />
                  {renderResizeHandle("checkbox")}
                </th>
                <th 
                  onClick={() => handleSort("invoice_number")}
                  className="relative px-3.5 py-3 text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span>Invoice No.</span>
                    {sortConfig.key === "invoice_number" && (
                      <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                  {renderResizeHandle("invoice_number")}
                </th>
                <th 
                  onClick={() => handleSort("invoice_date")}
                  className="relative px-3.5 py-3 text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span>Date</span>
                    {sortConfig.key === "invoice_date" && (
                      <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                  {renderResizeHandle("invoice_date")}
                </th>
                {visibleColumns.customer && (
                  <th 
                    onClick={() => handleSort("customer_name")}
                    className="relative px-3.5 py-3 text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span>Customer</span>
                      {sortConfig.key === "customer_name" && (
                        <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                    {renderResizeHandle("customer")}
                  </th>
                )}
                {visibleColumns.po_number && (
                  <th 
                    onClick={() => handleSort("po_number")}
                    className="relative px-3.5 py-3 text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span>Purchase Order</span>
                      {sortConfig.key === "po_number" && (
                        <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                    {renderResizeHandle("po_number")}
                  </th>
                )}
                {visibleColumns.untaxed_amount && (
                  <th 
                    onClick={() => handleSort("untaxed_amount")}
                    className="relative px-3.5 py-3 text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span>Amount (Before Tax)</span>
                      {sortConfig.key === "untaxed_amount" && (
                        <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                    {renderResizeHandle("untaxed_amount")}
                  </th>
                )}
                {visibleColumns.total_amount && (
                  <th 
                    onClick={() => handleSort("total_amount")}
                    className="relative px-3.5 py-3 text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span>Total Amount (With Tax)</span>
                      {sortConfig.key === "total_amount" && (
                        <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                    {renderResizeHandle("total_amount")}
                  </th>
                )}
                {visibleColumns.status && (
                  <th 
                    onClick={() => handleSort("status")}
                    className="relative px-3.5 py-3 text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span>Status</span>
                      {sortConfig.key === "status" && (
                        <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                    {renderResizeHandle("status")}
                  </th>
                )}
                {visibleColumns.items && (
                  <th className="relative px-3.5 py-3 text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider select-none">
                    <div className="truncate">Items</div>
                    {renderResizeHandle("items")}
                  </th>
                )}
                <th className="relative px-3.5 py-3 text-right text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider rounded-r-lg select-none">
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
                  </div>
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-6 py-12 text-center text-[var(--text-muted)]">
                  No invoices found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((invoice) => {
                const compactRowStyle = { paddingTop: '1.0px', paddingBottom: '1.0px', margin: 0, lineHeight: 1.25 };
                return (
              <tr key={invoice.id} style={compactRowStyle} className="bg-transparent border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                <td style={compactRowStyle} className="px-3 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.has(invoice.id)}
                    onChange={(e) => handleSelectBill(invoice.id, e.target.checked)}
                    className="rounded border-[var(--border-subtle)] bg-[var(--bg-primary)] accent-[var(--accent-primary)] cursor-pointer"
                  />
                </td>
                <td style={compactRowStyle} className="px-3.5 whitespace-nowrap">
                  <div className="text-xs font-mono font-semibold text-[var(--text-primary)] tracking-tight truncate" title={`#${invoice.invoice_number}`}>
                    #{invoice.invoice_number}
                  </div>
                </td>
                <td style={compactRowStyle} className="px-3.5 whitespace-nowrap">
                  <div className="text-xs font-mono text-[var(--text-muted)] truncate">
                    {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'dd/MM/yyyy') : '-'}
                  </div>
                </td>
                {visibleColumns.customer && (
                  <td style={compactRowStyle} className="px-3.5 whitespace-nowrap">
                    <div className="text-sm text-[var(--text-primary)] truncate" title={invoice.customer_name}>
                      {invoice.customer_name}
                    </div>
                  </td>
                )}
                {visibleColumns.po_number && (
                  <td style={compactRowStyle} className="px-3.5 whitespace-nowrap">
                    <div className="text-xs font-mono text-[var(--text-secondary)] truncate" title={invoice.po_number || '-'}>
                      {invoice.po_number || '-'}
                    </div>
                  </td>
                )}
                {visibleColumns.untaxed_amount && (
                  <td style={compactRowStyle} className="px-3.5 whitespace-nowrap">
                    <div className="text-xs font-mono font-medium text-[var(--text-primary)] font-tabular truncate">
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
                          <div className="text-xs font-mono font-bold text-[var(--text-primary)] font-tabular">
                            {getCurrencySymbol()}{Number(totalAmountWithTax).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </div>
                          {roundOff !== 0 && (
                            <div className="text-[10px] font-mono font-tabular text-[var(--status-warning)] font-medium">
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
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-[var(--text-secondary)]/15 text-[var(--text-secondary)] border border-[var(--text-secondary)]/30">
                            Draft
                          </span>
                        );
                      }
                      const isPaid = String(invoice.payment_status || '').toLowerCase() === 'paid';
                      return (
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                          isPaid ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30' : 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30'
                        }`}>
                          {isPaid ? 'Paid' : 'Not Paid'}
                        </span>
                      );
                    })()}
                  </td>
                )}
                {visibleColumns.items && (
                  <td style={compactRowStyle} className="px-3.5 whitespace-nowrap text-sm text-[var(--text-muted)] truncate">
                    {invoice.items?.length || 0} items
                  </td>
                )}
                <td style={compactRowStyle} className="px-3.5 whitespace-nowrap text-sm font-medium text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onView(invoice)}
                      title={`View ${docLabel}`}
                      className="p-1 bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-md hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors"
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
                          ? 'bg-[var(--bg-primary)] text-[var(--accent-primary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
                          : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-subtle)] cursor-not-allowed opacity-40'
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
                            ? 'bg-[var(--bg-primary)] text-[var(--status-success)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
                            : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-subtle)] cursor-not-allowed opacity-40'
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
                          ? 'bg-[var(--bg-primary)] text-[var(--status-danger)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
                          : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-subtle)] cursor-not-allowed opacity-40'
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
          <div className="flex justify-center items-center py-12 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
            No invoices found matching your criteria.
          </div>
        ) : (
          paginatedInvoices.map((invoice) => (
          <div key={invoice.id} className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-3 hover:bg-[var(--bg-surface-hover)] transition-all duration-300 shadow-sm">
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedInvoices.has(invoice.id)}
                  onChange={(e) => handleSelectBill(invoice.id, e.target.checked)}
                  className="rounded border-[var(--border-subtle)] bg-[var(--bg-primary)] accent-[var(--accent-primary)]"
                />
                <div>
                  <div className="text-base font-bold text-[var(--text-primary)]">
                    #{invoice.invoice_number}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-black">
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
                      <div className="text-lg font-black text-[var(--text-primary)]">
                        {getCurrencySymbol()}{Number(totalAmountWithTax).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                      {roundOff !== 0 && (
                        <div className="text-[10px] text-[var(--status-warning)] font-bold text-right">
                          Round off: {roundOff >= 0 ? '+' : ''}{getCurrencySymbol()}{roundOff.toFixed(2)}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Card Content Grid */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[var(--border-subtle)] mb-4">
               <div>
                  <div className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">Customer</div>
                  <div className="text-xs font-bold text-[var(--text-primary)] truncate">{invoice.customer_name}</div>
                  {invoice.po_number && (
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">PO: {invoice.po_number}</div>
                  )}
               </div>
               <div className="text-right">
                  <div className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">Status</div>
                  {(() => {
                    const isDraft = invoice.status === 'draft' || String(invoice.invoice_number || '').startsWith('DFT-') || String(invoice.invoice_number || '').startsWith('D-');
                    if (isDraft) {
                      return (
                        <div className="inline-block px-1.5 py-0.5 rounded text-[8px] uppercase font-black bg-[var(--text-secondary)]/15 text-[var(--text-secondary)] border border-[var(--text-secondary)]/30">
                          Draft
                        </div>
                      );
                    }
                    const isPaid = String(invoice.payment_status || '').toLowerCase() === 'paid';
                    return (
                      <div className={`inline-block px-1.5 py-0.5 rounded text-[8px] uppercase font-black ${
                        isPaid ? 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30' : 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30'
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
                className="btn-secondary flex-1 min-w-[70px] px-3 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5"
              >
                <EyeIcon className="w-3.5 h-3.5" />
                View
              </button>
              
              {canRecordPayment(invoice) && (
                <button
                  type="button"
                  onClick={() => openPaymentForInvoice(invoice)}
                  className="flex-1 min-w-[70px] px-3 py-2 bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30 rounded-xl hover:bg-[var(--status-success)]/25 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95"
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
                className={`btn-secondary flex-none p-2 rounded-xl transition-all ${
                  canEditInvoice(invoice)
                    ? 'text-[var(--accent-primary)] hover:bg-[var(--bg-surface-hover)]'
                    : 'text-[var(--text-muted)] cursor-not-allowed opacity-40'
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
                className={`flex-none p-2 rounded-xl transition-all border ${
                  canDeleteInvoice(invoice)
                    ? 'bg-[var(--status-danger)]/15 text-[var(--status-danger)] border-[var(--status-danger)]/30 hover:bg-[var(--status-danger)]/25'
                    : 'btn-secondary text-[var(--text-muted)] cursor-not-allowed opacity-40'
                }`}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )))}
      </div>

      {/* Optimized Pagination Bar */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-[var(--border-subtle)] px-2 sm:px-1">
          {/* Left: Showing range and rows-per-page selector */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-[var(--text-muted)]">
            <span>
              Showing <span className="font-semibold text-[var(--text-primary)] font-mono">{startIndex}</span>–<span className="font-semibold text-[var(--text-primary)] font-mono">{endIndex}</span> of <span className="font-semibold text-[var(--text-primary)] font-mono">{totalItems}</span> {totalItems === 1 ? 'invoice' : 'invoices'}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-muted)]">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
              >
                <option value={10} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">10</option>
                <option value={20} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">20</option>
                <option value={25} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">25</option>
                <option value={50} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">50</option>
                <option value={100} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">100</option>
              </select>
            </div>
          </div>

          {/* Right: Page Navigation Buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 sm:gap-1.5 select-none">
              {/* First Page */}
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={safePage <= 1}
                className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-xs font-medium border border-[var(--border-subtle)] transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title="First page"
              >
                <ChevronDoubleLeftIcon className="w-4 h-4" />
              </button>

              {/* Prev Page */}
              <button
                type="button"
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage <= 1}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-subtle)] transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1"
              >
                <ChevronLeftIcon className="w-3.5 h-3.5" /> Prev
              </button>

              {/* Numbered Page Buttons with dynamic window */}
              {(() => {
                const maxButtons = 5;
                let startP = Math.max(1, safePage - Math.floor(maxButtons / 2));
                let endP = Math.min(totalPages, startP + maxButtons - 1);
                if (endP - startP + 1 < maxButtons) {
                  startP = Math.max(1, endP - maxButtons + 1);
                }
                const pageNumbers = [];
                for (let p = startP; p <= endP; p++) {
                  pageNumbers.push(p);
                }
                return (
                  <>
                    {startP > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePageChange(1)}
                          className="w-8 h-8 rounded-lg text-xs font-semibold border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all"
                        >
                          1
                        </button>
                        {startP > 2 && <span className="px-1 text-[var(--text-muted)]">…</span>}
                      </>
                    )}
                    {pageNumbers.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-all ${
                          p === safePage
                            ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-[var(--accent-primary)] shadow-sm font-bold'
                            : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    {endP < totalPages && (
                      <>
                        {endP < totalPages - 1 && <span className="px-1 text-[var(--text-muted)]">…</span>}
                        <button
                          type="button"
                          onClick={() => handlePageChange(totalPages)}
                          className="w-8 h-8 rounded-lg text-xs font-semibold border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </>
                );
              })()}

              {/* Next Page */}
              <button
                type="button"
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage >= totalPages}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-subtle)] transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1"
              >
                Next <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>

              {/* Last Page */}
              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                disabled={safePage >= totalPages}
                className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-xs font-medium border border-[var(--border-subtle)] transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title="Last page"
              >
                <ChevronDoubleRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-[var(--text-muted)]"
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
          <h3 className="mt-2 text-sm font-medium text-[var(--text-primary)]">No sales bills</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Get started by creating a new sales bill.
          </p>
        </div>
      )}

      {paymentInvoice && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={closePaymentModal} />
          <div className="relative bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <BanknotesIcon className="w-6 h-6 text-[var(--status-success)]" />
                  Record Payment
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">Invoice #{paymentInvoice.invoice_number}</p>
              </div>
              <button onClick={closePaymentModal} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)]">
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