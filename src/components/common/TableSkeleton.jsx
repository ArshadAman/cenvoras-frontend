import React from 'react';

/**
 * Universal Table Skeleton Component
 * Strictly adheres to Cenvora's 8-color design system.
 * Avoids washed out white flashes in light mode by using semantic tokens.
 */
export default function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 animate-pulse">
      <div className="grid gap-2">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, idx) => (
            <div key={`header-${idx}`} className="h-4 rounded bg-[var(--text-muted)]/20 mx-2" />
          ))}
        </div>

        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid py-2"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={`cell-${rowIndex}-${colIndex}`} className="h-3 rounded bg-[var(--text-muted)]/10 mx-2" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
