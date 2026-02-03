import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPurchaseBills } from "../../api/purchase";
import { format } from "date-fns";
import AdvancedPurchaseFilters from "./AdvancedPurchaseFilters";

export default function PurchaseTable({ onEdit, onView, onDelete }) {
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-bill_date"); // default: newest first
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Items per page
  const [selectedBills, setSelectedBills] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: { start: "", end: "" },
    amountRange: { min: "", max: "" },
    vendor: "",
    journal: "",
    gstTreatment: "",
    status: "all",
    hasOverdue: false,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["purchaseBills", page, limit],
    queryFn: () => getPurchaseBills({ page, limit }),
    keepPreviousData: true, // Smooth pagination transitions
  });

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading purchase bills: {error.message}
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

  // Get the raw bills array from API response
  const billsRaw = Array.isArray(data)
    ? data
    : data?.data || data?.results || [];

  // Frontend search and filter
  const filteredBills = billsRaw
    .filter(bill => {
      // Search by bill number or vendor name (case-insensitive)
      const searchLower = search.toLowerCase();
      const matchesSearch = bill.bill_number?.toLowerCase().includes(searchLower) ||
        bill.vendor_name?.toLowerCase().includes(searchLower);
      
      // Date range filter (use advanced filters if available, otherwise basic)
      const dateRange = advancedFilters.dateRange.start || advancedFilters.dateRange.end 
        ? advancedFilters.dateRange 
        : dateFilter;
      
      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        const billDate = new Date(bill.bill_date);
        if (dateRange.start) {
          matchesDate = matchesDate && billDate >= new Date(dateRange.start);
        }
        if (dateRange.end) {
          matchesDate = matchesDate && billDate <= new Date(dateRange.end);
        }
      }
      
      // Amount range filter
      let matchesAmount = true;
      if (advancedFilters.amountRange.min || advancedFilters.amountRange.max) {
        const billAmount = parseFloat(bill.total_amount || 0);
        if (advancedFilters.amountRange.min) {
          matchesAmount = matchesAmount && billAmount >= parseFloat(advancedFilters.amountRange.min);
        }
        if (advancedFilters.amountRange.max) {
          matchesAmount = matchesAmount && billAmount <= parseFloat(advancedFilters.amountRange.max);
        }
      }
      
      // Vendor filter
      let matchesVendor = true;
      if (advancedFilters.vendor) {
        matchesVendor = bill.vendor_name?.toLowerCase().includes(advancedFilters.vendor.toLowerCase());
      }
      
      // Journal filter
      let matchesJournal = true;
      if (advancedFilters.journal) {
        matchesJournal = bill.journal === advancedFilters.journal;
      }
      
      // GST Treatment filter
      let matchesGST = true;
      if (advancedFilters.gstTreatment) {
        matchesGST = bill.gst_treatment === advancedFilters.gstTreatment;
      }
      
      // Overdue filter (assuming we have due_date field or calculate from bill_date + terms)
      let matchesOverdue = true;
      if (advancedFilters.hasOverdue) {
        const today = new Date();
        const billDate = new Date(bill.bill_date);
        const dueDate = new Date(billDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days default
        matchesOverdue = dueDate < today;
      }
      
      return matchesSearch && matchesDate && matchesAmount && matchesVendor && matchesJournal && matchesGST && matchesOverdue;
    })
    .sort((a, b) => {
      // Frontend ordering
      if (ordering === "-bill_date") return new Date(b.bill_date) - new Date(a.bill_date);
      if (ordering === "bill_date") return new Date(a.bill_date) - new Date(b.bill_date);
      if (ordering === "-total_amount") return Number(b.total_amount) - Number(a.total_amount);
      if (ordering === "total_amount") return Number(a.total_amount) - Number(b.total_amount);
      return 0;
    });

  // Bulk operations functions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedBills(new Set(filteredBills.map(bill => bill.id)));
    } else {
      setSelectedBills(new Set());
    }
  };

  const handleSelectBill = (billId, checked) => {
    const newSelected = new Set(selectedBills);
    if (checked) {
      newSelected.add(billId);
    } else {
      newSelected.delete(billId);
    }
    setSelectedBills(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedBills.size === 0) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedBills.size} purchase bills?`);
    if (confirmed) {
      try {
        for (const billId of selectedBills) {
          await onDelete(billId);
        }
        setSelectedBills(new Set());
        setShowBulkActions(false);
      } catch (error) {
        alert('Error deleting some bills. Please try again.');
      }
    }
  };

  // Export functions
  const exportToCSV = () => {
    const selectedData = filteredBills.filter(bill => selectedBills.has(bill.id));
    const dataToExport = selectedData.length > 0 ? selectedData : filteredBills;
    
    const csvHeaders = ['Bill Number', 'Date', 'Vendor', 'Total Amount', 'Items Count'];
    const csvData = dataToExport.map(bill => [
      bill.bill_number,
      bill.bill_date,
      bill.vendor_name,
      bill.total_amount,
      bill.items?.length || 0
    ]);
    
    const csvContent = [csvHeaders, ...csvData].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase-bills-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportDetailedCSV = () => {
    const selectedData = filteredBills.filter(bill => selectedBills.has(bill.id));
    const dataToExport = selectedData.length > 0 ? selectedData : filteredBills;
    
    const csvHeaders = ['Bill Number', 'Date', 'Vendor', 'Item Name', 'Quantity', 'Unit', 'Rate', 'Amount', 'Total Bill Amount'];
    const csvData = [];
    
    dataToExport.forEach(bill => {
      if (bill.items && bill.items.length > 0) {
        bill.items.forEach(item => {
          csvData.push([
            bill.bill_number,
            bill.bill_date,
            bill.vendor_name,
            item.product || item.item_name,
            item.quantity,
            item.unit,
            item.price || item.rate,
            item.amount,
            bill.total_amount
          ]);
        });
      } else {
        csvData.push([
          bill.bill_number,
          bill.bill_date,
          bill.vendor_name,
          'No items',
          '',
          '',
          '',
          '',
          bill.total_amount
        ]);
      }
    });
    
    const csvContent = [csvHeaders, ...csvData].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase-bills-detailed-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/5 backdrop-filter backdrop-blur-20 p-4 rounded shadow border border-white/10">
      {/* Enhanced Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="border border-white/30 rounded px-2 py-1 text-sm bg-white/10 backdrop-filter backdrop-blur-10 text-white placeholder-white/70 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
          placeholder="Search Bill Number or Vendor"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="border border-white/30 rounded px-2 py-1 text-sm bg-white/10 backdrop-filter backdrop-blur-10 text-white focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
        >
          <option value="-bill_date" className="bg-[#1a2341] text-white">Newest</option>
          <option value="bill_date" className="bg-[#1a2341] text-white">Oldest</option>
          <option value="-total_amount" className="bg-[#1a2341] text-white">Amount (High to Low)</option>
          <option value="total_amount" className="bg-[#1a2341] text-white">Amount (Low to High)</option>
        </select>
        <input
          type="date"
          placeholder="From Date"
          value={dateFilter.start}
          onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
          className="border border-white/30 rounded px-2 py-1 text-sm bg-white/10 backdrop-filter backdrop-blur-10 text-white focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
        />
        <input
          type="date"
          placeholder="To Date"
          value={dateFilter.end}
          onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
          className="border border-white/30 rounded px-2 py-1 text-sm bg-white/10 backdrop-filter backdrop-blur-10 text-white focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
        />
        <button
          onClick={() => setDateFilter({ start: "", end: "" })}
          className="px-3 py-1 bg-gray-500/30 text-white border border-gray-300/50 rounded hover:bg-gray-500/50 transition text-sm backdrop-filter backdrop-blur-10 drop-shadow-lg"
        >
          Clear Dates
        </button>
        <button
          onClick={() => setShowAdvancedFilters(true)}
          className="px-3 py-1 bg-purple-500/30 text-white border border-purple-300/50 rounded hover:bg-purple-500/50 transition text-sm flex items-center gap-1 backdrop-filter backdrop-blur-10 drop-shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
          </svg>
          Advanced Filters
        </button>
      </div>

      {/* Bulk Actions */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          {selectedBills.size > 0 && (
            <>
              <span className="text-sm text-white/80 drop-shadow-lg">
                {selectedBills.size} selected
              </span>
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="px-3 py-1 bg-blue-500/30 text-white border border-blue-300/50 rounded hover:bg-blue-500/50 transition text-sm backdrop-filter backdrop-blur-10 drop-shadow-lg"
              >
                Bulk Actions
              </button>
            </>
          )}
          {showBulkActions && (
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-500/30 text-white border border-red-300/50 rounded hover:bg-red-500/50 transition text-sm backdrop-filter backdrop-blur-10 drop-shadow-lg"
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-3 py-1 bg-green-500/30 text-white border border-green-300/50 rounded hover:bg-green-500/50 transition text-sm flex items-center gap-1 backdrop-filter backdrop-blur-10 drop-shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={exportDetailedCSV}
            className="px-3 py-1 bg-blue-500/30 text-white border border-blue-300/50 rounded hover:bg-blue-500/50 transition text-sm flex items-center gap-1 backdrop-filter backdrop-blur-10 drop-shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Detailed CSV
          </button>
        </div>
      </div>
      {/* Table for desktop, Cards for mobile */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-gradient-to-r from-[#7fd3f7]/10 to-[#b6e0f7]/10 backdrop-blur-10">
              <th className="text-left py-3 px-4 rounded-l-lg">
                <input
                  type="checkbox"
                  checked={filteredBills.length > 0 && selectedBills.size === filteredBills.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10 backdrop-filter backdrop-blur-10"
                />
              </th>
              <th className="text-left py-3 px-4 font-black text-white drop-shadow-lg">Bill Number</th>
              <th className="text-left py-3 px-4 font-black text-white drop-shadow-lg">Bill Date</th>
              <th className="text-left py-3 px-4 font-black text-white drop-shadow-lg">Vendor</th>
              <th className="text-left py-3 px-4 font-black text-white drop-shadow-lg">Items</th>
              <th className="text-right py-3 px-4 font-black text-white drop-shadow-lg">Total Amount</th>
              <th className="text-center py-3 px-4 rounded-r-lg font-black text-white drop-shadow-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      <td
                        colSpan={7}
                        className="py-6 animate-pulse bg-white/10 backdrop-filter backdrop-blur-10 rounded"
                      />
                    </tr>
                  ))
              : filteredBills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="bg-white/5 backdrop-filter backdrop-blur-10 shadow rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300"
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedBills.has(bill.id)}
                        onChange={(e) => handleSelectBill(bill.id, e.target.checked)}
                        className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10 backdrop-filter backdrop-blur-10"
                      />
                    </td>
                    <td className="py-3 px-4 font-semibold text-white drop-shadow-lg">
                      {bill.bill_number}
                    </td>
                    <td className="py-3 px-4 text-white drop-shadow-lg">{bill.bill_date}</td>
                    <td className="py-3 px-4 text-white drop-shadow-lg">{bill.vendor_name}</td>
                    <td className="py-3 px-4">
                      {bill.items && bill.items.length > 0 ? (
                        <div className="flex items-center gap-2">
                          {/* Show first 2 items as compact pills */}
                          <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                            {bill.items.slice(0, 2).map((item, idx) => (
                              <span
                                key={item.id || idx}
                                className="inline-flex items-center px-2 py-1 bg-white/10 text-white/90 text-xs rounded-md border border-white/10 truncate max-w-[90px]"
                                title={`${item.product || 'Product'} - Qty: ${item.quantity} × ₹${Number(item.price).toFixed(0)}`}
                              >
                                {(item.product || 'Product').length > 12 
                                  ? (item.product || 'Product').slice(0, 12) + '...' 
                                  : (item.product || 'Product')}
                              </span>
                            ))}
                          </div>
                          {/* Show count badge if more items */}
                          {bill.items.length > 2 && (
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-500/30 text-purple-300 text-xs font-semibold rounded-full border border-purple-400/30">
                              +{bill.items.length - 2}
                            </span>
                          )}
                          {/* Total items indicator */}
                          <span className="text-[10px] text-gray-500 ml-1">
                            ({bill.items.length} items)
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs italic">No items</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white drop-shadow-lg">
                      ₹{Number(bill.total_amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-4 text-center space-x-2">
                      <button
                        className="px-3 py-1 bg-blue-500/30 text-white border border-blue-300/50 rounded hover:bg-blue-500/50 transition backdrop-filter backdrop-blur-10 drop-shadow-lg"
                        onClick={() => onView(bill.id)}
                      >
                        View
                      </button>
                      <button
                        className="px-3 py-1 bg-green-500/30 text-white border border-green-300/50 rounded hover:bg-green-500/50 transition backdrop-filter backdrop-blur-10 drop-shadow-lg"
                        onClick={() => onEdit(bill)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 bg-red-500/30 text-white border border-red-300/50 rounded hover:bg-red-500/50 transition backdrop-filter backdrop-blur-10 drop-shadow-lg"
                        onClick={() => onDelete(bill.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        </div>

        {/* No data message */}
        {!isLoading &&
          (!data ||
            (Array.isArray(data)
              ? data.length === 0
              : ((!data.data || data.data.length === 0) &&
                  (!data.results || data.results.length === 0)))) && (
          <div className="p-8 text-center text-white/80 drop-shadow-lg">
            <p>No purchase bills found.</p>
            <p className="text-sm mt-2">
              Click "New Purchase" to create your first purchase bill.
            </p>
          </div>
        )}
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10 p-4 animate-pulse">
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-3/4"></div>
            </div>
          ))
        ) : (
          filteredBills.map((bill) => (
            <div key={bill.id} className="bg-white/5 backdrop-filter backdrop-blur-10 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-300">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedBills.has(bill.id)}
                    onChange={(e) => handleSelectBill(bill.id, e.target.checked)}
                    className="rounded border-white/30 text-cyan-300 focus:ring-cyan-300 bg-white/10"
                  />
                  <div>
                    <div className="text-lg font-semibold text-white">
                      {bill.bill_number}
                    </div>
                    <div className="text-sm text-white/70">
                      {format(new Date(bill.bill_date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Vendor:</span>
                  <span className="text-sm font-medium text-white">{bill.vendor_name}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Items:</span>
                  <span className="text-sm text-white">{bill.items?.length || 0} items</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Total Amount:</span>
                  <span className="text-lg font-semibold text-[#7fd3f7]">
                    ₹{Number(bill.total_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex space-x-2 mt-4 pt-3 border-t border-white/10">
                <button
                  onClick={() => onView(bill)}
                  className="flex-1 px-3 py-2 bg-blue-500/30 text-white border border-blue-300/50 rounded-lg hover:bg-blue-500/50 transition backdrop-filter backdrop-blur-10 text-sm font-medium"
                >
                  View
                </button>
                <button
                  onClick={() => onEdit(bill)}
                  className="flex-1 px-3 py-2 bg-indigo-500/30 text-white border border-indigo-300/50 rounded-lg hover:bg-indigo-500/50 transition backdrop-filter backdrop-blur-10 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(bill)}
                  className="flex-1 px-3 py-2 bg-red-500/30 text-white border border-red-300/50 rounded-lg hover:bg-red-500/50 transition backdrop-filter backdrop-blur-10 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}

        {/* No data message for mobile */}
        {!isLoading && filteredBills.length === 0 && (
          <div className="p-8 text-center text-white/80">
            <p>No purchase bills found.</p>
            <p className="text-sm mt-2">
              Click "New Purchase" to create your first purchase bill.
            </p>
          </div>
        )}
      </div>
      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-400">
          {data?.pagination ? `Showing ${((data.pagination.page - 1) * data.pagination.limit) + 1}-${Math.min(data.pagination.page * data.pagination.limit, data.pagination.total_count)} of ${data.pagination.total_count}` : ''}
        </span>
        <div className="flex gap-2 items-center">
          <button
            className="px-3 py-1.5 border border-white/20 rounded-md bg-white/5 text-white hover:bg-white/10 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            disabled={!data?.pagination?.has_prev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Prev
          </button>
          <span className="px-3 py-1 text-white text-sm">
            Page {data?.pagination?.page || page} of {data?.pagination?.total_pages || 1}
          </span>
          <button
            className="px-3 py-1.5 border border-white/20 rounded-md bg-white/5 text-white hover:bg-white/10 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            disabled={!data?.pagination?.has_next}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Advanced Filters Modal */}
      {showAdvancedFilters && (
        <AdvancedPurchaseFilters
          onFiltersChange={setAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
        />
      )}
    </div>
  );
}