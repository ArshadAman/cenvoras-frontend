import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSalesInvoices, deleteSalesInvoice, exportSalesInvoicesCsv, getSalesCsvJobStatus, downloadSalesCsv } from "../../api/sales";
import { format } from "date-fns";
import { toast } from "react-toastify";
import AdvancedSalesFilters from "./AdvancedSalesFilters";
import { ArrowDownTrayIcon, EyeIcon, PencilSquareIcon, TrashIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import PaymentForm from "../ledger/PaymentForm";

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
  const [page, setPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [statusFilterTab, setStatusFilterTab] = useState(initialStatusFilter); // "all", "final", "draft"
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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
      // Frontend ordering
      if (ordering === "-invoice_date") return new Date(b.invoice_date) - new Date(a.invoice_date);
      if (ordering === "invoice_date") return new Date(a.invoice_date) - new Date(b.invoice_date);
      if (ordering === "-total_amount") return Number(b.total_amount) - Number(a.total_amount);
      if (ordering === "total_amount") return Number(a.total_amount) - Number(b.total_amount);
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

    try {
      setIsExporting(true);
      const queued = await exportSalesInvoicesCsv(params);
      const taskId = queued?.task_id;
      if (!taskId) {
        throw new Error('Unable to start CSV export.');
      }

      toast.info('Sales CSV export queued. Preparing download...');
      await waitForSalesCsvJob(taskId);
      const blob = await downloadSalesCsv(taskId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-invoices-${new Date().toLocaleDateString('sv-SE')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Sales CSV exported successfully.');
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Unable to export sales CSV.');
    } finally {
      setIsExporting(false);
    }
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

          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
              className="px-3 py-2 border border-white/30 rounded-lg focus:ring-2 focus:ring-cyan-300 bg-[#111] backdrop-filter backdrop-blur-10 text-white text-sm"
          >
            <option value="-invoice_date" className="bg-[#1a2341] text-white">Newest First</option>
            <option value="invoice_date" className="bg-[#1a2341] text-white">Oldest First</option>
            <option value="-total_amount" className="bg-[#1a2341] text-white">Highest Amount</option>
            <option value="total_amount" className="bg-[#1a2341] text-white">Lowest Amount</option>
          </select>
          
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
          <table className="min-w-full text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-left rounded-l-lg">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Invoice Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Amount (Before Tax)
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Total Amount (With Tax)
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider rounded-r-lg">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  </div>
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                  No invoices found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="bg-transparent border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.has(invoice.id)}
                    onChange={(e) => handleSelectBill(invoice.id, e.target.checked)}
                    className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    #{invoice.invoice_number}
                  </div>
                  <div className="text-sm text-gray-400">
                    {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">
                    {invoice.customer_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    ₹{(() => {
                      // Calculate untaxed amount from items
                      const untaxedAmount = invoice.items?.reduce((sum, item) => {
                        const quantity = parseFloat(item.quantity || 0);
                        const price = parseFloat(item.price || 0);
                        return sum + (quantity * price);
                      }, 0) || 0;
                      return Number(untaxedAmount).toLocaleString();
                    })()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-cyan-400">
                    ₹{(() => {
                      // Calculate total amount including tax
                      const calculations = invoice.items?.reduce((acc, item) => {
                        const quantity = parseFloat(item.quantity || 0);
                        const price = parseFloat(item.price || 0);
                        const tax = parseFloat(item.tax || 0);
                        const subtotal = quantity * price;
                        const taxAmount = (subtotal * tax) / 100;
                        return {
                          untaxed: acc.untaxed + subtotal,
                          taxAmount: acc.taxAmount + taxAmount
                        };
                      }, { untaxed: 0, taxAmount: 0 }) || { untaxed: 0, taxAmount: 0 };
                      
                      const totalWithTax = calculations.untaxed + calculations.taxAmount;
                      return Number(totalWithTax).toLocaleString();
                    })()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                      invoice.status === 'final' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                      invoice.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                      'bg-gray-500/20 text-gray-400'
                   }`}>
                      {invoice.status || 'final'}
                   </span>
                   <div className="mt-2">
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                      invoice.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      invoice.payment_status === 'partial_paid' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {invoice.payment_status || 'pending'}
                    </span>
                   </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {invoice.items?.length || 0} items
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onView(invoice)}
                      className="px-3 py-1 bg-white/5 text-gray-300 border border-white/10 rounded hover:bg-white/10 transition-colors"
                    >
                      View
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
                      className={`px-3 py-1 border rounded transition-colors ${
                        canEditInvoice(invoice)
                          ? 'bg-white/5 text-cyan-300 border-white/10 hover:bg-white/10'
                          : 'bg-white/5 text-gray-500 border-white/10 cursor-not-allowed opacity-70'
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => openPaymentForInvoice(invoice)}
                      disabled={!canRecordPayment(invoice)}
                      title={canRecordPayment(invoice)
                        ? 'Record payment for this invoice'
                        : 'Available only for final invoices with pending or partial payment status.'}
                      aria-disabled={!canRecordPayment(invoice)}
                      className={`px-3 py-1 border rounded transition-colors ${
                        canRecordPayment(invoice)
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-white/5 text-gray-500 border-white/10 cursor-not-allowed opacity-70'
                      }`}
                    >
                      Record Payment
                    </button>
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
                      className={`px-3 py-1 border rounded transition-colors ${
                        canDeleteInvoice(invoice)
                          ? 'bg-red-500/10 text-red-300 border-red-500/20 hover:bg-red-500/20'
                          : 'bg-white/5 text-gray-500 border-white/10 cursor-not-allowed opacity-70'
                      }`}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            )))}
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
                    {format(new Date(invoice.invoice_date), 'dd MMM, yyyy')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-cyan-400">
                  ₹{(() => {
                    const calculations = invoice.items?.reduce((acc, item) => {
                      const quantity = parseFloat(item.quantity || 0);
                      const price = parseFloat(item.price || 0);
                      const tax = parseFloat(item.tax || 0);
                      const subtotal = quantity * price;
                      const taxAmount = (subtotal * tax) / 100;
                      return {
                        untaxed: acc.untaxed + subtotal,
                        taxAmount: acc.taxAmount + taxAmount
                      };
                    }, { untaxed: 0, taxAmount: 0 }) || { untaxed: 0, taxAmount: 0 };
                    
                    const totalWithTax = calculations.untaxed + calculations.taxAmount;
                    return Number(totalWithTax).toLocaleString();
                  })()}
                </div>
                <div className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[8px] uppercase font-black tracking-tighter ${
                  invoice.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  invoice.payment_status === 'partial_paid' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {invoice.payment_status || 'pending'}
                </div>
              </div>
            </div>

            {/* Card Content Grid */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5 mb-4">
               <div>
                  <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Customer</div>
                  <div className="text-xs font-bold text-white truncate">{invoice.customer_name}</div>
               </div>
               <div className="text-right">
                  <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Status</div>
                  <div className={`inline-block px-1.5 py-0.5 rounded text-[8px] uppercase font-black ${
                      invoice.status === 'final' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                      invoice.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                      'bg-gray-500/20 text-gray-400'
                   }`}>
                      {invoice.status || 'final'}
                  </div>
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
          <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Record Payment</h2>
                <p className="text-xs text-gray-400 mt-1">Invoice #{paymentInvoice.invoice_number}</p>
              </div>
              <button onClick={closePaymentModal} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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