import React from "react";

export default function AdvancedSalesFilters({ filters, onChange, onClose }) {
  const handleChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  const handleDateRangeChange = (field, value) => {
    onChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value,
      },
    });
  };

  const handleAmountRangeChange = (field, value) => {
    onChange({
      ...filters,
      amountRange: {
        ...filters.amountRange,
        [field]: value,
      },
    });
  };

  const clearFilters = () => {
    onChange({
      dateRange: { start: "", end: "" },
      amountRange: { min: "", max: "" },
      customer: "",
      paymentStatus: "",
      status: "all",
      hasOverdue: false,
    });
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Advanced Filters</h3>
        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Date Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
          <div className="space-y-2">
            <input
              type="date"
              placeholder="From date"
              value={filters.dateRange.start}
              onChange={(e) => handleDateRangeChange("start", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
            />
            <input
              type="date"
              placeholder="To date"
              value={filters.dateRange.end}
              onChange={(e) => handleDateRangeChange("end", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
            />
          </div>
        </div>

        {/* Amount Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount Range</label>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Min amount"
              value={filters.amountRange.min}
              onChange={(e) => handleAmountRangeChange("min", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
            />
            <input
              type="number"
              placeholder="Max amount"
              value={filters.amountRange.max}
              onChange={(e) => handleAmountRangeChange("max", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
            />
          </div>
        </div>

        {/* Customer */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
          <input
            type="text"
            placeholder="Customer name"
            value={filters.customer}
            onChange={(e) => handleChange("customer", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
          />
        </div>

        {/* Payment Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Status</label>
          <select
            value={filters.paymentStatus}
            onChange={(e) => handleChange("paymentStatus", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {/* Overdue Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Special Filters</label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasOverdue"
              checked={filters.hasOverdue}
              onChange={(e) => handleChange("hasOverdue", e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="hasOverdue" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Show overdue bills only
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}