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

  const inputClass = "w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all text-sm";
  const labelClass = "block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="relative bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[var(--text-primary)]">
            Advanced Filters
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
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
              <option value="" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">All Journals</option>
              <option value="Purchase" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Purchase</option>
              <option value="Inventory" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Inventory</option>
              <option value="Expense" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Expense</option>
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
              <option value="" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">All GST Treatments</option>
              <option value="taxable" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Taxable</option>
              <option value="non_taxable" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Non-Taxable</option>
              <option value="exempt" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Exempt</option>
              <option value="zero_rated" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Zero Rated</option>
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
                  className="w-4 h-4 rounded border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/50 cursor-pointer"
                />
                <span className="ml-3 text-sm text-[var(--text-secondary)]">
                  Show only overdue bills
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8 border-t border-[var(--border-subtle)] pt-6">
          <button
            onClick={handleClearFilters}
            className="px-6 py-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]/40 rounded-xl transition-colors text-sm"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]/40 rounded-xl transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyFilters}
            className="btn-primary"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
