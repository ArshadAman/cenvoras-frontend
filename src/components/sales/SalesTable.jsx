import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSalesInvoices, deleteSalesInvoice } from "../../api/sales";
import { format } from "date-fns";
import { toast } from "react-toastify";
import AdvancedSalesFilters from "./AdvancedSalesFilters";

export default function SalesTable({ onEdit, onView, onDelete }) {
  const queryClient = useQueryClient();
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
    <div className="bg-white/5 backdrop-filter backdrop-blur-20 rounded-lg shadow p-6 border border-white/10">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Search bills..."
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
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="px-3 py-2 border border-white/30 rounded-lg focus:ring-2 focus:ring-cyan-300 bg-white/10 backdrop-filter backdrop-blur-10 text-white text-sm"
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
              {selectedInvoices.size} invoices selected
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-gradient-to-r from-[#7fd3f7]/10 to-[#b6e0f7]/10 backdrop-blur-10">
              <th className="px-6 py-3 text-left rounded-l-lg">
                <input
                  type="checkbox"
                  checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10 backdrop-filter backdrop-blur-10"
                />
              </th>
              <th className="px-6 py-3 text-left font-black text-white drop-shadow-lg">
                Invoice Details
              </th>
              <th className="px-6 py-3 text-left font-black text-white drop-shadow-lg">
                Customer
              </th>
              <th className="px-6 py-3 text-left font-black text-white drop-shadow-lg">
                Amount
              </th>
              <th className="px-6 py-3 text-left font-black text-white drop-shadow-lg">
                Items
              </th>
              <th className="px-6 py-3 text-left font-black text-white drop-shadow-lg rounded-r-lg">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="bg-white/5 backdrop-filter backdrop-blur-10 shadow rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.has(invoice.id)}
                    onChange={(e) => handleSelectBill(invoice.id, e.target.checked)}
                    className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10 backdrop-filter backdrop-blur-10"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white drop-shadow-lg">
                    #{invoice.invoice_number}
                  </div>
                  <div className="text-sm text-white/70 drop-shadow-md">
                    {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white drop-shadow-lg">
                    {invoice.customer_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white drop-shadow-lg">
                    ₹{Number(invoice.total_amount).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70 drop-shadow-md">
                  {invoice.items?.length || 0} items
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onView(invoice)}
                      className="px-3 py-1 bg-blue-500/30 text-white border border-blue-300/50 rounded hover:bg-blue-500/50 transition backdrop-filter backdrop-blur-10 drop-shadow-lg"
                    >
                      View
                    </button>
                    {/* <button
                      onClick={() => onEdit(invoice)}
                      className="px-3 py-1 bg-indigo-500/30 text-white border border-indigo-300/50 rounded hover:bg-indigo-500/50 transition backdrop-filter backdrop-blur-10 drop-shadow-lg"
                    >
                      Edit
                    </button> */}
                    <button
                      onClick={() => onDelete(invoice)}
                      className="px-3 py-1 bg-red-500/30 text-white border border-red-300/50 rounded hover:bg-red-500/50 transition backdrop-filter backdrop-blur-10 drop-shadow-lg"
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
    </div>
  );
}