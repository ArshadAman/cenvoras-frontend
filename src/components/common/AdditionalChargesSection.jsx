import React from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { getCurrencySymbol } from "../../utils/currency";

export const PRESET_CHARGE_NAMES = [
  "Freight & Shipping",
  "Packaging & Forwarding",
  "Loading & Unloading",
  "Insurance",
  "Custom / Other",
];

// Revised GST slabs: 0, 3, 5, 18, 28, 40
export const REVISED_GST_RATES = [
  { value: 0, label: "0% (No GST / Exempt)" },
  { value: 3, label: "3% GST" },
  { value: 5, label: "5% GST" },
  { value: 18, label: "18% GST" },
  { value: 28, label: "28% GST" },
  { value: 40, label: "40% GST" },
];

export default function AdditionalChargesSection({
  charges = [],
  onChange,
  isTaxLocked = false,
  isInterstate = false,
  readOnly = false,
}) {
  const currency = getCurrencySymbol();

  const handleAddCharge = () => {
    const newCharge = {
      id: `charge-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: "Freight & Shipping",
      amount: "",
      tax_rate: isTaxLocked ? 0 : 0,
    };
    onChange?.([...(charges || []), newCharge]);
  };

  const handleRemoveCharge = (index) => {
    const updated = [...(charges || [])];
    updated.splice(index, 1);
    onChange?.(updated);
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...(charges || [])];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange?.(updated);
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <span>Miscellaneous Expenses & Charges</span>
            {charges.length > 0 && (
              <span className="text-[10px] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2 py-0.5 rounded-full font-mono font-medium">
                {charges.length}
              </span>
            )}
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Freight, packing, forwarding, loading, etc. May carry GST or be exempt.
          </p>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={handleAddCharge}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 transition-colors cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        )}
      </div>

      {charges.length === 0 ? (
        <div className="text-center py-4 border border-dashed border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-muted)]">
          No miscellaneous expenses added.
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddCharge}
              className="ml-2 text-[var(--accent-primary)] hover:underline font-medium cursor-pointer"
            >
              + Add Freight / Packing / Loading
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {charges.map((charge, idx) => {
            const amountNum = Math.max(0, parseFloat(charge.amount) || 0);
            const taxRateNum = isTaxLocked ? 0 : Math.max(0, parseFloat(charge.tax_rate) || 0);
            const lineTax = (amountNum * taxRateNum) / 100;
            const lineTotal = amountNum + lineTax;

            const isStandardPreset = PRESET_CHARGE_NAMES.includes(charge.name) && charge.name !== "Custom / Other";

            return (
              <div
                key={charge.id || idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-subtle)] text-xs"
              >
                {/* Expense Name / Preset (5 cols) */}
                <div className="sm:col-span-5 space-y-1">
                  <div className="flex gap-2">
                    <select
                      value={isStandardPreset ? charge.name : "Custom / Other"}
                      disabled={readOnly}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "Custom / Other") {
                          handleFieldChange(idx, "name", isStandardPreset ? "" : charge.name);
                        } else {
                          handleFieldChange(idx, "name", val);
                        }
                      }}
                      className="bg-[var(--bg-surface)] border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[var(--accent-primary)]"
                    >
                      {PRESET_CHARGE_NAMES.map((preset) => (
                        <option key={preset} value={preset}>
                          {preset}
                        </option>
                      ))}
                    </select>

                    {!isStandardPreset && (
                      <input
                        type="text"
                        placeholder="Expense description..."
                        disabled={readOnly}
                        value={charge.name || ""}
                        onChange={(e) => handleFieldChange(idx, "name", e.target.value)}
                        className="flex-1 bg-[var(--bg-surface)] border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[var(--accent-primary)]"
                      />
                    )}
                  </div>
                </div>

                {/* Amount (3 cols) */}
                <div className="sm:col-span-3">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-mono text-xs">
                      {currency}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      disabled={readOnly}
                      value={charge.amount !== undefined ? charge.amount : ""}
                      onChange={(e) => handleFieldChange(idx, "amount", e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--input-border)] text-[var(--text-primary)] font-mono font-medium rounded-lg text-xs outline-none focus:border-[var(--accent-primary)] text-right"
                    />
                  </div>
                </div>

                {/* GST Rate (2 cols) */}
                <div className="sm:col-span-2">
                  <select
                    value={isTaxLocked ? 0 : (charge.tax_rate !== undefined ? charge.tax_rate : 0)}
                    disabled={readOnly || isTaxLocked}
                    onChange={(e) => handleFieldChange(idx, "tax_rate", Number(e.target.value))}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[var(--accent-primary)]"
                    title={isTaxLocked ? "GST locked (composition / unregistered)" : "Select GST rate for this charge"}
                  >
                    {REVISED_GST_RATES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Computed Total & Action (2 cols) */}
                <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 text-right">
                  <div className="font-mono">
                    <div className="font-semibold text-[var(--text-primary)]">
                      {currency}{lineTotal.toFixed(2)}
                    </div>
                    {taxRateNum > 0 && (
                      <div className="text-[10px] text-[var(--text-muted)]">
                        +{currency}{lineTax.toFixed(2)} {isInterstate ? "IGST" : "GST"}
                      </div>
                    )}
                  </div>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCharge(idx)}
                      className="p-1 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                      title="Remove charge"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
