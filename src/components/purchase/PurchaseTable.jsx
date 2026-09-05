import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPurchaseBills } from "../../api/purchase";
import { format } from "date-fns";
import AdvancedPurchaseFilters from "./AdvancedPurchaseFilters";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

export default function PurchaseTable({ onEdit, onView, onDelete }) {
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-bill_date"); // default: newest first
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Items per page
  const [selectedBills, setSelectedBills] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const canEditBill = (bill) => String(bill?.payment_status || 'pending').toLowerCase() === 'pending';
  const editBillTitle = (bill) => canEditBill(bill)
    ? 'Edit bill'
    : 'Only pending bills can be edited.';
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
    a.download = `purchase-bills-${new Date().toLocaleDateString('sv-SE')}.csv`;
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
            item.product_detail?.name || item.product || item.item_name,
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
    a.download = `purchase-bills-detailed-${new Date().toLocaleDateString('sv-SE')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/5 backdrop-filter backdrop-blur-20 p-4 rounded shadow border border-white/10">
      {/* Enhanced Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <input
            className="w-full sm:w-64 px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder-white/30 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
            placeholder="Search Bill or Vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="w-full sm:w-48 px-4 py-2.5 border border-white/10 rounded-xl bg-[#0a0a0a] text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all cursor-pointer"
          >
            <option value="-bill_date">Newest First</option>
            <option value="bill_date">Oldest First</option>
            <option value="-total_amount">Amount: High-Low</option>
            <option value="total_amount">Amount: Low-High</option>
          </select>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 w-full lg:w-auto">
          <input
            type="date"
            value={dateFilter.start}
            onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
            className="w-full sm:w-auto px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
          />
          <input
            type="date"
            value={dateFilter.end}
            onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
            className="w-full sm:w-auto px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
          />
          <button
            onClick={() => setDateFilter({ start: "", end: "" })}
            className="col-span-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white text-xs font-black uppercase tracking-widest transition-all"
          >
            Clear
          </button>
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className="col-span-1 px-4 py-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 hover:bg-purple-500/20 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions & Export */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {selectedBills.size > 0 && (
            <div className="flex items-center gap-3 p-2 px-4 bg-purple-500/10 border border-purple-500/20 rounded-xl w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                {selectedBills.size} Selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-500/30 transition-all"
              >
                Delete
              </button>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={exportToCSV}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Summary
          </button>
          <button
            onClick={exportDetailedCSV}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Detailed
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
                                title={`${item.product_detail?.name || item.product || 'Product'} - Qty: ${item.quantity} × ${getCurrencySymbol()}${Number(item.price).toFixed(0)}`}
                              >
                                {(item.product_detail?.name || item.product || 'Product').length > 12 
                                  ? (item.product_detail?.name || item.product || 'Product').slice(0, 12) + '...' 
                                  : (item.product_detail?.name || item.product || 'Product')}
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
                      {getCurrencySymbol()}{Number(bill.total_amount).toLocaleString(undefined, {
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
                        type="button"
                        className={`px-3 py-1 rounded transition backdrop-filter backdrop-blur-10 drop-shadow-lg border ${
                          canEditBill(bill)
                            ? 'bg-green-500/30 text-white border-green-300/50 hover:bg-green-500/50'
                            : 'bg-white/5 text-gray-500 border-white/10 cursor-not-allowed opacity-70'
                        }`}
                        onClick={() => {
                          if (canEditBill(bill)) {
                            onEdit(bill);
                          }
                        }}
                        disabled={!canEditBill(bill)}
                        title={editBillTitle(bill)}
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
      <div className="lg:hidden space-y-4 p-2">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white/5 backdrop-filter backdrop-blur-10 rounded-2xl border border-white/10 p-5 animate-pulse">
              <div className="h-5 bg-white/20 rounded-lg mb-4 w-1/2"></div>
              <div className="space-y-3">
                <div className="h-3 bg-white/10 rounded w-full"></div>
                <div className="h-3 bg-white/10 rounded w-3/4"></div>
              </div>
            </div>
          ))
        ) : (
          filteredBills.map((bill) => (
            <div key={bill.id} className="bg-white/5 backdrop-filter backdrop-blur-10 rounded-2xl border border-white/10 p-5 hover:bg-white/10 transition-all duration-300">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedBills.has(bill.id)}
                    onChange={(e) => handleSelectBill(bill.id, e.target.checked)}
                    className="rounded border-white/10 text-purple-500 focus:ring-purple-500 bg-white/5 w-5 h-5"
                  />
                  <div>
                    <div className="text-base font-black text-white tracking-tight">
                      {bill.bill_number}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                      {format(new Date(bill.bill_date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Vendor:</span>
                  <span className="text-sm font-bold text-white text-right truncate max-w-[150px]">{bill.vendor_name}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Items:</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20">
                    {bill.items?.length || 0} items
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Amount:</span>
                  <span className="text-lg font-black text-white font-mono tracking-tighter">
                    {getCurrencySymbol()}{Number(bill.total_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex gap-2 mt-5 pt-4 border-t border-white/5">
                <button
                  onClick={() => onView(bill.id)}
                  className="flex-1 px-4 py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (canEditBill(bill)) {
                      onEdit(bill);
                    }
                  }}
                  disabled={!canEditBill(bill)}
                  className={`flex-1 px-4 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center border ${
                    canEditBill(bill)
                      ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                      : 'bg-white/5 text-gray-600 border-white/5 cursor-not-allowed opacity-50'
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(bill.id)}
                  className="flex-1 px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}

        {/* No data message for mobile */}
        {!isLoading && filteredBills.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-gray-500">No purchase bills found.</p>
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