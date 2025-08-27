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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Advanced Filters
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="From"
              />
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="To"
              />
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.amountRange.min}
                onChange={(e) => handleFilterChange('amountRange', { ...filters.amountRange, min: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Min Amount"
              />
              <input
                type="number"
                value={filters.amountRange.max}
                onChange={(e) => handleFilterChange('amountRange', { ...filters.amountRange, max: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Max Amount"
              />
            </div>
          </div>

          {/* Vendor Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vendor
            </label>
            <input
              type="text"
              value={filters.vendor}
              onChange={(e) => handleFilterChange('vendor', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Filter by vendor name"
            />
          </div>

          {/* Journal Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Journal
            </label>
            <select
              value={filters.journal}
              onChange={(e) => handleFilterChange('journal', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Journals</option>
              <option value="Purchase">Purchase</option>
              <option value="Inventory">Inventory</option>
              <option value="Expense">Expense</option>
            </select>
          </div>

          {/* GST Treatment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              GST Treatment
            </label>
            <select
              value={filters.gstTreatment}
              onChange={(e) => handleFilterChange('gstTreatment', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All GST Treatments</option>
              <option value="taxable">Taxable</option>
              <option value="non_taxable">Non-Taxable</option>
              <option value="exempt">Exempt</option>
              <option value="zero_rated">Zero Rated</option>
            </select>
          </div>

          {/* Status & Special Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Special Filters
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasOverdue}
                  onChange={(e) => handleFilterChange('hasOverdue', e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Show only overdue bills
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
