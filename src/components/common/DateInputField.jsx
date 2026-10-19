import React, { useState, useEffect, useRef } from "react";
import { CalendarIcon } from "@heroicons/react/24/outline";

/**
 * Standardized Date Input that guarantees DD/MM/YYYY display format
 * while storing ISO YYYY-MM-DD under the hood for Formik / backend compatibility.
 */
export default function DateInputField({
  name,
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  className = "",
  disabled = false,
  required = false,
  id,
}) {
  // Convert YYYY-MM-DD to DD/MM/YYYY for display
  const isoToDisplay = (isoStr) => {
    if (!isoStr || typeof isoStr !== "string") return "";
    const clean = isoStr.split("T")[0];
    const parts = clean.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      const [y, m, d] = parts;
      return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    }
    return isoStr;
  };

  // Convert DD/MM/YYYY to YYYY-MM-DD for storage
  const displayToIso = (dispStr) => {
    if (!dispStr || typeof dispStr !== "string") return "";
    const parts = dispStr.split("/");
    if (parts.length === 3 && parts[2].length === 4) {
      const [d, m, y] = parts;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    return "";
  };

  const [displayValue, setDisplayValue] = useState(() => isoToDisplay(value));
  const hiddenDateInputRef = useRef(null);

  useEffect(() => {
    setDisplayValue(isoToDisplay(value));
  }, [value]);

  const handleTextChange = (e) => {
    let input = e.target.value.replace(/[^\d/]/g, "");

    // Auto-insert slash if user is typing purely numbers
    if (input.length === 2 && !input.includes("/") && e.nativeEvent?.inputType !== "deleteContentBackward") {
      input = `${input}/`;
    } else if (input.length === 5 && input.split("/").length === 2 && e.nativeEvent?.inputType !== "deleteContentBackward") {
      input = `${input}/`;
    }

    if (input.length <= 10) {
      setDisplayValue(input);
      if (input.length === 10) {
        const iso = displayToIso(input);
        if (iso) {
          onChange?.({ target: { name, value: iso } });
        }
      } else if (input.length === 0) {
        onChange?.({ target: { name, value: "" } });
      }
    }
  };

  const handleHiddenPickerChange = (e) => {
    const newIso = e.target.value; // Returns YYYY-MM-DD
    if (newIso) {
      setDisplayValue(isoToDisplay(newIso));
      onChange?.({ target: { name, value: newIso } });
    }
  };

  const triggerPicker = () => {
    if (disabled) return;
    try {
      if (hiddenDateInputRef.current?.showPicker) {
        hiddenDateInputRef.current.showPicker();
      } else {
        hiddenDateInputRef.current?.focus();
        hiddenDateInputRef.current?.click();
      }
    } catch {
      hiddenDateInputRef.current?.click();
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        id={id || name}
        name={name}
        value={displayValue}
        onChange={handleTextChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete="off"
        className={`w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl pl-4 pr-10 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all ${className}`}
      />

      {/* Calendar Icon Button */}
      <button
        type="button"
        tabIndex={-1}
        onClick={triggerPicker}
        disabled={disabled}
        className="absolute right-2.5 p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors focus:outline-none cursor-pointer"
        title="Open calendar"
      >
        <CalendarIcon className="w-5 h-5" />
      </button>

      {/* Hidden native date input to back the calendar picker */}
      <input
        type="date"
        ref={hiddenDateInputRef}
        value={value ? value.split("T")[0] : ""}
        onChange={handleHiddenPickerChange}
        tabIndex={-1}
        className="sr-only pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
