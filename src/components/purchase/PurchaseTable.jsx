import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPurchaseBills } from "../../api/purchase";
import { format } from "date-fns";
import AdvancedPurchaseFilters from "./AdvancedPurchaseFilters";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import { EyeIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { parseDateOnly } from '../../utils/date';
import useResizableColumns from "../../hooks/useResizableColumns";
import { LIST_THEAD, LIST_TH, LIST_TH_SORTABLE, LIST_TH_LABEL } from "../common/tableHeaderClasses";

const DEFAULT_COLUMN_WIDTHS = {
  checkbox: 44,
  bill_number: 140,
  bill_date: 110,
  vendor_name: 190,
  items: 80,
  total_amount: 140,
  actions: 145,
};

export default function PurchaseTable({ onEdit, onView, onDelete }) {
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-bill_number"); // default: document number desc
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
  const [sortConfig, setSortConfig] = useState({ key: "bill_number", direction: "desc" });
  const { colWidths, renderResizeHandle } = useResizableColumns(
    "cenvoras_purchase_table_col_widths",
    DEFAULT_COLUMN_WIDTHS
  );

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["purchaseBills", page, limit],
    queryFn: () => getPurchaseBills({ page, limit }),
    keepPreviousData: true, // Smooth pagination transitions
  });

  if (error) {
    return (
      <div className="p-4 text-[var(--status-danger)]">
        Error loading purchase bills: {error.message}
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="btn-destructive ml-4 !text-xs !py-1 !px-2 !normal-case !tracking-normal !font-semibold"
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
      const { key, direction } = sortConfig;
      const factor = direction === "asc" ? 1 : -1;
      if (key === "bill_date") {
        return factor * (new Date(a.bill_date || 0) - new Date(b.bill_date || 0));
      }
      if (key === "bill_number") {
        return factor * String(a.bill_number || "").localeCompare(String(b.bill_number || ""), undefined, { numeric: true });
      }
      if (key === "vendor_name") {
        return factor * String(a.vendor_name || "").localeCompare(String(b.vendor_name || ""));
      }
      if (key === "total_amount") {
        return factor * (Number(a.total_amount || 0) - Number(b.total_amount || 0));
      }
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
    <div className="bg-[var(--bg-surface)] p-4 rounded-xl shadow border border-[var(--border-default)] text-[var(--text-primary)]">
      {/* Enhanced Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <input
            className="w-full sm:w-64 px-4 py-2.5 border border-[var(--border-default)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-1 focus:ring-[var(--border-focus)] focus:border-[var(--border-focus)] outline-none transition-all"
            placeholder="Search Bill or Vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="w-full sm:w-48 px-4 py-2.5 border border-[var(--border-default)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--border-focus)] focus:border-[var(--border-focus)] outline-none transition-all cursor-pointer"
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
            className="w-full sm:w-auto px-4 py-2.5 border border-[var(--border-default)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--border-focus)] focus:border-[var(--border-focus)] outline-none transition-all"
          />
          <input
            type="date"
            value={dateFilter.end}
            onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
            className="w-full sm:w-auto px-4 py-2.5 border border-[var(--border-default)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--border-focus)] focus:border-[var(--border-focus)] outline-none transition-all"
          />
          <button
            onClick={() => setDateFilter({ start: "", end: "" })}
            className="btn-secondary col-span-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            Clear
          </button>
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className="btn-secondary col-span-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
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
            <div className="flex items-center gap-3 p-2 px-4 bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 rounded-xl w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]">
                {selectedBills.size} Selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="btn-destructive !text-xs !py-1 !px-3 !normal-case !tracking-normal !font-semibold"
              >
                Delete
              </button>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={exportToCSV}
            className="btn-secondary flex-1 sm:flex-none text-xs py-2 px-3 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Summary
          </button>
          <button
            onClick={exportDetailedCSV}
            className="btn-secondary flex-1 sm:flex-none text-xs py-2 px-3 flex items-center justify-center gap-2"
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
          <table className="w-full table-fixed text-sm divide-y divide-[var(--border-subtle)]">
            <colgroup>
              <col style={{ width: `${colWidths.checkbox}px` }} />
              <col style={{ width: `${colWidths.bill_number}px` }} />
              <col style={{ width: `${colWidths.bill_date}px` }} />
              <col style={{ width: `${colWidths.vendor_name}px` }} />
              <col style={{ width: `${colWidths.items}px` }} />
              <col style={{ width: `${colWidths.total_amount}px` }} />
              <col style={{ width: `${colWidths.actions}px` }} />
            </colgroup>
          <thead className={LIST_THEAD}>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className={`${LIST_TH} rounded-l-lg`}>
                <input
                  type="checkbox"
                  checked={filteredBills.length > 0 && selectedBills.size === filteredBills.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-[var(--border-default)] accent-[var(--accent-primary)]"
                />
                {renderResizeHandle("checkbox")}
              </th>
              <th
                onClick={() => handleSort("bill_number")}
                className={LIST_TH_SORTABLE}
              >
                <div className={LIST_TH_LABEL}>
                  <span>Bill Number</span>
                  {sortConfig.key === "bill_number" && (
                    <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
                {renderResizeHandle("bill_number")}
              </th>
              <th
                onClick={() => handleSort("bill_date")}
                className={LIST_TH_SORTABLE}
              >
                <div className={LIST_TH_LABEL}>
                  <span>Bill Date</span>
                  {sortConfig.key === "bill_date" && (
                    <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
                {renderResizeHandle("bill_date")}
              </th>
              <th
                onClick={() => handleSort("vendor_name")}
                className={LIST_TH_SORTABLE}
              >
                <div className={LIST_TH_LABEL}>
                  <span>Vendor</span>
                  {sortConfig.key === "vendor_name" && (
                    <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
                {renderResizeHandle("vendor_name")}
              </th>
              <th className={LIST_TH}>
                Items
                {renderResizeHandle("items")}
              </th>
              <th
                onClick={() => handleSort("total_amount")}
                className={LIST_TH_SORTABLE}
              >
                <div className={LIST_TH_LABEL}>
                  <span>Total Amount</span>
                  {sortConfig.key === "total_amount" && (
                    <span className="text-[var(--accent-primary)] font-bold">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
                {renderResizeHandle("total_amount")}
              </th>
              <th className={`${LIST_TH} rounded-r-lg`}>
                Actions
                {renderResizeHandle("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {isLoading
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="no-hover">
                      <td
                        colSpan={7}
                        className="py-6 animate-pulse bg-[var(--bg-surface)] rounded-lg"
                      />
                    </tr>
                  ))
              : filteredBills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="hover:bg-[var(--bg-primary)] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedBills.has(bill.id)}
                        onChange={(e) => handleSelectBill(bill.id, e.target.checked)}
                        className="rounded border-[var(--border-default)] accent-[var(--accent-primary)]"
                      />
                    </td>
                    <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                      {bill.bill_number}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">
                      {bill.bill_date ? format(parseDateOnly(bill.bill_date), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-primary)] font-medium">{bill.vendor_name}</td>
                    <td className="py-3 px-4">
                      {bill.items && bill.items.length > 0 ? (
                        <div className="flex items-center gap-2">
                          {/* Show first 2 items as compact pills */}
                          <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                            {bill.items.slice(0, 2).map((item, idx) => (
                              <span
                                key={item.id || idx}
                                className="inline-flex items-center px-2 py-1 bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs rounded-md border border-[var(--border-default)] truncate max-w-[90px]"
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
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-xs font-bold rounded-full border border-[var(--border-default)]">
                              +{bill.items.length - 2}
                            </span>
                          )}
                          {/* Total items indicator */}
                          <span className="text-xs text-[var(--text-muted)] font-medium ml-1">
                            ({bill.items.length} items)
                          </span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] text-xs italic">No items</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[var(--text-primary)] tabular-nums">
                      {getCurrencySymbol()}{Number(bill.total_amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-all"
                          onClick={() => onView(bill.id)}
                          title="View Purchase Bill"
                          aria-label="View Purchase Bill"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className={`p-1.5 rounded-lg transition-all border ${
                            canEditBill(bill)
                              ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--accent-primary)]'
                              : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-subtle)] cursor-not-allowed opacity-40'
                          }`}
                          onClick={() => {
                            if (canEditBill(bill)) {
                              onEdit(bill);
                            }
                          }}
                          disabled={!canEditBill(bill)}
                          title={editBillTitle(bill)}
                          aria-label={editBillTitle(bill)}
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--status-danger)] border border-[var(--border-subtle)] hover:bg-[var(--status-danger)]/10 transition-all"
                          onClick={() => onDelete(bill.id)}
                          title="Delete Purchase Bill"
                          aria-label="Delete Purchase Bill"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
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
          <div className="p-8 text-center text-[var(--text-muted)] font-medium">
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
            <div key={i} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-5 animate-pulse">
              <div className="h-5 bg-[var(--bg-primary)] rounded-lg mb-4 w-1/2"></div>
              <div className="space-y-3">
                <div className="h-3 bg-[var(--bg-primary)] rounded w-full"></div>
                <div className="h-3 bg-[var(--bg-primary)] rounded w-3/4"></div>
              </div>
            </div>
          ))
        ) : (
          filteredBills.map((bill) => (
            <div key={bill.id} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-5 transition-all duration-150">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedBills.has(bill.id)}
                    onChange={(e) => handleSelectBill(bill.id, e.target.checked)}
                    className="rounded border-[var(--border-default)] accent-[var(--accent-primary)] w-5 h-5"
                  />
                  <div>
                    <div className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                      {bill.bill_number}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {bill.bill_date ? format(parseDateOnly(bill.bill_date), 'dd/MM/yyyy') : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-muted)]">Vendor:</span>
                  <span className="text-sm font-bold text-[var(--text-primary)] text-right truncate max-w-[150px]">{bill.vendor_name}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-muted)]">Items:</span>
                  <span className="text-xs font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/15 px-2 py-0.5 rounded border border-[var(--accent-primary)]/30">
                    {bill.items?.length || 0} items
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[var(--border-default)]">
                  <span className="text-xs text-[var(--text-muted)]">Amount:</span>
                  <span className="text-lg font-bold text-[var(--text-primary)] font-mono">
                    {getCurrencySymbol()}{Number(bill.total_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => onView(bill.id)}
                  title="View Purchase Bill"
                  aria-label="View Purchase Bill"
                  className="p-2 rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-all"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (canEditBill(bill)) {
                      onEdit(bill);
                    }
                  }}
                  disabled={!canEditBill(bill)}
                  title={editBillTitle(bill)}
                  aria-label={editBillTitle(bill)}
                  className={`p-2 rounded-lg transition-all border ${
                    canEditBill(bill)
                      ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--accent-primary)]'
                      : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-subtle)] cursor-not-allowed opacity-40'
                  }`}
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(bill.id)}
                  title="Delete Purchase Bill"
                  aria-label="Delete Purchase Bill"
                  className="p-2 rounded-lg bg-[var(--bg-primary)] text-[var(--status-danger)] border border-[var(--border-subtle)] hover:bg-[var(--status-danger)]/10 transition-all"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* No data message for mobile */}
        {!isLoading && filteredBills.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm font-bold text-[var(--text-muted)]">No purchase bills found.</p>
          </div>
        )}
      </div>
      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-[var(--text-muted)]">
          {data?.pagination ? `Showing ${((data.pagination.page - 1) * data.pagination.limit) + 1}-${Math.min(data.pagination.page * data.pagination.limit, data.pagination.total_count)} of ${data.pagination.total_count}` : ''}
        </span>
        <div className="flex gap-2 items-center">
          <button
            className="btn-secondary text-xs py-1.5 px-3"
            disabled={!data?.pagination?.has_prev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Prev
          </button>
          <span className="px-3 py-1 text-[var(--text-primary)] text-sm font-semibold">
            Page {data?.pagination?.page || page} of {data?.pagination?.total_pages || 1}
          </span>
          <button
            className="btn-secondary text-xs py-1.5 px-3"
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