import React, { useState } from "react";

export default function AdvancedPurchaseFilters({ onFiltersChange, onClose }) {
  const [filters, setFilters] = useState({
    dateRange: { start: "", end: "" },
    amountRange: { min: "", max: "" },
    vendor: "",
    journal: "",
    gstTreatment: "",
    status: "all",
    hasOverdue: false,
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(filters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      dateRange: { start: "", end: "" },
      amountRange: { min: "", max: "" },
      vendor: "",
      journal: "",
      gstTreatment: "",
      status: "all",
      hasOverdue: false,
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const inputClass = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            Advanced Filters
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Date Range */}
          <div>
            <label className={labelClass}>
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                className={inputClass}
                placeholder="From"
              />
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                className={inputClass}
                placeholder="To"
              />
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <label className={labelClass}>
              Amount Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.amountRange.min}
                onChange={(e) => handleFilterChange('amountRange', { ...filters.amountRange, min: e.target.value })}
                className={inputClass}
                placeholder="Min Amount"
              />
              <input
                type="number"
                value={filters.amountRange.max}
                onChange={(e) => handleFilterChange('amountRange', { ...filters.amountRange, max: e.target.value })}
                className={inputClass}
                placeholder="Max Amount"
              />
            </div>
          </div>

          {/* Vendor Filter */}
          <div>
            <label className={labelClass}>
              Vendor
            </label>
            <input
              type="text"
              value={filters.vendor}
              onChange={(e) => handleFilterChange('vendor', e.target.value)}
              className={inputClass}
              placeholder="Filter by vendor name"
            />
          </div>

          {/* Journal Filter */}
          <div>
            <label className={labelClass}>
              Journal
            </label>
            <select
              value={filters.journal}
              onChange={(e) => handleFilterChange('journal', e.target.value)}
              className={inputClass}
            >
              <option value="" className="bg-gray-900 text-white">All Journals</option>
              <option value="Purchase" className="bg-gray-900 text-white">Purchase</option>
              <option value="Inventory" className="bg-gray-900 text-white">Inventory</option>
              <option value="Expense" className="bg-gray-900 text-white">Expense</option>
            </select>
          </div>

          {/* GST Treatment */}
          <div>
            <label className={labelClass}>
              GST Treatment
            </label>
            <select
              value={filters.gstTreatment}
              onChange={(e) => handleFilterChange('gstTreatment', e.target.value)}
              className={inputClass}
            >
              <option value="" className="bg-gray-900 text-white">All GST Treatments</option>
              <option value="taxable" className="bg-gray-900 text-white">Taxable</option>
              <option value="non_taxable" className="bg-gray-900 text-white">Non-Taxable</option>
              <option value="exempt" className="bg-gray-900 text-white">Exempt</option>
              <option value="zero_rated" className="bg-gray-900 text-white">Zero Rated</option>
            </select>
          </div>

          {/* Special Filters */}
          <div>
            <label className={labelClass}>
              Special Filters
            </label>
            <div className="space-y-2 mt-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasOverdue}
                  onChange={(e) => handleFilterChange('hasOverdue', e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900 cursor-pointer"
                />
                <span className="ml-3 text-sm text-gray-300">
                  Show only overdue bills
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8 border-t border-white/10 pt-6">
          <button
            onClick={handleClearFilters}
            className="px-6 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyFilters}
            className="btn-primary bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
