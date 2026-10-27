import React from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

/** Prominent stock-data warnings for P&L and Balance Sheet (from the backend `inventory` block). */
export default function StockWarningBanner({ inventory }) {
  const warnings = inventory?.warnings || [];
  if (!inventory || (!inventory.stock_data_incomplete && warnings.length === 0)) return null;
  return (
    <div role="alert" className="rounded-xl border-2 border-[var(--status-danger)] bg-[var(--status-danger)]/10 p-4 space-y-2">
      <div className="flex items-center gap-2 font-bold text-[var(--status-danger)]">
        <ExclamationTriangleIcon className="w-5 h-5" />
        {inventory.stock_data_incomplete ? "Stock data incomplete — profit is not reliable until this is fixed" : "Check stock data"}
      </div>
      <ul className="list-disc pl-6 text-sm text-[var(--text-primary)] space-y-1">
        {warnings.map((w, i) => <li key={i}>{w}</li>)}
      </ul>
    </div>
  );
}
