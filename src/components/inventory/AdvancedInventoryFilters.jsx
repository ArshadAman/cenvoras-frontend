import React, { useState } from "react";

export default function AdvancedInventoryFilters({ onFiltersChange, onClose }) {
  const [filters, setFilters] = useState({
    category: "",
    priceRange: { min: "", max: "" },
    stockRange: { min: "", max: "" },
    supplier: "",
    lowStock: false,
    outOfStock: false,
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
      category: "",
      priceRange: { min: "", max: "" },
      stockRange: { min: "", max: "" },
      supplier: "",
      lowStock: false,
      outOfStock: false,
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bento-card border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl shadow-2xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            Advanced Inventory Filters
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
          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none"
            >
              <option value="" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">All Categories</option>
              <option value="Electronics" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Electronics</option>
              <option value="Clothing" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Clothing</option>
              <option value="Food" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Food</option>
              <option value="Books" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Books</option>
              <option value="Home & Garden" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Home & Garden</option>
              <option value="Sports" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Sports</option>
              <option value="Automotive" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Automotive</option>
              <option value="Health & Beauty" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Health & Beauty</option>
              <option value="Toys" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Toys</option>
              <option value="Other" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Other</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
              Price Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.priceRange.min}
                onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, min: e.target.value })}
                className="border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none"
                placeholder="Min Price"
                min="0"
                step="0.01"
              />
              <input
                type="number"
                value={filters.priceRange.max}
                onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, max: e.target.value })}
                className="border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none"
                placeholder="Max Price"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Stock Range */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
              Stock Quantity Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.stockRange.min}
                onChange={(e) => handleFilterChange('stockRange', { ...filters.stockRange, min: e.target.value })}
                className="border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none"
                placeholder="Min Stock"
                min="0"
              />
              <input
                type="number"
                value={filters.stockRange.max}
                onChange={(e) => handleFilterChange('stockRange', { ...filters.stockRange, max: e.target.value })}
                className="border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none"
                placeholder="Max Stock"
                min="0"
              />
            </div>
          </div>

          {/* Supplier Filter */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
              Supplier
            </label>
            <input
              type="text"
              value={filters.supplier}
              onChange={(e) => handleFilterChange('supplier', e.target.value)}
              className="w-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)] outline-none"
              placeholder="Filter by supplier name"
            />
          </div>

          {/* Special Filters */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
              Special Filters
            </label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.lowStock}
                  onChange={(e) => handleFilterChange('lowStock', e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--accent-primary)] focus:ring-0"
                />
                <span className="ml-2 text-sm text-[var(--text-secondary)]">
                  Show only low stock items
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.outOfStock}
                  onChange={(e) => handleFilterChange('outOfStock', e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--accent-primary)] focus:ring-0"
                />
                <span className="ml-2 text-sm text-[var(--text-secondary)]">
                  Show only out of stock items
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-[var(--text-secondary)] border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:text-[var(--text-primary)] rounded-xl transition-colors text-sm font-medium"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-[var(--text-secondary)] border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:text-[var(--text-primary)] rounded-xl transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyFilters}
            className="btn-primary text-sm font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
