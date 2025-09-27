import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSalesInvoices } from "../../api/sales";
import { format } from "date-fns";
import AdvancedSalesFilters from "./AdvancedSalesFilters";

export default function SalesTable({ onEdit, onView, onDelete }) {
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-invoice_date"); // default: newest first
  const [page, setPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: { start: "", end: "" },
    amountRange: { min: "", max: "" },
    customer: "",
    status: "all",
    hasOverdue: false,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["salesInvoices", search, ordering, page],
    queryFn: () => getSalesInvoices({ search, ordering, page }),
  });

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading sales invoices: {error.message}
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
        const invoiceDate = new Date(invoice.invoice_date);
        const dueDate = new Date(invoiceDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days default
        matchesOverdue = dueDate < today;
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
        for (const invoiceId of selectedInvoices) {
          await onDelete(invoiceId);
        }
        setSelectedInvoices(new Set());
        setShowBulkActions(false);
      } catch (error) {
        alert('Error deleting some invoices. Please try again.');
      }
    }
  };

  // Export functions
  const exportToCSV = () => {
    const selectedData = filteredInvoices.filter(invoice => selectedInvoices.has(invoice.id));
    const dataToExport = selectedData.length > 0 ? selectedData : filteredInvoices;
    
    const csvHeaders = ['Invoice Number', 'Date', 'Customer', 'Total Amount', 'Items Count'];
    const csvData = dataToExport.map(invoice => [
      invoice.invoice_number,
      invoice.invoice_date,
      invoice.customer_name,
      invoice.total_amount,
      invoice.items?.length || 0
    ]);
    
    const csvContent = [csvHeaders, ...csvData].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Search bills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white w-full sm:w-64"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
          >
            Filters
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="-invoice_date">Newest First</option>
            <option value="invoice_date">Oldest First</option>
            <option value="-total_amount">Highest Amount</option>
            <option value="total_amount">Lowest Amount</option>
          </select>
          
          {selectedInvoices.size > 0 && (
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
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
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              {selectedInvoices.size} invoices selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Export CSV
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Invoice Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.has(invoice.id)}
                    onChange={(e) => handleSelectBill(invoice.id, e.target.checked)}
                    className="rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    #{invoice.invoice_number}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {invoice.customer_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    ₹{Number(invoice.total_amount).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {invoice.items?.length || 0} items
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onView(invoice)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200"
                    >
                      View
                    </button>
                    {/* <button
                      onClick={() => onEdit(invoice)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                    >
                      Edit
                    </button> */}
                    <button
                      onClick={() => onDelete(invoice)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No sales bills</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new sales bill.
          </p>
        </div>
      )}
    </div>
  );
}