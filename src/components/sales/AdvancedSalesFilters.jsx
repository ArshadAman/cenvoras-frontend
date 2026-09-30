import React from "react";
import DateInputField from "../common/DateInputField";
import { XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

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

  return (
    <div className="mb-4 p-3 rounded-2xl bg-[#0f0f10]/95 border border-white/10 backdrop-blur-xl shadow-xl transition-all duration-300 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left side: Single-line filter controls */}
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          
          {/* Financial Year */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">FY:</span>
            <select
              value={filters.financialYear || ""}
              onChange={(e) => handleFinancialYearChange(e.target.value)}
              className="bg-black/50 text-white text-xs border border-white/10 rounded-xl px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-cyan-500/50 cursor-pointer"
            >
              <option value="" className="bg-[#111] text-gray-400">All Financial Years</option>
              <option value="2026-2027" className="bg-[#111] text-white">FY 2026-27</option>
              <option value="2025-2026" className="bg-[#111] text-white">FY 2025-26</option>
              <option value="2024-2025" className="bg-[#111] text-white">FY 2024-25</option>
              <option value="2023-2024" className="bg-[#111] text-white">FY 2023-24</option>
            </select>
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block"></div>

          {/* Date Range with dd/mm/yyyy */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date:</span>
            <div className="w-28">
              <DateInputField
                value={filters.dateRange.start}
                onChange={(e) => handleDateRangeChange("start", e.target.value)}
                placeholder="From"
              />
            </div>
            <span className="text-gray-500">-</span>
            <div className="w-28">
              <DateInputField
                value={filters.dateRange.end}
                onChange={(e) => handleDateRangeChange("end", e.target.value)}
                placeholder="To"
              />
            </div>
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block"></div>

          {/* Amount Range */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Amount:</span>
            <div className="relative w-24">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
              <input
                type="number"
                placeholder="Min"
                value={filters.amountRange.min}
                onChange={(e) => handleAmountRangeChange("min", e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-6 pr-2 py-1.5 text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 outline-none text-xs"
              />
            </div>
            <span className="text-gray-500">-</span>
            <div className="relative w-24">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.amountRange.max}
                onChange={(e) => handleAmountRangeChange("max", e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-6 pr-2 py-1.5 text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 outline-none text-xs"
              />
            </div>
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block"></div>

          {/* Customer Search Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Customer:</span>
            <input
              type="text"
              placeholder="Name..."
              value={filters.customer}
              onChange={(e) => handleChange("customer", e.target.value)}
              className="w-32 bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 outline-none text-xs"
            />
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-colors"
            title="Reset all filters"
          >
            <ArrowPathIcon className="w-3 h-3" />
            <span>Clear</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Close filter bar"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}