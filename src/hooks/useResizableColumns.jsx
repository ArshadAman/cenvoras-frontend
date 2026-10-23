import { useState } from "react";

export default function useResizableColumns(storageKey, defaultWidths) {
  const [colWidths, setColWidths] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return { ...defaultWidths, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to load column widths", e);
    }
    return defaultWidths;
  });

  const persist = (updated) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save column widths", err);
    }
  };

  const handleMouseDownResize = (e, colKey) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[colKey] || defaultWidths[colKey] || 100;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const minWidth = colKey === "checkbox" ? 36 : 50;
      const newWidth = Math.max(minWidth, startWidth + deltaX);
      setColWidths((prev) => {
        const updated = { ...prev, [colKey]: newWidth };
        persist(updated);
        return updated;
      });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleDoubleClickReset = (colKey) => {
    setColWidths((prev) => {
      const updated = { ...prev, [colKey]: defaultWidths[colKey] };
      persist(updated);
      return updated;
    });
  };

  const renderResizeHandle = (colKey) => (
    <div
      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-[var(--accent-primary)]/50 active:bg-[var(--accent-primary)] transition-colors z-20 group"
      onMouseDown={(e) => handleMouseDownResize(e, colKey)}
      onDoubleClick={() => handleDoubleClickReset(colKey)}
      title="Drag to resize, double-click to reset"
    >
      <div className="w-0.5 h-full mx-auto bg-transparent group-hover:bg-[var(--accent-primary)]/70" />
    </div>
  );

  return { colWidths, renderResizeHandle };
}
