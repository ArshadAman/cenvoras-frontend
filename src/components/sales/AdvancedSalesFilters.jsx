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

  const handleFinancialYearChange = (fy) => {
    if (!fy) {
      onChange({
        ...filters,
        financialYear: "",
      });
      return;
    }
    const [startYear] = fy.split("-");
    const y = parseInt(startYear, 10);
    const start = `${y}-04-01`;
    const end = `${y + 1}-03-31`;
    onChange({
      ...filters,
      financialYear: fy,
      dateRange: { start, end },
    });
  };

  const clearFilters = () => {
    onChange({
      dateRange: { start: "", end: "" },
      amountRange: { min: "", max: "" },
      customer: "",
      financialYear: "",
      status: "all",
      hasOverdue: false,
    });
  };

  const inputClass = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide";

  return (
    <div className="mb-6 p-6 bento-card border border-white/10 relative">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Advanced Filters</h3>
        <div className="flex gap-4">
          <button
            onClick={clearFilters}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Financial Year */}
        <div className="space-y-2">
          <label className={labelClass}>Financial Year</label>
          <select
            value={filters.financialYear || ""}
            onChange={(e) => handleFinancialYearChange(e.target.value)}
            className={inputClass}
          >
            <option value="" className="bg-[#111] text-gray-400">All Financial Years</option>
            <option value="2026-2027" className="bg-[#111] text-white">FY 2026-27 (Apr 2026 - Mar 2027)</option>
            <option value="2025-2026" className="bg-[#111] text-white">FY 2025-26 (Apr 2025 - Mar 2026)</option>
            <option value="2024-2025" className="bg-[#111] text-white">FY 2024-25 (Apr 2024 - Mar 2025)</option>
            <option value="2023-2024" className="bg-[#111] text-white">FY 2023-24 (Apr 2023 - Mar 2024)</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <label className={labelClass}>Date Range</label>
          <div className="flex gap-2">
            <input
              type="date"
              placeholder="From date"
              value={filters.dateRange.start}
              onChange={(e) => handleDateRangeChange("start", e.target.value)}
              className={inputClass}
            />
            <input
              type="date"
              placeholder="To date"
              value={filters.dateRange.end}
              onChange={(e) => handleDateRangeChange("end", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Amount Range */}
        <div className="space-y-2">
          <label className={labelClass}>Amount Range</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.amountRange.min}
              onChange={(e) => handleAmountRangeChange("min", e.target.value)}
              className={inputClass}
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.amountRange.max}
              onChange={(e) => handleAmountRangeChange("max", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Customer */}
        <div className="space-y-2">
          <label className={labelClass}>Customer</label>
          <input
            type="text"
            placeholder="Customer name"
            value={filters.customer}
            onChange={(e) => handleChange("customer", e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Special Filters */}
        <div className="space-y-2">
          <label className={labelClass}>Special Filters</label>
          <div className="flex items-center h-10">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="hasOverdue"
                checked={filters.hasOverdue}
                onChange={(e) => handleChange("hasOverdue", e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900 cursor-pointer"
              />
              <span className="ml-3 text-sm text-gray-300">
                Show overdue bills only
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}