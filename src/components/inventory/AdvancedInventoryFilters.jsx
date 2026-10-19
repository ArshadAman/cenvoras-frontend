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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-obsidian-card border border-hairline rounded-2xl shadow-2xl p-6 w-full max-w-2xl text-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">
            Advanced Inventory Filters
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full border border-hairline bg-obsidian-elevated text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none"
            >
              <option value="" className="bg-slate-900 text-white">All Categories</option>
              <option value="Electronics" className="bg-slate-900 text-white">Electronics</option>
              <option value="Clothing" className="bg-slate-900 text-white">Clothing</option>
              <option value="Food" className="bg-slate-900 text-white">Food</option>
              <option value="Books" className="bg-slate-900 text-white">Books</option>
              <option value="Home & Garden" className="bg-slate-900 text-white">Home & Garden</option>
              <option value="Sports" className="bg-slate-900 text-white">Sports</option>
              <option value="Automotive" className="bg-slate-900 text-white">Automotive</option>
              <option value="Health & Beauty" className="bg-slate-900 text-white">Health & Beauty</option>
              <option value="Toys" className="bg-slate-900 text-white">Toys</option>
              <option value="Other" className="bg-slate-900 text-white">Other</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
              Price Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.priceRange.min}
                onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, min: e.target.value })}
                className="border border-hairline bg-obsidian-elevated text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none"
                placeholder="Min Price"
                min="0"
                step="0.01"
              />
              <input
                type="number"
                value={filters.priceRange.max}
                onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, max: e.target.value })}
                className="border border-hairline bg-obsidian-elevated text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none"
                placeholder="Max Price"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Stock Range */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
              Stock Quantity Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.stockRange.min}
                onChange={(e) => handleFilterChange('stockRange', { ...filters.stockRange, min: e.target.value })}
                className="border border-hairline bg-obsidian-elevated text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none"
                placeholder="Min Stock"
                min="0"
              />
              <input
                type="number"
                value={filters.stockRange.max}
                onChange={(e) => handleFilterChange('stockRange', { ...filters.stockRange, max: e.target.value })}
                className="border border-hairline bg-obsidian-elevated text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none"
                placeholder="Max Stock"
                min="0"
              />
            </div>
          </div>

          {/* Supplier Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
              Supplier
            </label>
            <input
              type="text"
              value={filters.supplier}
              onChange={(e) => handleFilterChange('supplier', e.target.value)}
              className="w-full border border-hairline bg-obsidian-elevated text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none"
              placeholder="Filter by supplier name"
            />
          </div>

          {/* Special Filters */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
              Special Filters
            </label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.lowStock}
                  onChange={(e) => handleFilterChange('lowStock', e.target.checked)}
                  className="w-4 h-4 rounded border-hairline bg-obsidian-elevated text-sky-500 focus:ring-0"
                />
                <span className="ml-2 text-sm text-slate-300">
                  Show only low stock items
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.outOfStock}
                  onChange={(e) => handleFilterChange('outOfStock', e.target.checked)}
                  className="w-4 h-4 rounded border-hairline bg-obsidian-elevated text-sky-500 focus:ring-0"
                />
                <span className="ml-2 text-sm text-slate-300">
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
            className="px-4 py-2 text-slate-300 border border-hairline rounded-xl hover:bg-obsidian-elevated transition-colors text-sm font-medium"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 border border-hairline rounded-xl hover:bg-obsidian-elevated transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-md active:scale-95"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
