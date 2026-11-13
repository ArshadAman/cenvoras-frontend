import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import useEscKey from "../../hooks/useEscStack";
import { getTodayKolkata } from "../../utils/date";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function extractIsoDate(raw) {
  if (!raw || typeof raw !== "string") return "";
  const clean = raw.split("T")[0].trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : "";
}

function isValidYmd(year, month1to12, day) {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month1to12) ||
    !Number.isInteger(day) ||
    month1to12 < 1 ||
    month1to12 > 12 ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }
  const d = new Date(year, month1to12 - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month1to12 - 1 &&
    d.getDate() === day
  );
}

function toIsoString(year, month0to11, day) {
  const m = String(month0to11 + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function buildCalendarDays(viewYear, viewMonth, selectedIso, todayIso, minIso, maxIso) {
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthYear = viewMonth === 0 ? viewYear - 1 : viewYear;
  const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
  const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
  const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear;
  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;

  const cells = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const iso = toIsoString(prevMonthYear, prevMonth, dayNum);
    cells.push({
      iso,
      dayNum,
      inCurrentMonth: false,
      isToday: iso === todayIso,
      isSelected: iso === selectedIso,
      isDisabled: Boolean((minIso && iso < minIso) || (maxIso && iso > maxIso)),
    });
  }

  for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
    const iso = toIsoString(viewYear, viewMonth, dayNum);
    cells.push({
      iso,
      dayNum,
      inCurrentMonth: true,
      isToday: iso === todayIso,
      isSelected: iso === selectedIso,
      isDisabled: Boolean((minIso && iso < minIso) || (maxIso && iso > maxIso)),
    });
  }

  const remaining = 42 - cells.length;
  for (let dayNum = 1; dayNum <= remaining; dayNum++) {
    const iso = toIsoString(nextMonthYear, nextMonth, dayNum);
    cells.push({
      iso,
      dayNum,
      inCurrentMonth: false,
      isToday: iso === todayIso,
      isSelected: iso === selectedIso,
      isDisabled: Boolean((minIso && iso < minIso) || (maxIso && iso > maxIso)),
    });
  }

  return cells;
}

/**
 * Standardized Date Input that guarantees DD/MM/YYYY display format
 * while storing ISO YYYY-MM-DD under the hood for Formik / backend compatibility.
 * Renders a custom themed portal calendar popover that clearly dims prev/next month overflow days.
 */
export default function DateInputField({
  name,
  value,
  onChange,
  onBlur,
  placeholder = "DD/MM/YYYY",
  className = "",
  disabled = false,
  required = false,
  readOnly = false,
  min = "",
  max = "",
  size = "md",
  id,
  wrapperClassName = "",
  ariaInvalid: ariaInvalidProp,
  "aria-invalid": ariaInvalidAttr,
  "aria-label": ariaLabel,
}) {
  const ariaInvalid = ariaInvalidAttr ?? ariaInvalidProp;
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

  const displayToIso = (dispStr) => {
    if (!dispStr || typeof dispStr !== "string") return "";
    const parts = dispStr.split("/");
    if (parts.length === 3 && parts[2].length === 4) {
      const d = Number(parts[0]);
      const m = Number(parts[1]);
      const y = Number(parts[2]);
      if (isValidYmd(y, m, d)) {
        return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }
    return "";
  };

  const normalizedIso = extractIsoDate(value);
  const minIso = extractIsoDate(min);
  const maxIso = extractIsoDate(max);
  const todayIso = getTodayKolkata();

  const [displayValue, setDisplayValue] = useState(() => isoToDisplay(value));
  const [isOpen, setIsOpen] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState({ top: 0, left: 0, placeAbove: false });

  const initialAnchor = normalizedIso || todayIso;
  const [initY, initM] = initialAnchor.split("-").map(Number);
  const [viewYear, setViewYear] = useState(() => initY || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (initM ? initM - 1 : new Date().getMonth()));

  const wrapperRef = useRef(null);
  const popoverRef = useRef(null);
  const hiddenDateInputRef = useRef(null);

  useEscKey(() => setIsOpen(false), isOpen, 35);

  useEffect(() => {
    setDisplayValue(isoToDisplay(value));
  }, [value]);

  useEffect(() => {
    if (!isOpen && normalizedIso) {
      const [y, m] = normalizedIso.split("-").map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
  }, [isOpen, normalizedIso]);

  const updatePosition = useCallback(() => {
    if (!wrapperRef.current || typeof window === "undefined") return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const popoverWidth = 288;
    const popoverHeight = 336;
    const vw = window.innerWidth || 1024;
    const vh = window.innerHeight || 768;

    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    const placeAbove = spaceBelow < popoverHeight && spaceAbove > spaceBelow;

    let top = placeAbove
      ? Math.max(8, rect.top - popoverHeight - 6)
      : Math.min(vh - popoverHeight - 8, rect.bottom + 6);
    if (!placeAbove && rect.bottom + 6 > top) {
      top = Math.max(8, rect.bottom + 6);
    }

    let left = rect.left;
    if (left + popoverWidth > vw - 12) {
      left = Math.max(12, vw - popoverWidth - 12);
    }
    if (left < 12) left = 12;

    setPopoverCoords({ top, left, placeAbove });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current?.contains(event.target) ||
        popoverRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleReposition = () => updatePosition();

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isOpen, updatePosition]);

  const emitChange = (nextIso) => {
    setDisplayValue(nextIso ? isoToDisplay(nextIso) : "");
    onChange?.({ target: { name, value: nextIso } });
  };

  const handleTextChange = (e) => {
    if (readOnly || disabled) return;
    let input = e.target.value.replace(/[^\d/]/g, "");

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
          if ((minIso && iso < minIso) || (maxIso && iso > maxIso)) {
            // Out of bounds: do not emit invalid value to parent
            return;
          }
          onChange?.({ target: { name, value: iso } });
          const [y, m] = iso.split("-").map(Number);
          setViewYear(y);
          setViewMonth(m - 1);
        }
      } else if (input.length === 0) {
        onChange?.({ target: { name, value: "" } });
      }
    }
  };

  const handleBlur = (e) => {
    if (displayValue && displayValue.length === 10) {
      const iso = displayToIso(displayValue);
      if (iso && ((minIso && iso < minIso) || (maxIso && iso > maxIso))) {
        setDisplayValue(normalizedIso ? isoToDisplay(normalizedIso) : "");
      }
    } else if (displayValue && displayValue.length < 10) {
      setDisplayValue(normalizedIso ? isoToDisplay(normalizedIso) : "");
    }
    onBlur?.(e);
  };

  const handleHiddenPickerChange = (e) => {
    const newIso = e.target.value;
    if (newIso) {
      emitChange(newIso);
    } else {
      emitChange("");
    }
  };

  const handleTogglePopover = () => {
    if (disabled || readOnly) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        const anchor = normalizedIso || todayIso;
        const [y, m] = anchor.split("-").map(Number);
        if (y && m) {
          setViewYear(y);
          setViewMonth(m - 1);
        }
      }
      return next;
    });
  };

  const handlePrevMonth = () => {
    const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
    if (minIso) {
      const [minY, minM] = minIso.split("-").map(Number);
      if (prevY < minY || (prevY === minY && prevM + 1 < minM)) return;
    }
    setViewMonth(prevM);
    setViewYear(prevY);
  };

  const handleNextMonth = () => {
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
    if (maxIso) {
      const [maxY, maxM] = maxIso.split("-").map(Number);
      if (nextY > maxY || (nextY === maxY && nextM + 1 > maxM)) return;
    }
    setViewMonth(nextM);
    setViewYear(nextY);
  };

  const handleSelectDay = (cell) => {
    if (cell.isDisabled) return;
    emitChange(cell.iso);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    if ((minIso && todayIso < minIso) || (maxIso && todayIso > maxIso)) return;
    emitChange(todayIso);
    setIsOpen(false);
  };

  const handleClear = () => {
    emitChange("");
    setIsOpen(false);
  };

  const currentYear = Number(todayIso.split("-")[0]) || new Date().getFullYear();
  const minYearLimit = minIso ? Number(minIso.split("-")[0]) : Math.min(1940, viewYear - 5, currentYear - 80);
  const maxYearLimit = maxIso ? Number(maxIso.split("-")[0]) : Math.max(currentYear + 15, viewYear + 5);
  const yearOptions = useMemo(() => {
    const arr = [];
    const startY = Math.max(1940, minYearLimit);
    const endY = Math.max(startY, maxYearLimit);
    for (let y = startY; y <= endY; y++) arr.push(y);
    return arr;
  }, [minYearLimit, maxYearLimit]);

  const isMonthDisabled = (mIdx) => {
    if (minIso) {
      const [minY, minM] = minIso.split("-").map(Number);
      if (viewYear < minY || (viewYear === minY && mIdx + 1 < minM)) return true;
    }
    if (maxIso) {
      const [maxY, maxM] = maxIso.split("-").map(Number);
      if (viewYear > maxY || (viewYear === maxY && mIdx + 1 > maxM)) return true;
    }
    return false;
  };

  const calendarCells = useMemo(
    () => buildCalendarDays(viewYear, viewMonth, normalizedIso, todayIso, minIso, maxIso),
    [viewYear, viewMonth, normalizedIso, todayIso, minIso, maxIso]
  );

  const todayDisabled = Boolean((minIso && todayIso < minIso) || (maxIso && todayIso > maxIso));
  const sizeClass =
    size === "sm"
      ? "rounded-lg pl-2.5 pr-8 py-1.5 text-xs"
      : "rounded-xl pl-4 pr-10 py-2.5 text-sm";

  const widthTokens = [];
  const remainingTokens = [];
  for (const token of String(className || "").split(/\s+/).filter(Boolean)) {
    if (/^(?:[a-z]+:)*w-/.test(token)) {
      widthTokens.push(token);
    } else {
      remainingTokens.push(token);
    }
  }
  const resolvedWrapperWidth = widthTokens.length > 0 ? widthTokens.join(" ") : "w-full";
  const resolvedInputExtra = remainingTokens.join(" ");

  return (
    <div ref={wrapperRef} className={`relative flex items-center ${resolvedWrapperWidth} ${wrapperClassName}`.trim()}>
      <input
        type="text"
        id={id || name}
        name={name}
        value={displayValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.altKey && e.key === "ArrowDown" && !disabled && !readOnly) {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-invalid={ariaInvalid}
        aria-label={ariaLabel}
        autoComplete="off"
        data-no-enter={isOpen ? "true" : undefined}
        className={`w-full bg-[var(--input-bg)] border border-[var(--input-border)] ${sizeClass} text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-all ${resolvedInputExtra}`.trim()}
      />

      <button
        type="button"
        tabIndex={-1}
        onClick={handleTogglePopover}
        disabled={disabled || readOnly}
        aria-label="Open calendar"
        aria-expanded={isOpen}
        className={`absolute ${size === "sm" ? "right-1.5 p-1" : "right-2.5 p-1"} rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-primary)] transition-colors focus:outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
        title="Open calendar"
      >
        <CalendarIcon className={size === "sm" ? "w-4 h-4" : "w-5 h-5"} />
      </button>

      {/* Synced hidden native date input for automated/programmatic form compatibility */}
      <input
        type="date"
        ref={hiddenDateInputRef}
        value={normalizedIso}
        min={minIso || undefined}
        max={maxIso || undefined}
        onChange={handleHiddenPickerChange}
        tabIndex={-1}
        className="sr-only pointer-events-none"
        aria-hidden="true"
      />

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Choose date"
            data-date-calendar-popover="true"
            style={{
              position: "fixed",
              top: `${popoverCoords.top}px`,
              left: `${popoverCoords.left}px`,
              zIndex: 10050,
            }}
            className="w-[288px] rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3.5 shadow-2xl text-[var(--text-primary)] select-none"
          >
            {/* Header: Month/Year Selectors & Chevrons */}
            <div className="flex items-center justify-between gap-1.5 pb-3 mb-2 border-b border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="p-1.5 rounded-lg border border-transparent hover:border-[var(--border-default)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 flex-1 justify-center">
                <select
                  aria-label="Month"
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  className="no-field-highlight bg-[var(--bg-primary)] border border-[var(--input-border)] rounded-lg px-2 py-1 text-xs font-semibold text-[var(--text-primary)] cursor-pointer focus:border-[var(--border-focus)] outline-none"
                >
                  {MONTHS.map((mName, idx) => (
                    <option key={mName} value={idx} disabled={isMonthDisabled(idx)}>
                      {mName}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Year"
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="no-field-highlight bg-[var(--bg-primary)] border border-[var(--input-border)] rounded-lg px-2 py-1 text-xs font-semibold font-mono text-[var(--text-primary)] cursor-pointer focus:border-[var(--border-focus)] outline-none"
                >
                  {yearOptions.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="p-1.5 rounded-lg border border-transparent hover:border-[var(--border-default)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-1 mb-1.5">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid: Overflow prev/next month days clearly dimmed vs current month */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell) => {
                let cellClasses =
                  "h-8 w-full rounded-lg text-xs flex items-center justify-center transition-all border ";

                if (cell.isDisabled) {
                  cellClasses +=
                    "border-transparent text-[var(--text-muted)] opacity-20 cursor-not-allowed line-through";
                } else if (cell.isSelected) {
                  cellClasses +=
                    "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold shadow-sm cursor-pointer";
                } else if (!cell.inCurrentMonth) {
                  cellClasses += cell.isToday
                    ? "border-[var(--border-focus)]/50 text-[var(--accent-primary)] opacity-45 font-normal hover:opacity-80 hover:bg-[var(--bg-primary)] cursor-pointer"
                    : "border-transparent text-[var(--text-muted)] opacity-30 font-normal hover:opacity-65 hover:bg-[var(--bg-primary)] cursor-pointer";
                } else if (cell.isToday) {
                  cellClasses +=
                    "border-[var(--border-focus)] bg-[var(--action-primary-bg)] text-[var(--accent-primary)] font-bold hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] cursor-pointer";
                } else {
                  cellClasses +=
                    "border-transparent text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-primary)] hover:border-[var(--border-default)] cursor-pointer";
                }

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    disabled={cell.isDisabled}
                    onClick={() => handleSelectDay(cell)}
                    data-iso={cell.iso}
                    data-outside-month={cell.inCurrentMonth ? "false" : "true"}
                    aria-selected={cell.isSelected}
                    aria-current={cell.isToday ? "date" : undefined}
                    className={cellClasses}
                  >
                    {cell.dayNum}
                  </button>
                );
              })}
            </div>

            {/* Footer: Clear & Today */}
            <div className="flex items-center justify-between pt-3 mt-2.5 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={todayDisabled}
                onClick={handleSelectToday}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-[var(--accent-primary)] hover:bg-[var(--action-primary-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
