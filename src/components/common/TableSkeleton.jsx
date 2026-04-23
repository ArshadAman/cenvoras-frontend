import React from 'react';

export default function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse">
      <div className="grid gap-2">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, idx) => (
            <div key={`header-${idx}`} className="h-4 rounded bg-white/15 mx-2" />
          ))}
        </div>

        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid py-2"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={`cell-${rowIndex}-${colIndex}`} className="h-3 rounded bg-white/10 mx-2" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
