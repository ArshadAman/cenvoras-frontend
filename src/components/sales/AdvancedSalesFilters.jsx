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
    <div className="mb-4 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm transition-all duration-300 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
        
        {/* Left side: Expanded filter controls */}
        <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
          
          {/* Financial Year */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">FY:</span>
            <select
              value={filters.financialYear || ""}
              onChange={(e) => handleFinancialYearChange(e.target.value)}
              className="bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs sm:text-sm border border-[var(--border-subtle)] rounded-xl px-3 py-2 outline-none focus:border-[var(--accent-primary)] cursor-pointer"
            >
              <option value="" className="bg-[var(--bg-surface)] text-[var(--text-muted)]">All Financial Years</option>
              <option value="2026-2027" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">FY 2026-27</option>
              <option value="2025-2026" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">FY 2025-26</option>
              <option value="2024-2025" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">FY 2024-25</option>
              <option value="2023-2024" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">FY 2023-24</option>
            </select>
          </div>

          <div className="h-5 w-px bg-[var(--border-subtle)] hidden sm:block"></div>

          {/* Date Range with dd/mm/yyyy */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Date:</span>
            <div className="w-32 sm:w-36">
              <DateInputField
                value={filters.dateRange.start}
                onChange={(e) => handleDateRangeChange("start", e.target.value)}
                placeholder="From"
              />
            </div>
            <span className="text-[var(--text-muted)]">-</span>
            <div className="w-32 sm:w-36">
              <DateInputField
                value={filters.dateRange.end}
                onChange={(e) => handleDateRangeChange("end", e.target.value)}
                placeholder="To"
              />
            </div>
          </div>

          <div className="h-5 w-px bg-[var(--border-subtle)] hidden sm:block"></div>

          {/* Amount Range */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Amount:</span>
            <div className="relative w-28 sm:w-32">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs">₹</span>
              <input
                type="number"
                placeholder="Min"
                value={filters.amountRange.min}
                onChange={(e) => handleAmountRangeChange("min", e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl pl-6 pr-2.5 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-xs sm:text-sm"
              />
            </div>
            <span className="text-[var(--text-muted)]">-</span>
            <div className="relative w-28 sm:w-32">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs">₹</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.amountRange.max}
                onChange={(e) => handleAmountRangeChange("max", e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl pl-6 pr-2.5 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="h-5 w-px bg-[var(--border-subtle)] hidden sm:block"></div>

          {/* Customer Search Filter */}
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <span className="text-[11px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider shrink-0">Customer:</span>
            <input
              type="text"
              placeholder="Search by customer name..."
              value={filters.customer}
              onChange={(e) => handleChange("customer", e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-subtle)] transition-colors"
            title="Reset all filters"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-xl transition-colors"
            title="Close filter bar"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}